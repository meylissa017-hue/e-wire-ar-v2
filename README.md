# E-WIRE AR — versi web

Versi pelayar bagi permainan E-WIRE AR, dibuat supaya **iPhone** boleh bermain tanpa memasang
apa-apa. Versi Android (projek Unity `E-WIRE-AR-Fresh`) kekal sebagai produk utama; kandungan
dan aliran skrin di sini sengaja disamakan dengannya.

## Kandungan

- Menu Utama, Pilih Level, Level 1–9, Keputusan (dengan sijil pencapaian)
- Mod **Kampung 3D**: 6 misi dalam satu diorama kampung (label, HINT A/B/C, seret kabel)
- Narasi suara BM untuk arahan Level 6–9 & Kampung (Web Speech; boleh dimatikan dalam Tetapan)
- Modul "Terokai Sistem Solar" dan "Membina Litar Elektrik"
- Penanda AR: poster E-WIRE AR (dan corak hitam-putih lama) — sama seperti versi Android

## Teknologi

- [MindAR](https://github.com/hiukim/mind-ar-js) 1.2.5 (penjejakan imej) + three.js 0.160, kedua-duanya
  disimpan dalam `vendor/` — tiada CDN diperlukan.
- **Jangan tukar kepada WebXR**: Safari iOS tidak menyokongnya.
- Tiada langkah bina: fail statik sahaja. Kamera memerlukan **HTTPS** (atau `localhost`).

## Struktur

| Laluan | Kandungan |
| --- | --- |
| `index.html`, `css/app.css` | Semua skrin dan gaya (tema di blok `:root`) |
| `js/data.js` | Soalan, label, markah — salinan `DataPermainan.cs` |
| `js/simpan.js` | Kemajuan pemain (localStorage) |
| `js/ar.js` | Kamera, penjejakan, penempatan kandungan pada skrin |
| `js/level.js` | Level 1–5 |
| `js/level6.js` … `js/level9.js` | Level 6–9 (sentuh/seret objek 3D) |
| `js/kampung.js`, `js/kampung-data.js` | Mod Kampung 3D (salinan `KampungPermainan/KampungMisi/DataKampung.cs`) |
| `js/hud.js`, `js/alat3d.js` | Panel bawah (HUDBawah), animasi, sentuhan 3D, zarah, X-Ray |
| `js/suara.js`, `js/sijil.js` | Suara BM, sijil pencapaian |
| `js/pamer.js` | Solar dan Litar (termasuk animasi) |
| `models/*.glb`, `models/tekstur/` | Model dieksport daripada `BlenderSources/*.blend` projek Unity + tekstur |
| `penanda/` | `poster.png`, `corak.png` dan hasil kompil `penanda.mind` |

## Jalankan & uji di komputer

```
python -m http.server 8765 --bind 127.0.0.1      # di folder ini
```

- `http://127.0.0.1:8765/?pratonton` — paparan 3D tanpa kamera (semua skrin boleh diuji)
- `?skrin=solar` (atau `level1` … `level5`, `litar`, `pilih`, `keputusan`) — terus ke satu skrin

Skrip ujian (perlukan `npm install` dalam `tools/`, dan pelayan di atas sedang berjalan):

| Arahan | Fungsi |
| --- | --- |
| `node tools/uji.mjs <folder>` | Tangkapan skrin semua skrin + ralat konsol |
| `node tools/uji-main.mjs <folder>` | Main habis kesembilan level (L6–9 diketik/diseret pada objek 3D), sahkan 660 XP |
| `node tools/uji-kampung.mjs <folder>` | Main habis 6 misi Kampung 3D |
| `node tools/uji-l.mjs <skrin> <fail.png> [ms]` | Tangkap satu skrin (pilihan: `SKRIP=` arahan Playwright) |
| `node tools/uji-kamera.mjs <video.mjpeg> <folder>` | Penjejakan AR dengan kamera palsu |
| `node tools/kompil.mjs` | Kompil semula `penanda/penanda.mind` selepas menukar gambar penanda |
| `node tools/telefon.mjs` | Periksa tab Chrome pada telefon Android melalui USB |

## Bila versi Android berubah

- Soalan/label/markah: kemas kini `js/data.js`.
- Model 3D: `blender -b <fail>.blend --python BlenderSources/eksport_web.py -- models/<fail>.glb`
  (skrip dalam projek Unity; membawa warna bucu/AO Kampung dan UV kedua). Tekstur: `models/tekstur/`.
- Poster/penanda: ganti `penanda/poster.png`, kemudian `node tools/kompil.mjs`.
