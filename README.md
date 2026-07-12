# KeepBox

All-in-one downloader, frontend murni + 1 serverless function di Vercel, tanpa VPS.

## Struktur

```
keepbox/
  index.html
  style.css
  script.js
  api/
    download.js
  package.json
```

`api/download.js` otomatis kebaca Vercel sebagai serverless function di endpoint `/api/download`. Sisanya static file, dilayani langsung dari CDN Vercel.

## Jalanin lokal

```
npm install
npx vercel dev
```

## Deploy ke Vercel

1. Push folder ini ke GitHub repo.
2. Import repo di vercel.com -> New Project.
3. Framework preset: Other. Build command kosongin, output directory kosongin (biarin default).
4. Deploy.

Gak perlu env var apapun, gak perlu VPS, gak perlu backend terpisah — semua jalan di serverless function bawaan Vercel.

## Catatan soal source scraper

`api/download.js` motong logic dari script yang lu kasih (wowdownloader.com), plus fungsi `detectTool()` buat nebak tool yang cocok berdasarkan domain/URL yang di-paste user (TikTok, YouTube, Instagram, Facebook, X, Pinterest, LinkedIn, Douyin, Likee, SoundCloud, Spotify, Apple Music).

Kalau nanti wowdownloader.com ganti struktur token/cookie-nya, tinggal update di `wowdownloader()` function aja, frontend gak perlu diutak-atik.
