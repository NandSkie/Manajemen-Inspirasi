// functions/api/upload-image.js
// Upload gambar (avatar/background) jadi file di repo GitHub (folder public/uploads/),
// lalu dikembalikan URL CDN-nya (jsDelivr, gratis & cepat karena di-cache di banyak negara).
// Gambar TIDAK disimpan sebagai base64 di dalam config.json - itu bikin repo berat & lambat.

import { uploadImage } from '../_lib/github-store.js';

async function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  if (Date.now() - Number(ts) > 1000 * 60 * 60 * 24) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(ts));
  const expected = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === sig;
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  const ok = await verifyToken(token, env.ADMIN_PASSWORD);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { dataUrl, name } = await request.json();
    if (!dataUrl) return new Response(JSON.stringify({ error: 'dataUrl kosong' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // batas ukuran: base64 ~1.37x ukuran asli, kita batasi ~2MB base64 (~1.4MB gambar asli)
    if (dataUrl.length > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Gambar terlalu besar. Kompres dulu, maks sekitar 1.4MB.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const ext = (dataUrl.match(/^data:image\/(\w+);/) || [, 'jpg'])[1].replace('jpeg', 'jpg');
    const safeName = (name || 'image').replace(/[^a-z0-9_-]/gi, '').slice(0, 30) || 'image';
    const filename = `${safeName}-${Date.now()}.${ext}`;

    const { cdnUrl } = await uploadImage(env, dataUrl, filename);
    return new Response(JSON.stringify({ success: true, url: cdnUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
