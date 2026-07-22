# Link Bio — Versi Tanpa KV (Storage: GitHub Repo)

Sama kayak sebelumnya (Cloudflare Pages + Pages Functions), tapi database-nya
diganti: bukan Cloudflare KV, melainkan repo GitHub kamu sendiri. Setiap kali
kamu klik "Simpan" di `/panel`, sistem commit otomatis ke file `linktree-data.json`
di repo lewat GitHub API pakai token.

## Kenapa bisa tanpa KV?
GitHub punya API buat baca/tulis isi file di repo (Contents API). Jadi repo
GitHub kamu dipakai sebagai "database" — nggak perlu servis database terpisah.

## Struktur tambahan
```
functions/_lib/github-store.js   <- helper baca/tulis file ke GitHub (dgn retry)
functions/api/config.js          <- GET/POST config, storage: GitHub
functions/api/upload-image.js    <- upload gambar jadi file di repo + CDN
```

## Soal Gambar (avatar / background) — pakai CDN
Gambar **tidak** disimpan sebagai base64 di dalam `linktree-data.json` (itu bikin
file data berat & lambat dibaca). Sebagai gantinya:
1. Waktu kamu upload foto di panel, foto itu di-commit sebagai file asli ke
   `public/uploads/nama-file.jpg` di repo kamu.
2. Yang disimpan di config cuma **link CDN**-nya, pakai **jsDelivr**
   (`https://cdn.jsdelivr.net/gh/USER/REPO@main/public/uploads/nama-file.jpg`) —
   gratis, cepat, dan otomatis kecache di banyak lokasi server dunia.

Catatan jsDelivr: kadang butuh beberapa menit sampai 12 jam buat update cache
kalau kamu re-upload file dengan **nama yang sama**. Karena sistem ini otomatis
kasih nama file unik pakai timestamp (`avatar-1737...jpg`), masalah itu praktis
nggak kejadian. Kalau butuh purge manual, buka:
`https://purge.jsdelivr.net/gh/USER/REPO@main/public/uploads/nama-file.jpg`

## Langkah Setup

### 1. Bikin GitHub Personal Access Token
1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. **Repository access**: pilih "Only select repositories" → pilih repo kamu ini aja
3. **Permissions** → **Repository permissions** → **Contents**: pilih **Read and write**
4. Generate, lalu **copy token-nya** (cuma muncul sekali)

### 2. Upload project ke GitHub
Push semua isi folder ini ke repo GitHub kamu (termasuk `functions/` dan `public/`).

### 3. Connect ke Cloudflare Pages
1. Dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pilih repo kamu
3. Build settings:
   - **Build command**: kosongkan
   - **Build output directory**: `public`
4. Deploy dulu (nanti masih error, wajar, env var belum diisi)

### 4. Set Environment Variables
Project Pages kamu → **Settings** → **Environment variables** → tambahkan (untuk Production):

| Nama | Isi |
|---|---|
| `GITHUB_TOKEN` | token dari langkah 1 |
| `GITHUB_USER` | username GitHub kamu |
| `GITHUB_REPO` | nama repo ini |
| `GITHUB_BRANCH` | `main` (atau nama branch kamu) |
| `ADMIN_PASSWORD` | password buat login ke `/panel`, bebas kamu tentuin |

### 5. Redeploy
Klik **Retry deployment** biar env var kepakai.

### 6. Pakai
- Halaman publik: `https://nama-project.pages.dev/`
- Panel admin: `https://nama-project.pages.dev/panel`

Setiap simpan perubahan atau upload gambar di panel = otomatis jadi commit baru
di repo GitHub kamu (bisa kamu lihat history-nya di tab **Commits**).

## Kelebihan & Kekurangan dibanding versi KV

**Kelebihan:**
- Gak perlu setup KV namespace terpisah
- Semua histori perubahan tersimpan sebagai commit history GitHub (bisa di-rollback)
- Gambar otomatis lewat CDN jsDelivr, tanpa layanan tambahan

**Kekurangan:**
- Tiap simpan = 1 commit baru ke repo (kalau sangat sering ganti-ganti dalam hitungan detik, bisa numpuk commit)
- GitHub API ada rate limit (5000 request/jam pakai token — jauh lebih dari cukup untuk pemakaian normal)
- Sedikit lebih lambat dibanding KV (biasanya tetap di bawah 1 detik)

## Catatan Keamanan
`GITHUB_TOKEN` itu setara kunci penuh ke repo (kalau scope-nya benar cuma dikasih
ke 1 repo, risikonya terbatas ke repo itu saja). Jangan pernah taruh token ini
di kode/HTML yang keliatan di browser — di sini token cuma dipakai di dalam
`functions/` (server-side), aman.
