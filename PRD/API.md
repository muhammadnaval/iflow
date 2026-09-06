# API.md: DzuhurScan

## 1. Autentikasi & Otorisasi

DzuhurScan menggunakan **session-based authentication** dari Laravel Breeze. Setelah login berhasil, server mengirimkan cookie sesi (`laravel_session`) dan token CSRF. Seluruh request (kecuali login) wajib menyertakan header `X-XSRF-TOKEN` yang diambil dari cookie `XSRF-TOKEN`.

**Format Header:**
```
Cookie: laravel_session=<session_id>
X-XSRF-TOKEN: <csrf_token>
Accept: application/json
```

**Role & Otorisasi:**
| Role | Kemampuan |
|---:|---:|
| `admin` | Import siswa, kelola tahun ajaran, generate QR, kelola pengguna |
| `petugas` | Scan QR presensi, lihat dashboard |
| `kepala` | Lihat dashboard & laporan bulanan |

Otorisasi divalidasi di sisi server menggunakan middleware `role:admin|petugas|kepala`. Endpoint yang memerlukan role tertentu akan mengembalikan `403 Forbidden` jika akses ditolak.

---

## 2. Format Response Standar

**Response Sukses:**
```json
{
  "success": true,
  "message": "Presensi berhasil dicatat",
  "data": { }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "NISN tidak ditemukan",
  "errors": { "field": ["Error detail"] }
}
```

**Format Pagination:**
```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 120,
    "last_page": 8
  }
}
```

---

## 3. Endpoint API

### 3.1 Autentikasi

#### POST /api/v1/auth/login
Login pengguna (admin, petugas, atau kepala madrasah).

- **Auth:** Publik (tanpa sesi)
- **Request Body:**
```json
{
  "email": "petugas@mtsn3padang.sch.id",
  "password": "secret123",
  "remember": true
}
```
- **Response Body (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "petugas@mtsn3padang.sch.id",
      "role": "petugas"
    },
    "redirect": "/scan"
  }
}
```
- **Status Codes:**
| Kode | Deskripsi |
|---:|---:|
| 200 | Login berhasil |
| 401 | Kredensial salah |
| 422 | Validasi gagal (email/password kosong) |

#### POST /api/v1/auth/logout
Mengakhiri sesi pengguna.

- **Auth:** Semua role (login)
- **Request Body:** Kosong
- **Response Body (200):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```
- **Status Codes:** 200 sukses, 401 tidak terautentikasi

---

### 3.2 Import Data Siswa

#### POST /api/v1/admin/students/import
Mengunggah file Excel berisi data siswa kelas VII–IX untuk tahun ajaran aktif.

- **Auth:** `admin`
- **Deskripsi:** File divalidasi (kolom `nisn`, `nama`, `kelas`, `jenis_kelamin`). Duplikat NISN ditolak. Jika tahun ajaran baru, data lama otomatis diarsipkan (soft delete) sebelum import.
- **Request Body:** `multipart/form-data`
```json
{
  "file": "data_siswa.xlsx",
  "academic_year_id": 2
}
```
- **Response Body (201):**
```json
{
  "success": true,
  "message": "Berhasil mengimpor 312 siswa",
  "data": {
    "total_imported": 312,
    "total_rejected": 3,
    "rejected_rows": [
      { "row": 4, "nisn": "123456", "reason": "NISN duplikat" }
    ]
  }
}
```
- **Status Codes:**
| Kode | Deskripsi |
|---:|---:|
| 201 | Import berhasil |
| 400 | Format file tidak valid |
| 403 | Bukan admin |
| 422 | Template tidak sesuai / kolom wajib kosong |

---

### 3.3 Presensi Scan QR

#### POST /api/v1/presence/scan
Mencatat presensi Dzuhur berdasarkan pemindaian QR code kartu siswa.

