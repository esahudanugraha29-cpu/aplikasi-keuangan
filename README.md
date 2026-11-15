# Dompetku

Aplikasi pencatatan keuangan pribadi yang bersih, modern, dan smooth. Dibuat untuk dipakai sehari-hari: catat transaksi dalam hitungan detik, pantau arus kas, jaga anggaran, dan capai target tabungan.

Semua data tersimpan **lokal di browser** (localStorage) — tanpa akun, tanpa server, tanpa pelacakan.

## Fitur

- **Dashboard** — total saldo, pemasukan/pengeluaran bulan ini, rasio tabungan, grafik arus kas 6 bulan, dan donut pengeluaran per kategori.
- **Transaksi** — pemasukan, pengeluaran, dan transfer antar dompet; pencarian, filter jenis/bulan/dompet, pengelompokan per hari.
- **Dompet** — kelola rekening bank, tunai, dompet digital, kartu kredit, dan investasi. Saldo dihitung otomatis.
- **Anggaran** — batas bulanan per kategori dengan indikator warna dan salinan dari bulan sebelumnya.
- **Target Tabungan** — target dengan progres, tenggat, dan penambahan dana.
- **Laporan** — perbandingan 6 bulan, rincian kategori, distribusi saldo, insight otomatis, dan ekspor CSV.
- **Pengaturan** — nama profil, tema terang/gelap, sembunyikan nominal, backup/restore JSON, reset demo.
- **PWA** — dapat di-install di desktop/HP dan tetap terbuka saat offline setelah kunjungan pertama.

## Teknologi

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4
- Zustand (state + persist localStorage)
- Recharts (grafik)
- Framer Motion (transisi halus)
- Lucide (ikon)
- date-fns (format tanggal Indonesia)

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://127.0.0.1:5173`.

Build produksi:

```bash
npm run build
npm run preview
```

## Catatan data

- Data demo 6 bulan dimuat otomatis pada kunjungan pertama.
- Gunakan **Pengaturan → Backup JSON** secara berkala. Menghapus data browser akan menghapus catatan.
- Format uang: Rupiah (`id-ID`), tanggal: Bahasa Indonesia.
