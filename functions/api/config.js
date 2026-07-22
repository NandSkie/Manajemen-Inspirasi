// functions/api/config.js
// Storage: repo GitHub kamu sendiri (bukan KV). Env var yang wajib diset di
// Cloudflare Pages > Settings > Environment variables:
//   GITHUB_TOKEN   - Personal Access Token (scope: Contents read & write, repo ini saja)
//   GITHUB_USER    - username GitHub kamu
//   GITHUB_REPO    - nama repo ini
//   ADMIN_PASSWORD - password buat login /panel
//   GITHUB_BRANCH  - opsional, default "main"

import { readData, updateData } from '../_lib/github-store.js';

const DEFAULT_CONFIG = {
  profile: { avatar: "", name: "@namamu", bio: "Deskripsi singkat kamu", verified: false },
  theme: {
    backgroundType: "gradient",
    backgroundColor: "#14b8a6",
    gradientFrom: "#2dd4bf",
    gradientTo: "#0284c7",
    gradientAngle: 135,
    backgroundImage: "",
    textColor: "#ffffff",
    subTextColor: "rgba(255,255,255,.85)",
    buttonColor: "#22c55e",
    buttonTextColor: "#ffffff",
    buttonShape: "rounded",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowBlur: 14,
    layoutAlign: "top",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
  },
  socials: [],
  whatsapp: { enabled: false, number: "", message: "", floating: true },
  links: []
};

async function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  if (Date.now() - Number(ts) > 1000 * 60 * 60 * 24) return false; // 24 jam
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(ts));
  const expected = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === sig;
}

export async function onRequestGet({ env }) {
  try {
    const { data } = await readData(env, DEFAULT_CONFIG);
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  const ok = await verifyToken(token, env.ADMIN_PASSWORD);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const newConfig = await request.json();
  try {
    await updateData(env, () => newConfig, { fallback: DEFAULT_CONFIG, message: 'update linktree config lewat /panel' });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
