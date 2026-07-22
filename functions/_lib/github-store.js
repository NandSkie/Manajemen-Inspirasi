// functions/_lib/github-store.js
// Baca/tulis file JSON & file gambar ke repo GitHub, dipakai sebagai
// "database" pengganti KV. Ada retry otomatis kalau ada race condition (409).

const CONFIG_FILE = 'linktree-data.json';

function base64ToUtf8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function repoInfo(env) {
  const user = env.GITHUB_USER;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  if (!user || !repo) throw new Error('GITHUB_USER / GITHUB_REPO belum diset di environment variable');
  return { user, repo, branch };
}

function contentsUrl(env, path) {
  const { user, repo } = repoInfo(env);
  return `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
}

function githubHeaders(env) {
  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN environment variable tidak ditemukan');
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'linktree-clone-cf-pages'
  };
}

/** Baca JSON config terkini + sha-nya. fallback dipakai kalau file belum ada (404). */
export async function readData(env, fallback = {}) {
  const { branch } = repoInfo(env);
  const res = await fetch(`${contentsUrl(env, CONFIG_FILE)}?ref=${branch}`, { headers: githubHeaders(env) });
  if (res.status === 404) return { data: fallback, sha: null };
  if (!res.ok) throw new Error(`GitHub GET error: ${res.status} - ${await res.text()}`);
  const json = await res.json();
  return { data: JSON.parse(base64ToUtf8(json.content)), sha: json.sha };
}

async function writeRaw(env, path, base64Content, sha, message) {
  const { branch } = repoInfo(env);
  const body = { message: message || `update ${path} - ${new Date().toISOString()}`, content: base64Content, branch, ...(sha ? { sha } : {}) };
  const res = await fetch(contentsUrl(env, path), { method: 'PUT', headers: githubHeaders(env), body: JSON.stringify(body) });
  if (res.status === 409) {
    const err = new Error('GitHub write conflict (409), perlu retry');
    err.conflict = true;
    throw err;
  }
  if (!res.ok) throw new Error(`GitHub PUT error: ${res.status} - ${await res.text()}`);
  const json = await res.json();
  return json.content.sha;
}

/**
 * Baca data terbaru -> jalankan mutatorFn(data) -> tulis balik.
 * Kalau ada race condition (409) otomatis retry beberapa kali.
 */
export async function updateData(env, mutatorFn, options = {}) {
  const { fallback = {}, message, maxRetries = 4 } = options;
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, sha } = await readData(env, fallback);
    const updated = await mutatorFn(data);
    const base64Content = utf8ToBase64(JSON.stringify(updated, null, 2));
    try {
      await writeRaw(env, CONFIG_FILE, base64Content, sha, message);
      return { data: updated };
    } catch (e) {
      if (e.conflict && attempt < maxRetries) {
        lastErr = e;
        await new Promise(r => setTimeout(r, 120 * (attempt + 1) + Math.random() * 100));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/**
 * Upload file biner (gambar) ke repo, mis. public/uploads/avatar-xxxx.jpg
 * dataUrl = "data:image/png;base64,AAAA..." dari <input type="file">
 * Return: path file di repo + URL CDN (jsDelivr) siap pakai.
 */
export async function uploadImage(env, dataUrl, filename) {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error('Format gambar tidak valid');
  const base64Content = match[2];
  const path = `public/uploads/${filename}`;

  // cek apakah file udah ada (buat dapetin sha kalau overwrite nama sama)
  let sha = null;
  const { branch } = repoInfo(env);
  const existing = await fetch(`${contentsUrl(env, path)}?ref=${branch}`, { headers: githubHeaders(env) });
  if (existing.ok) sha = (await existing.json()).sha;

  await writeRaw(env, path, base64Content, sha, `upload image ${filename}`);
  const { user, repo } = repoInfo(env);
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
  return { path, cdnUrl };
}
