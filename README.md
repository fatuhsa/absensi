# Aplikasi Web Absensi (GPS Radius + Foto Bukti)

Aplikasi kehadiran karyawan berbasis web (full-stack dalam satu repo). Absensi divalidasi dengan **GPS radius** (geofencing — karyawan harus berada dalam radius lokasi kantor) dan setiap absensi **menyimpan foto sebagai bukti** ke database.

- **Frontend**: React 19 + Vite, component-based, mobile-first (React Router)
- **Backend**: Node.js HTTP murni (`node:http`) + `node:sqlite` (tanpa framework, tanpa dependency native)
- **Auth**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Database**: SQLite via `node:sqlite` (DatabaseSync)

## Fitur

- **Login** dengan peran admin / karyawan
- **Absensi** (karyawan): absen masuk, pulang, dan lembur masuk/selesai
  - Validasi GPS: harus berada dalam radius kantor
  - Foto diambil via kamera dan tersimpan sebagai bukti
- **Dashboard** (admin): statistik kehadiran hari ini
- **Karyawan** (admin): CRUD karyawan + akun login
- **Lokasi kantor** (admin): atur titik koordinat + radius geofencing
- **Laporan** (admin): rekap hadir & lembur bulanan
- **Riwayat** (karyawan): riwayat absensi pribadi + foto bukti

## Struktur

```
absensi-f/
├── backend/                  # Backend Node (HTTP murni)
│   ├── src/
│   │   ├── server.js         # Entry: HTTP server, routing, static uploads
│   │   ├── db.js             # node:sqlite schema + seed admin & lokasi
│   │   ├── auth.js           # JWT sign/verify, middleware requireAuth/requireRole
│   │   ├── geo.js            # Haversine + validasi radius
│   │   └── routes/           # auth, employees, location, attendance, report
│   └── uploads/              # foto bukti absensi
├── src/                      # Frontend React
│   ├── api.js                # fetch wrapper (JWT, /api)
│   ├── geo.js                # geolocation + haversine (client)
│   ├── components/           # UI reusable (Button, Card, Input, Modal, ...)
│   └── pages/                # Login, Dashboard, Attendance, History, ...
├── vite.config.js            # proxy /api & /uploads → :3001
└── package.json
```

## Menjalankan

Butuh **Node.js v22+** (memakai `node:sqlite` bawaan) dan **pnpm**.

### 1. Backend

```bash
cd backend
pnpm install
pnpm start        # server di http://localhost:3001
```

### 2. Frontend

```bash
# dari root repo
pnpm install
pnpm run dev      # frontend di http://localhost:5173
```

Buka `http://localhost:5173`. Login admin default: **admin / admin123**.

> Kamera & geolocation hanya berfungsi di **HTTPS atau localhost**. `pnpm run dev` di localhost sudah cukup untuk pengujian.

## Alur Penggunaan

1. **Login** sebagai admin (`admin`/`admin123`).
2. Buka **Lokasi** → atur titik kantor + radius (meter).
3. Buka **Karyawan** → tambah karyawan (buat akun login karyawan).
4. **Logout**, login sebagai karyawan.
5. Buka **Absensi** → izinkan kamera & lokasi → pilih jenis absen (Masuk/Pulang/Lembur) → ambil foto → dapatkan lokasi → simpan.
   - Jika di luar radius kantor → ditolak "Di luar area kantor".
6. Admin bisa melihat **Dashboard** & **Laporan** bulanan.

## Catatan

- Database dibuat otomatis saat pertama kali backend dijalankan (`backend/absensi.db`).
- Foto bukti tersimpan di `backend/uploads/` dan dilayani via `/uploads/`.
- API endpoint: lihat `backend/src/routes/` untuk detail.
