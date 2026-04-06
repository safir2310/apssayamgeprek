# 🚀 Setup Database Neon & Deployment ke Vercel

## 📋 Panduan Lengkap

### Langkah 1: Membuat Database di Neon

1. **Buka Console Neon**
   - Kunjungi: https://console.neon.tech
   - Login atau daftar akun baru

2. **Buat Project Baru**
   - Klik "Create a project"
   - Pilih region yang terdekat dengan lokasi Anda (misalnya: Singapore)
   - Beri nama project, misalnya: `apssayamgeprek`
   - Pilih PostgreSQL version (default sudah compatible)
   - Klik "Create project"

3. **Copy Connection String**
   - Setelah project dibuat, Anda akan melihat connection string di dashboard
   - Klik "Copy" pada connection string
   - Formatnya seperti: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - **Simpan connection string ini untuk langkah selanjutnya**

4. **Cek Connection String di Neon Console**
   - Di project dashboard, klik "Connection Details"
   - Pilih tab "Connection string"
   - Copy connection string format: `postgresql://user:pass@host/dbname?sslmode=require`

### Langkah 2: Deploy ke Vercel

**Opsi A: Upload ke Vercel Melalui GitHub (Recommended)**

1. **Pastikan code sudah di GitHub** ✅ (sudah dilakukan sebelumnya)
   - Repository: https://github.com/safir2310/apssayamgeprek

2. **Deploy ke Vercel**
   - Buka: https://vercel.com/new
   - Import repository GitHub: `safir2310/apssayamgeprek`
   - Vercel akan otomatis mendeteksi Next.js project

3. **Konfigurasi Environment Variables**
   - Pada halaman "Configure Project", scroll ke "Environment Variables"
   - Tambahkan environment variable berikut:

   ```
   Name: DATABASE_URL
   Value: (paste connection string dari Neon)
   ```

   ```
   Name: NEXTAUTH_URL
   Value: https://apssayamgeprek.vercel.app
   ```

   ```
   Name: NEXTAUTH_SECRET
   Value: (generate random string, misalnya: openssl rand -base64 32)
   ```

4. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build dan deployment selesai
   - Vercel akan otomatis menjalankan `prisma generate` dan membuat tabel di Neon database

5. **Setuju untuk Push Changes**
   - Vercel akan menawarkan untuk mem-pull environment variables ke repo Anda
   - Pilih "No" untuk menjaga secret tetap di Vercel

**Opsi B: Menggunakan Neon-Vercel Integration**

1. **Install Neon Integration di Vercel**
   - Buka: https://vercel.com/integrations/neon
   - Klik "Add Integration"
   - Pilih akun Vercel Anda

2. **Pilih Project**
   - Pilih project: `apssayamgeprek` (atau buat baru jika belum ada)
   - Pilih workspace Neon Anda

3. **Hubungkan ke Database**
   - Pilih database Neon yang sudah dibuat di Langkah 1
   - Neon akan otomatis menambahkan `DATABASE_URL` ke environment variables Vercel

4. **Deploy**
   - Klik "Deploy to Vercel"
   - Tunggu proses selesai

### Langkah 3: Verifikasi Database di Neon

1. **Buka Neon Console**
   - Kunjungi: https://console.neon.tech
   - Pilih project `apssayamgeprek`

2. **Cek Tabel yang Dibuat**
   - Klik "SQL Editor" di sidebar
   - Jalankan query:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

3. **Cek Data**
   - Pastikan semua tabel sudah dibuat otomatis oleh Prisma
   - Tabel yang seharusnya ada: User, Role, Product, Category, Transaction, dll.

### Langkah 4: Setup Local Development dengan Neon (Opsional)

Jika ingin menggunakan Neon untuk development lokal:

1. **Update .env.local**
   ```bash
   DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-dev-secret
   ```

2. **Jalankan Migration**
   ```bash
   bun run db:push
   ```

3. **Start Development Server**
   ```bash
   bun run dev
   ```

### Langkah 5: Mengelola Database di Neon Console

**Mengakses SQL Editor**
- Buka Neon Console
- Pilih project
- Klik "SQL Editor"
- Anda bisa menjalankan query SQL langsung

**Backup Database**
- Neon otomatis melakukan backup
- Untuk manual backup, gunakan SQL Editor dan export data

**Monitoring**
- Dashboard Neon menunjukkan usage dan performance
- Cek "Metrics" di sidebar untuk monitoring real-time

### Troubleshooting

**Error: Connection timeout**
- Cek apakah connection string benar
- Pastikan `?sslmode=require` ada di akhir connection string

**Error: Prisma Client not generated**
- Pastikan script `postinstall` ada di package.json
- Re-deploy di Vercel

**Error: Database not found**
- Pastikan database sudah dibuat di Neon
- Cek nama database di connection string

**Error: Migration failed**
- Cek apakah tabel sudah ada di Neon
- Bisa drop database dan re-deploy untuk fresh start

## 📝 Summary

✅ Database Neon sudah siap
✅ Project sudah di GitHub
✅ Siap untuk deploy ke Vercel
✅ Schema Prisma sudah diupdate untuk PostgreSQL
✅ Script build sudah diupdate

## 🎯 Next Steps

1. Buat database di Neon (Langkah 1)
2. Deploy ke Vercel (Langkah 2)
3. Verifikasi database (Langkah 3)
4. Test aplikasi di production
5. Setup custom domain (opsional)

## 📚 Link Penting

- Neon Console: https://console.neon.tech
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repository: https://github.com/safir2310/apssayamgeprek
- Prisma Docs: https://www.prisma.io/docs
