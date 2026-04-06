# 🚀 Panduan Deployment ke Vercel dengan Database Neon

## ✅ Status Saat Ini

- ✅ Project sudah di GitHub: https://github.com/safir2310/apssayamgeprek
- ✅ Database Neon sudah dibuat dan terkonfigurasi
- ✅ Schema sudah di-push ke database Neon
- ✅ Environment files sudah disiapkan

## 📋 Langkah-Langkah Deployment

### Langkah 1: Import Project ke Vercel

1. **Buka Vercel Dashboard**
   - Kunjungi: https://vercel.com/new
   - Login dengan akun GitHub Anda

2. **Import Repository**
   - Pilih repository: `safir2310/apssayamgeprek`
   - Vercel akan otomatis mendeteksi Next.js project
   - Klik "Import"

### Langkah 2: Konfigurasi Project

#### Framework Preset
- **Framework Preset**: Next.js (terdeteksi otomatis)
- **Root Directory**: `./` (default)
- **Build Command**: `bun run build` (default sudah diupdate)
- **Output Directory**: `.next` (default)
- **Install Command**: `bun install` (default)

#### Environment Variables

Tambahkan environment variables berikut dengan mengklik "Add New":

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_URL` | `https://apssayamgeprek.vercel.app` (atau domain custom Anda) |
| `NEXTAUTH_SECRET` | `apssayamgeprek-secret-key-2024-production-secure-random-string` |

**PENTING**: Setelah deploy pertama, update `NEXTAUTH_URL` dengan URL yang diberikan oleh Vercel.

### Langkah 3: Deploy

1. Klik **"Deploy"** di bagian bawah
2. Tunggu proses build dan deployment
3. Vercel akan:
   - Install dependencies
   - Generate Prisma Client (`prisma generate`)
   - Build Next.js application
   - Deploy ke Vercel infrastructure

### Langkah 4: Verifikasi Deployment

1. Setelah deployment selesai, buka URL yang diberikan
2. Pastikan aplikasi berjalan dengan baik
3. Test fitur-fitur utama:
   - Login sebagai kasir/admin
   - Transaksi POS
   - Manajemen produk
   - Laporan penjualan

### Langkah 5: Update NEXTAUTH_URL (Opsional)

Jika URL Vercel berbeda dengan yang diharapkan:

1. Pergi ke **Settings → Environment Variables**
2. Cari `NEXTAUTH_URL`
3. Update dengan URL yang benar
4. Re-deploy dengan mengklik "Redeploy" di Deployments tab

## 🔧 Environment Variables Detail

### DATABASE_URL
**Untuk Production (Vercel)**:
```
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Untuk Development (Local)**:
```
postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Perbedaan:
- Production: menggunakan `-pooler` untuk koneksi yang lebih efisien
- Development: menggunakan non-pooled untuk debugging yang lebih mudah

### NEXTAUTH_URL
- **Development**: `http://localhost:3000`
- **Production**: `https://apssayamgeprek.vercel.app` atau domain custom Anda

### NEXTAUTH_SECRET
Secret key untuk NextAuth.js. Gunakan string yang unik dan aman.

## 📊 Database Tables

Semua tabel sudah berhasil dibuat di Neon database:

1. User & Role Management
   - User
   - Role

2. Product & Category Management
   - Product
   - Category

3. Order Management
   - Order
   - OrderItem

4. POS Transaction Management
   - CashierShift
   - Transaction
   - TransactionItem
   - Payment

5. Void Transaction System
   - VoidLog

6. Member Loyalty System
   - Member
   - PointHistory

7. Promo Management
   - Promo

8. Stock Management
   - StockLog

9. Report Management
   - Report

10. Store Settings
    - Settings

11. Payment Method Management
    - PaymentMethod

12. Point Exchange System
    - PointExchangeProduct
    - RedeemCode

## 🎯 Setelah Deployment Sukses

### 1. Setup Initial Data

