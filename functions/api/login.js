export async function onRequestPost({ request, env }) {
  const { password } = await request.json().catch(() => ({}));
  if (!env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'ADMIN_PASSWORD belum diset di environment variable.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  if (password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Password salah' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const ts = Date.now().toString();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(env.ADMIN_PASSWORD), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(ts));
  const sig = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const token = `${ts}.${sig}`;
  return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' } });
}
