# STK Daily Report 2.0

Aplikasi web single-file untuk manajemen laporan harian konstruksi **PT. Solusi Teknologi Konstruksi**. Seluruh aplikasi berada dalam satu file `index.html` (HTML + CSS + JavaScript), berjalan sepenuhnya di browser tanpa server.

## Fitur Utama

- **Data Proyek** — master data proyek (nama, lokasi, nomor proyek, owner, estimator, tim) yang dipakai bersama oleh semua modul laporan.
- **Survey** — laporan survey lokasi dengan foto; dapat dikonversi menjadi proyek dan daily report.
- **Daily Report** — laporan harian dengan material, peralatan, cuaca, foto dokumentasi, catatan progres & kendala.
- **Weekly Report** — ringkasan mingguan otomatis dari daily report (rekap material, peralatan, cuaca, tenaga kerja) plus lampiran PDF (target, progress, S-curve). Ringkasan dan tabel sumber yang panjang otomatis dipecah ke beberapa halaman A4 agar tidak terpotong; tombol **Simpan Progress** menyimpan edit tanpa keluar dari mode edit.
- **Laporan Progress** — laporan berkala dengan tabel bobot pekerjaan, kendala + solusi, material, tenaga, alat, dan tanda tangan.
- **Berita Acara** — BA dengan checklist pemeriksaan, foto, dan tanda tangan.
- **Berita Acara 0.1** — varian BA dengan fitur dan tata letak yang sama, tanpa nama/logo perusahaan pada header dan footer hasil export.
- **Export PDF** — semua laporan di-render ke halaman A4 siap cetak (via iframe print).
- **Import PDF** — membaca PDF daily report yang sudah ada (via pdf.js) untuk mengimpor data material/peralatan/foto.
- **Input Suara** — mengisi material/peralatan lewat suara (Web Speech API, bahasa Indonesia), termasuk parsing angka bahasa Indonesia ("lima puluh sak").
- **Penyimpanan** — localStorage untuk data teks + IndexedDB untuk foto/lampiran besar (base64 data URL di-offload agar tidak melampaui kuota localStorage); backup/restore JSON. Penyimpanan dioptimalkan untuk ponsel: hanya blob foto yang berubah yang ditulis ulang ke IndexedDB, sehingga autosave ringan saat mengetik.

## Backup Ringan

Jika backup biasa terlalu besar (banyak foto) dan aplikasi freeze: gunakan tombol **Backup Ringan** (JSON tanpa foto), atau buka `export-lite.html` di alamat yang sama dengan aplikasi (tanpa memuat aplikasi) lalu unduh `stk-lite.json`.

## Cara Menggunakan

Buka `index.html` di browser (disarankan Google Chrome untuk fitur suara; aplikasi juga berjalan di Brave/ponsel). Data tersimpan di browser lokal, tanpa backend.

## Versi

`2026.09.18.berita-acara-01`

## Struktur

```
index.html   — seluruh aplikasi (UI, logika, export/import PDF)
README.md    — dokumentasi ini
AUDIT.md     — catatan hasil audit & perbaikan bug
*.pdf        — contoh hasil export (berita acara kosong, weekly report)
```
