# Dompetku

Aplikasi pencatatan keuangan pribadi yang bersih, modern, dan smooth. Dibuat untuk dipakai sehari-hari: catat transaksi dalam hitungan detik, pantau arus kas, jaga anggaran, dan capai target tabungan.

Data tersimpan **lokal di browser** (localStorage) secara default — tanpa akun, tanpa server, tanpa pelacakan. Bila mau, aktifkan **sinkronisasi cloud opsional** ke database PostgreSQL gratis (Supabase) supaya data bisa dibuka di perangkat lain.

## Fitur

- **Dashboard** — total saldo, pemasukan/pengeluaran bulan ini, rasio tabungan, grafik arus kas 6 bulan, dan donut pengeluaran per kategori.
- **Transaksi** — pemasukan, pengeluaran, dan transfer antar dompet; pencarian, filter jenis/bulan/dompet, pengelompokan per hari.
- **Dompet** — kelola rekening bank, tunai, dompet digital, kartu kredit, dan investasi. Saldo dihitung otomatis.
- **Anggaran** — batas bulanan per kategori dengan indikator warna dan salinan dari bulan sebelumnya.
- **Target Tabungan** — target dengan progres, tenggat, dan penambahan dana.
- **Laporan** — perbandingan 6 bulan, rincian kategori, distribusi saldo, insight otomatis, dan ekspor CSV.
- **Pengaturan** — nama profil, tema terang/gelap, sembunyikan nominal, backup/restore JSON, reset demo.
- **Sinkronisasi cloud (opsional)** — akun email + database Supabase gratis, sinkron otomatis antar perangkat, ambil/timpa data, dan tetap berjalan offline tanpa akun.
- **PWA** — dapat di-install di desktop/HP dan tetap terbuka saat offline setelah kunjungan pertama.

## Teknologi

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4
- Zustand (state + persist localStorage)
- Supabase (Postgres + Auth + RLS) — dimuat malas, hanya jika database dikonfigurasi
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

## Database (opsional)

Ingin data aman dan bisa dibuka di HP + laptop? Ikuti panduan langkah demi langkah di **[SETUP-DATABASE.md](SETUP-DATABASE.md)**: buat project Supabase gratis, jalankan [`supabase/schema.sql`](supabase/schema.sql), lalu tempel URL + anon key di **Pengaturan → Akun & sinkronisasi cloud**.

Ringkasnya:

1. Buat project di [supabase.com](https://supabase.com) (plan Free, region Singapore).
2. SQL Editor → tempel isi `supabase/schema.sql` → Run.
3. Salin **Project URL** + **anon public key** → tempel di aplikasi, atau set sebagai repository **Variables** `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` agar aktif untuk semua pengunjung.
4. Daftar akun di aplikasi, lalu pilih arah sinkronisasi pertama.

Tanpa langkah ini aplikasi tetap berfungsi penuh secara lokal; bundel Supabase bahkan tidak diunduh.

## Catatan data

- Data demo 6 bulan dimuat otomatis pada kunjungan pertama.
- Gunakan **Pengaturan → Backup JSON** secara berkala. Menghapus data browser akan menghapus catatan lokal (data cloud tetap ada bila sinkronisasi aktif).
- Format uang: Rupiah (`id-ID`), tanggal: Bahasa Indonesia.
