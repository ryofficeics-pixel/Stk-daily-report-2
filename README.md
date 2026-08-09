# STK Daily Report 2.0

Aplikasi web single-file untuk manajemen laporan harian konstruksi **PT. Solusi Teknologi Konstruksi**. Seluruh aplikasi berada dalam satu file `index.html` (HTML + CSS + JavaScript), berjalan sepenuhnya di browser tanpa server.

## Fitur Utama

- **Data Proyek** — master data proyek (nama, lokasi, nomor proyek, owner, estimator, tim) yang dipakai bersama oleh semua modul laporan.
- **Survey** — laporan survey lokasi dengan foto; dapat dikonversi menjadi proyek dan daily report.
- **Daily Report** — laporan harian dengan material, peralatan, cuaca, foto dokumentasi, catatan progres & kendala.
- **Weekly Report** — ringkasan mingguan otomatis dari daily report (rekap material, peralatan, cuaca, tenaga kerja) plus lampiran PDF (target, progress, S-curve).
- **Laporan Progress** — laporan berkala dengan tabel bobot pekerjaan, kendala + solusi, material, tenaga, alat, dan tanda tangan.
- **Berita Acara** — BA dengan checklist pemeriksaan, foto, dan tanda tangan.
- **Export PDF** — semua laporan di-render ke halaman A4 siap cetak (via iframe print).
- **Import PDF** — membaca PDF daily report yang sudah ada (via pdf.js) untuk mengimpor data material/peralatan/foto.
- **Input Suara** — mengisi material/peralatan lewat suara (Web Speech API, bahasa Indonesia), termasuk parsing angka bahasa Indonesia ("lima puluh sak").
- **Penyimpanan** — localStorage untuk data teks + IndexedDB untuk foto/lampiran besar (base64 data URL di-offload agar tidak melampaui kuota localStorage); backup/restore JSON.

## Cara Menggunakan

Buka `index.html` di browser (disarankan Google Chrome untuk fitur suara). Data tersimpan di browser lokal, tanpa backend.

## Versi

`2026.05.20.project-sync-human-ui`

## Struktur

```
index.html   — seluruh aplikasi (UI, logika, export/import PDF)
README.md    — dokumentasi ini
```