Anda perlu membuat data awal seperti:

- **Roles**: Admin, Kasir, Owner, User
- **Admin User**: User dengan role Admin
- **Categories**: Kategori produk (misal: Ayam Geprek, Minuman, dll)
- **Products**: Produk-produk dengan harga dan stok
- **Settings**: Nama toko, alamat, telepon

### 2. Setup Demo Accounts

Untuk testing, buat beberapa demo accounts:

**Admin Demo**:
- Username/Email: `admin@apssayamgeprek.com`
- Password: `admin123`
- Role: Admin

**Kasir Demo**:
- Username/Email: `kasir@apssayamgeprek.com`
- Password: `kasir123`
- Role: Kasir

### 3. Configure Payment Methods

Setup metode pembayaran yang tersedia:
- Tunai (CASH)
- QRIS
- Kartu Debit (DEBIT)
- Transfer Bank (TRANSFER)
- E-Wallet (E_WALLET)

### 4. Setup Store Information

Update informasi toko:
- Nama toko: "APS S Ayam Geprek"
- Alamat
- Nomor telepon
- QRIS (jika ada)

## 🔄 Workflow Deployment Selanjutnya

### Untuk Update Code

1. Push changes ke GitHub:
   ```bash
   git add .
   git commit -m "feat: your commit message"
   git push origin main
   ```

2. Vercel akan otomatis mendeteksi dan re-deploy

### Untuk Update Schema Database

1. Update `prisma/schema.prisma`
2. Push ke GitHub
3. Di Vercel, deploy akan otomatis menjalankan migration
4. Atau gunakan Neon SQL Editor untuk manual migration

## 🐛 Troubleshooting

### Error: Database connection failed

**Masalah**: Tidak bisa terhubung ke database Neon

**Solusi**:
- Cek `DATABASE_URL` di environment variables Vercel
- Pastikan connection string benar
- Cek apakah database Neon masih aktif

### Error: Prisma Client not generated

**Masalah**: Prisma Client tidak ter-generate saat build

**Solusi**:
- Pastikan script `postinstall` ada di `package.json`
- Re-deploy di Vercel
- Check logs di Vercel Dashboard

### Error: NEXTAUTH_URL mismatch

**Masalah**: URL NextAuth tidak sesuai dengan URL Vercel

**Solusi**:
- Update `NEXTAUTH_URL` dengan URL Vercel yang benar
- Re-deploy project

### Error: Build failed

**Masalah**: Build process gagal

**Solusi**:
- Cek build logs di Vercel Dashboard
- Pastikan semua dependencies ter-install
- Cek apakah ada error di code

## 📈 Monitoring

### Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Pilih project `apssayamgeprek`
- Monitor:
  - Build status
  - Deployment history
  - Logs
  - Analytics
  - Environment variables

### Neon Console
- Visit: https://console.neon.tech
- Pilih project `apssayamgeprek`
- Monitor:
  - Database usage
  - Connection pool
  - Query performance
  - Storage usage

## 🔐 Security Best Practices

1. **Environment Variables**
   - Jangan pernah commit `.env` file ke GitHub
   - Gunakan environment variables yang berbeda untuk dev dan prod
   - Rotate secret keys secara berkala

2. **Database Access**
   - Limit database access hanya dari IP Vercel
   - Gunakan connection string yang aman
   - Enable SSL connection (sudah default di Neon)

3. **API Routes**
   - Validate semua input
   - Implement rate limiting
   - Use authentication & authorization

## 📚 Link Penting

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Console**: https://console.neon.tech
- **GitHub Repository**: https://github.com/safir2310/apssayamgeprek
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs

## 🎉 Selamat!

Project APS S Ayam Geprek sudah siap untuk production! Deploy ke Vercel sekarang dan mulai gunakan aplikasi POS Anda.

---

**Note**: Jika ada masalah selama deployment, cek logs di Vercel Dashboard dan Neon Console untuk informasi lebih detail.
