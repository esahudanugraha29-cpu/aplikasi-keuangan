# Menyiapkan Database Gratis (Supabase)

Dompetku tetap berjalan **100% lokal** tanpa database. Panduan ini membuat pencadangan cloud opsional: data bisa dibuka di perangkat lain dan tidak hilang saat cache browser dibersihkan.

Stack yang dipakai: **Supabase** — PostgreSQL + Auth + Row Level Security, gratis untuk pemakaian pribadi.

---

## 1. Buat project Supabase

1. Buka [supabase.com](https://supabase.com) → **Start your project** → daftar dengan GitHub/email.
2. **New project**:
   - Name: `dompetku`
   - Database Password: buat password kuat (simpan, jarang dipakai lagi)
   - Region: **Southeast Asia (Singapore)** — paling dekat ke Indonesia
   - Plan: **Free**
3. Tunggu ±2 menit sampai project selesai dibuat.

## 2. Jalankan skema database

1. Di dashboard project, buka **SQL Editor** → **New query**.
2. Buka file [`supabase/schema.sql`](supabase/schema.sql) di repo ini, salin **seluruh isinya**, tempel ke editor.
3. Klik **Run** (atau `Ctrl+Enter`).
4. Verifikasi — jalankan query ini, hasilnya harus **6 baris**:

   ```sql
   select table_name, row_security
   from information_schema.tables
   where table_schema = 'public' and table_name like 'dompetku_%';
   ```

Skema aman dijalankan ulang (idempoten). Yang dibuat:

| Tabel | Isi |
| --- | --- |
| `dompetku_profiles` | nama profil + preferensi sembunyikan saldo |
| `dompetku_wallets` | dompet/rekening |
| `dompetku_categories` | kategori pemasukan/pengeluaran |
| `dompetku_transactions` | transaksi (pemasukan, pengeluaran, transfer) |
| `dompetku_budgets` | anggaran bulanan per kategori |
| `dompetku_goals` | target tabungan |

Setiap baris terikat ke `auth.uid()` lewat **Row Level Security**, dan role `anon` tidak diberi akses tabel sama sekali.

## 3. Ambil kredensial

Buka **Project Settings → API** (atau **Data API**):

- **Project URL** — contoh `https://abcdefghijklm.supabase.co`
- **anon public** key — string panjang berawalan `eyJ...`

Keduanya **aman dipakai di browser**. Keamanan data dijaga oleh RLS, bukan oleh kerahasiaan anon key. Jangan pernah memakai `service_role` key di aplikasi web.

## 4. Hubungkan aplikasi

Pilih salah satu (boleh keduanya):

**A. Tanpa build ulang — cara tercepat**

1. Buka Dompetku → **Pengaturan** → kartu **Akun & sinkronisasi cloud**.
2. Tempel **Project URL** dan **Anon public key** → **Hubungkan database**.
3. Halaman akan dimuat ulang dan formulir **Masuk / Daftar** muncul.

Kredensial disimpan di `localStorage` perangkat itu saja (`dompetku-cloud-config-v1`), bukan di repo.

**B. Untuk semua pengunjung situs (build-time)**

Di repo GitHub: **Settings → Secrets and variables → Actions → Variables → New repository variable**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

Lalu jalankan ulang workflow **Deploy to GitHub Pages** (Actions → Deploy → Re-run), atau push commit baru. Workflow `.github/workflows/deploy.yml` sudah membaca kedua variabel ini saat build, sehingga pengunjung situs langsung melihat formulir login tanpa mengisi apa pun.

Untuk pengembangan lokal: salin `.env.example` menjadi `.env.local` dan isi nilainya. (`VITE_*` ikut ter-bundle ke JS publik — itu normal dan aman untuk anon key.)

## 5. Buat akun & sinkronkan

1. Di kartu cloud, pilih **Daftar**, isi email + password (minimal 6 karakter).
2. **Konfirmasi email**: secara default Supabase meminta klik tautan konfirmasi sebelum bisa masuk.
   - Cara cepat untuk pemakaian pribadi: **Authentication → Sign In / Providers → Email → matikan "Confirm email"** → Save. Setelah itu akun langsung aktif.
   - Jika dibiarkan aktif: buka email dari Supabase, klik tautan konfirmasi, lalu **Masuk** di aplikasi.
3. Setelah masuk, tentukan arah sinkronisasi **sekali saja**:
   - **Cloud masih kosong** → klik **Sinkronkan sekarang** untuk mengirim data perangkat ini.
   - **Cloud sudah berisi data** → pilih **Ambil dari cloud** (perangkat ini mengikuti cloud) atau **Timpa dengan data lokal**.
4. Pilihan ini diingat lewat penanda `deviceSyncedFor`, jadi reload berikutnya tidak bertanya lagi dan **sinkron otomatis** langsung berjalan.

### Perangkat kedua

Pasang/instal aplikasi → masuk dengan akun yang sama → pilih **Ambil dari cloud**. Data langsung tersalin. Setelah itu semua perubahan dikirim otomatis (debounce ±1,5 detik).

### Yang disinkronkan

Seluruh isi aplikasi: profil, dompet, kategori, transaksi, anggaran, dan target tabungan. Modelnya **mirror penuh** — setiap sinkronisasi menyamakan cloud dengan isi perangkat (baris yang sudah dihapus lokal juga dihapus di cloud).

## 6. Batas paket gratis

| Batas | Nilai |
| --- | --- |
| Project aktif | 2 |
| Ukuran database | 500 MB (data teks seperti ini jauh di bawahnya) |
| Pengguna auth bulanan | 50.000 MAU |
| Egress | 5 GB/bulan |
| Project tidak aktif | **di-pause setelah ±7 hari tanpa aktivitas** |

Project yang di-pause **tidak menghapus data**. Buka dashboard Supabase → **Restore project**; setelah aktif, sinkronisasi jalan lagi. Tetap simpan **Backup JSON** berkala dari Pengaturan sebagai lapisan aman tambahan.

## 7. Jika ada masalah

| Gejala | Penyebab & solusi |
| --- | --- |
| `new row violates row-level security policy` | Skema belum dijalankan di project yang benar, atau URL/key berasal dari project lain. Jalankan ulang `supabase/schema.sql`. |
| `Invalid login credentials` | Email/password salah, atau akun belum dikonfirmasi. |
| `Email not confirmed` | Klik tautan di email Supabase, atau matikan "Confirm email" (langkah 5). |
| `Failed to fetch` / `TypeError: fetch failed` | Project di-pause, URL salah, atau offline. |
| Data tidak muncul di perangkat lain | Pastikan sudah **Ambil dari cloud** minimal sekali di perangkat tersebut, dan memakai akun yang sama. |
| Tombol sinkron tidak bereaksi | Status **Perlu pilihan** menunggu keputusan arah; pilih salah satu tombol yang muncul. |

## 8. Memutuskan koneksi

**Pengaturan → Putuskan koneksi database** menghapus URL + anon key dari perangkat ini dan mengembalikan aplikasi ke mode lokal. Data di cloud **tidak** terhapus dan data lokal tetap utuh. Untuk menghapus data cloud, lakukan dari dashboard Supabase (Table Editor) atau dengan menghapus project.