- **Auth:** `petugas`
- **Deskripsi:** Sistem memverifikasi NISN terhadap siswa aktif pada tahun ajaran berjalan. Validasi jendela waktu presensi (FR-05) dan duplikasi scan harian (FR-06) dilakukan di endpoint ini.
- **Request Body:**
```json
{
  "nisn": "0067123456"
}
```
- **Response Body (200) — HADIR:**
```json
{
  "success": true,
  "message": "Presensi berhasil — Ananda Ahmad Fauzi",
  "data": {
    "student": {
      "nisn": "0067123456",
      "name": "Ahmad Fauzi",
      "class": "VII-A"
    },
    "status": "HADIR",
    "scanned_at": "2025-01-15 12:05:23"
  }
}
```
- **Response Body (200) — TERLAMBAT:**
```json
{
  "success": true,
  "message": "Presensi tercatat — status TERLAMBAT",
  "data": {
    "student": { "nisn": "0067123456", "name": "Ahmad Fauzi", "class": "VII-A" },
    "status": "TERLAMBAT",
    "scanned_at": "2025-01-15 12:20:10"
  }
}
```
- **Response Body (409) — DUPLIKAT:**
```json
{
  "success": false,
  "message": "Siswa sudah tercatat hadir hari ini",
  "data": {
    "status": "DUPLICATE",
    "existing_record": {
      "status": "HADIR",
      "scanned_at": "2025-01-15 12:03:45"
    }
  }
}
```
- **Status Codes:**
| Kode | Deskripsi |
|---:|---:|
| 200 | Presensi berhasil (HADIR/TERLAMBAT) |
| 403 | Bukan petugas / di luar jendela waktu (`REJECTED`) |
| 404 | NISN tidak ditemukan pada tahun ajaran aktif |
| 409 | Scan duplikat pada hari yang sama |

---

### 3.4 Dashboard Realtime

#### GET /api/v1/presence/dashboard
Mengambil ringkasan presensi hari ini untuk dashboard realtime.

- **Auth:** Semua role (login)
- **Deskripsi:** Data ditampilkan realtime melalui Laravel Echo + Pusher pada channel `presence.dashboard`. Endpoint ini digunakan untuk inisialisasi awal halaman.
- **Query Parameters:**
| Parameter | Tipe | Wajib | Deskripsi |
|---:|---:|---:|---:|
| `date` | date | Tidak | Filter tanggal (default: hari ini) |
| `class` | string | Tidak | Filter kelas (contoh: `VII-A`) |
- **Response Body (200):**
```json
{
  "success": true,
  "data": {
    "total_students": 312,
    "total_present": 245,
    "total_late": 12,
    "total_absent": 55,
    "percentage": 82.4,
    "recent_scans": [
      {
        "id": 1024,
        "student_name": "Ahmad Fauzi",
        "class": "VII-A",
        "status": "HADIR",
        "scanned_at": "2025-01-15 12:05:23"
      }
    ],
    "presence_window": {
      "start_time": "11:45:00",
      "end_time": "12:30:00"
    }
  }
}
```
- **Status Codes:** 200 sukses, 401 tidak terautentikasi

---

### 3.5 Laporan Bulanan

#### GET /api/v1/reports/monthly-student
Mengambil rekap kehadiran per siswa untuk bulan tertentu, difilter berdasarkan kelas.

- **Auth:** `admin` dan `kepala`
- **Query Parameters:**
| Parameter | Tipe | Wajib | Deskripsi |
|---:|---:|---:|---:|
| `month` | int | Ya | Bulan (1–12) |
| `year` | int | Ya | Tahun (contoh: 2025) |
| `class` | string | Tidak | Filter kelas (contoh: `VIII-B`) |
| `page` | int | Tidak | Halaman (default: 1) |
- **Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "nisn": "0067123456",
      "name": "Ahmad Fauzi",
      "class": "VIII-B",
      "total_hadir": 20,
      "total_terlambat": 2,
      "total_alpha": 3,
      "percentage": 86.9
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 120,
    "last_page": 8
  },
  "meta": {
    "month": 1,
    "year": 2025,
    "total_school_days": 25
  }
}
```
- **Status Codes:** 200 sukses, 403 akses ditolak (petugas), 422 parameter tidak valid

---

## 4. Catatan Implementasi

- **Realtime Event:** Setiap keberhasilan scan pada endpoint `POST /api/v1/presence/scan` memicu event `PresenceRecorded` yang di-broadcast ke channel `presence.dashboard` melalui Pusher. Frontend React mendengarkan event ini untuk memperbarui dashboard tanpa reload.
- **Rate Limiting:** Endpoint `POST /api/v1/presence/scan` dilindungi rate limiter 60 request/menit per pengguna untuk mencegah spam scan.
- **Audit Trail:** Seluruh request scan dan operasi import dicatat pada tabel `audit_logs` dengan timestamp dan ID pengguna pelaku (FR-11).
- **Referensi Dokumen Lain:** Skema database lengkap (tabel `students`, `academic_years`, `presence_records`, dll.) dijelaskan pada [DATABASE.md]. Detail alur arsip tahun ajaran dan logika bisnis presensi dijelaskan pada [PRD.md].