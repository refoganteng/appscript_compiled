# Product Requirements Document (PRD)
## Dashboard Identifikasi Conflict of Interest (CoI)
**BPS Kabupaten Kepahiang**

---

| | |
|---|---|
| **Versi** | 1.1 |
| **Tanggal** | April 2026 |
| **Platform** | Google Apps Script (GAS) + Google Sheets |
| **Status** | Draft |

---

## 1. Latar Belakang

BPS Kabupaten Kepahiang dalam rangka pembangunan **Zona Integritas menuju WBK/WBBM** wajib mengimplementasikan penguatan pengawasan sebagai bagian dari **Pilar 5**. Salah satu bentuk konkretnya adalah pengelolaan dan pendokumentasian potensi *Conflict of Interest* (CoI) antara pegawai organik BPS dengan mitra statistik yang direkrut setiap tahunnya.

Saat ini belum ada sistem yang mencatat secara formal hubungan personal antara pegawai organik dan mitra statistik. Sistem ini dibangun untuk mengisi kekosongan tersebut secara terstruktur, transparan, dan terdokumentasi.

---

## 2. Tujuan

- Menyediakan media bagi pegawai organik untuk **mendeklarasikan potensi CoI** secara mandiri dan proaktif
- Menghasilkan **rekap tahunan** potensi CoI yang dapat digunakan oleh pimpinan sebagai bahan pengawasan
- Mendukung kelengkapan **dokumen bukti Zona Integritas** Pilar 5 (Penguatan Pengawasan)
- Membiasakan budaya **transparansi dan integritas** di lingkungan BPS Kepahiang

---

## 3. Pengguna (User)

| Role | Deskripsi |
|---|---|
| **Pegawai Organik** | Login dengan username & password (NIP), mengisi identifikasi potensi CoI |
| **Admin / Pimpinan** | Melihat dashboard dan daftar potensi CoI seluruh pegawai (akses penuh) |

> Untuk tahap awal, semua pegawai organik memiliki role yang sama. Pembedaan admin dapat ditambahkan di versi berikutnya.

---

## 4. Sumber Data (Google Sheets)

### 4.1 Sheet: `organik`
Data pegawai organik BPS Kepahiang.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `Nama` | String | Nama lengkap pegawai |
| `NIP` | String | Nomor Induk Pegawai (digunakan sebagai password) |
| `Username` | String | Username untuk login |
| `Email` | String | Email BPS pegawai |

### 4.2 Sheet: `mitra`
Data mitra statistik per tahun. **Kolom `Tahun` ditambahkan di posisi paling kiri (kolom A).**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `Tahun` | Number | Tahun kegiatan mitra (kolom baru, paling kiri) |
| `Nama Lengkap` | String | Nama mitra statistik |
| `Posisi` | String | Posisi mitra (Mitra Pendataan / Mitra Pengolahan / dll) |
| `Alamat Detail` | String | Alamat lengkap mitra |

### 4.3 Sheet: `coi_log`
Log identifikasi potensi CoI. **Dibuat otomatis oleh `Setup.gs`**, tidak perlu dibuat manual.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `Timestamp` | DateTime | Waktu pengisian |
| `Tahun` | Number | Tahun kegiatan yang dilaporkan |
| `NIP Pelapor` | String | NIP pegawai yang mengisi |
| `Nama Pelapor` | String | Nama pegawai yang mengisi |
| `Nama Mitra` | String | Nama mitra yang dilaporkan |
| `Posisi Mitra` | String | Posisi mitra yang dilaporkan |
| `Hubungan` | String | Keterangan hubungan (diisi manual, contoh: "Adik kandung") |
| `Keterangan Tambahan` | String | Catatan tambahan jika ada |

---

## 5. Fitur & Halaman

### 5.1 Halaman Login

**Deskripsi:** Halaman pertama saat aplikasi dibuka. Login menggunakan username dan NIP sebagai password.

**Komponen:**
- Input: `Username`
- Input: `Password` (NIP, type=password)
- Tombol: `Masuk`
- Pesan error jika username/NIP salah

**Logika:**
- Cari `username` di sheet `organik`
- Cocokkan NIP sebagai password
- Jika cocok → simpan session → redirect ke Dashboard
- Jika tidak → tampilkan pesan error

---

### 5.2 Menu: Dashboard

**Deskripsi:** Ringkasan statistik CoI untuk tahun yang dipilih.

**Komponen:**
- Filter tahun (dropdown, default: tahun berjalan)
- Kartu statistik:
  - Total pegawai organik
  - Total mitra statistik tahun dipilih
  - Total laporan CoI masuk tahun dipilih
  - Jumlah organik yang sudah melapor
  - Jumlah organik yang belum melapor
- Tabel: daftar nama organik + status laporan (Sudah Lapor / Belum Lapor)

---

### 5.3 Menu: Pegawai Organik

**Deskripsi:** Daftar seluruh pegawai organik BPS Kepahiang. Read-only.

**Komponen:**
- Tabel: Nama, NIP, Username, Email
- Search/filter nama

---

### 5.4 Menu: Mitra Statistik

**Deskripsi:** Daftar mitra statistik difilter per tahun. Read-only.

**Komponen:**
- Filter tahun (dropdown)
- Tabel: Tahun, Nama Lengkap, Posisi, Alamat Detail
- Search/filter nama mitra

---

### 5.5 Menu: Daftar Potensi CoI

**Deskripsi:** Rekap semua laporan CoI yang masuk, difilter per tahun.

**Komponen:**
- Filter tahun (dropdown)
- Tabel: Nama Pelapor, Nama Mitra, Posisi Mitra, Hubungan, Keterangan, Waktu Lapor
- Tombol: Export / Cetak (untuk dokumentasi ZI)

---

### 5.6 Menu: Identifikasi Potensi CoI *(Aksi Utama)*

**Deskripsi:** Form bagi pegawai organik untuk melaporkan potensi CoI dengan mitra statistik.

**Komponen:**
- Filter tahun (dropdown, default: tahun berjalan)
- Riwayat laporan saya untuk tahun dipilih (tabel kecil)
- Form identifikasi baru:
  - Pilih mitra (multiple checkbox dari daftar mitra tahun dipilih)
  - Per mitra yang dipilih: field `Hubungan` (wajib) dan `Keterangan Tambahan` (opsional)
  - Tombol: `Simpan Laporan`

**Validasi:**
- Minimal satu mitra dipilih
- Field `Hubungan` wajib diisi untuk setiap mitra yang dipilih

---

## 6. Alur Penggunaan (User Flow)

```
Buka Aplikasi
    │
    ▼
[Login] ──── Gagal ──► Tampil error, ulangi
    │
  Berhasil
    │
    ▼
[Dashboard] ── statistik CoI tahun berjalan
    │
    ├──► [Pegawai Organik]      — lihat daftar organik
    ├──► [Mitra Statistik]      — lihat daftar mitra per tahun
    ├──► [Daftar Potensi CoI]   — rekap semua laporan per tahun
    └──► [Identifikasi CoI]
              │
              ▼
         Pilih tahun → centang mitra → isi hubungan
              │
              ▼
         Simpan → tersimpan di sheet coi_log
```

---

## 7. Desain & UI

| Aspek | Keputusan |
|---|---|
| **Framework CSS** | Tailwind CSS (via CDN) |
| **Font** | Inter (Google Fonts) |
| **Warna Primer** | Cyan (`cyan-600`, `cyan-700`) |
| **Warna Aksen** | Amber (`amber-400`, `amber-500`) |
| **Warna Semantik** | Green = sukses, Red = bahaya, Amber = peringatan, Cyan = info |
| **Layout** | Navbar atas + konten utama |
| **Navbar** | Logo/nama app + menu navigasi + info user login + tombol logout |
| **Responsif** | Mobile-friendly (hamburger menu di mobile) |

### Palet Warna Utama

| Elemen | Kelas Tailwind |
|---|---|
| Navbar background | `bg-cyan-700` |
| Navbar text | `text-white` |
| Tombol primer | `bg-cyan-600 hover:bg-cyan-700 text-white` |
| Tombol aksen | `bg-amber-400 hover:bg-amber-500 text-cyan-900` |
| Badge Sudah Lapor | `bg-green-100 text-green-700` |
| Badge Belum Lapor | `bg-red-100 text-red-600` |
| Badge posisi mitra | `bg-amber-100 text-amber-700` |
| Card statistik | `bg-white border border-slate-200 shadow-sm` |
| Header card stat | ikon cyan + angka besar |

---

## 8. Struktur Teknis

### 8.1 File GAS

| File | Fungsi |
|---|---|
| `Setup.gs` | Setup awal: buat sheet yang dibutuhkan, isi header, validasi struktur |
| `Code.gs` | Entry point (`doGet`), routing, fungsi `include()` |
| `Auth.gs` | Login, logout, `getCurrentUser()` |
| `Dashboard.gs` | Ambil data statistik dashboard |
| `Organik.gs` | Ambil daftar organik |
| `Mitra.gs` | Ambil daftar mitra per tahun, ambil daftar tahun tersedia |
| `CoI.gs` | Simpan log CoI, ambil log CoI per tahun, ambil riwayat per user |
| `Index.html` | Shell utama: load Tailwind CDN, Inter font, navbar, routing SPA sederhana |
| `Login.html` | Halaman login |
| `Dashboard.html` | Konten dashboard + kartu statistik |
| `Organik.html` | Tabel daftar organik |
| `Mitra.html` | Tabel daftar mitra + filter tahun |
| `DaftarCoI.html` | Tabel rekap CoI + filter tahun |
| `IdentifikasiCoI.html` | Form identifikasi CoI + riwayat saya |
| `Stylesheet.html` | Custom CSS tambahan (jika diperlukan di luar Tailwind) |

### 8.2 Detail `Setup.gs`

`Setup.gs` berisi satu fungsi utama yang dijalankan **satu kali** dari editor GAS sebelum aplikasi digunakan.

**Fungsi: `setupSheets()`**

Yang dilakukan:
1. Cek apakah sheet `organik` sudah ada → jika belum, buat dan tambahkan header
2. Cek apakah sheet `mitra` sudah ada → jika belum, buat dan tambahkan header (termasuk kolom `Tahun` di posisi A)
3. Cek apakah sheet `coi_log` sudah ada → jika belum, buat dan tambahkan header lengkap
4. Jika sheet sudah ada → skip (tidak menimpa data yang ada)
5. Tampilkan alert/log konfirmasi setup selesai

**Header tiap sheet:**

```
organik  : Nama | NIP | Username | Email
mitra    : Tahun | Nama Lengkap | Posisi | Alamat Detail
coi_log  : Timestamp | Tahun | NIP Pelapor | Nama Pelapor |
           Nama Mitra | Posisi Mitra | Hubungan | Keterangan Tambahan
```

**Catatan:** `setupSheets()` tidak pernah dipanggil dari `doGet()`. Dijalankan manual satu kali dari menu **Run** di editor GAS.

### 8.3 Session Management

- Menggunakan `PropertiesService.getUserProperties()` untuk menyimpan data session
- Data yang disimpan: `{ nama, nip, username, email }`
- Session dihapus saat logout

### 8.4 Struktur Spreadsheet

```
[Spreadsheet: CoI BPS Kepahiang]
├── Sheet: organik    ← data manual / sudah ada
├── Sheet: mitra      ← data manual, tambah kolom Tahun di kolom A
└── Sheet: coi_log    ← dibuat otomatis oleh Setup.gs
```

---

## 9. Aturan Bisnis

- Pegawai **boleh** melapor lebih dari satu kali di tahun yang sama (misalnya ada mitra baru di tengah tahun)
- Pegawai **boleh** tidak memiliki CoI — kondisi ini terlihat di dashboard sebagai status "Belum Lapor"
- Data mitra **difilter per tahun** — mitra 2024 tidak muncul di pilihan 2025
- Laporan yang sudah tersimpan **tidak bisa diedit/dihapus** oleh pegawai biasa
- Password adalah **NIP** — tanpa enkripsi khusus untuk tahap awal (konteks internal kantor)
- Filter tahun di semua halaman **default ke tahun berjalan**

---

## 10. Out of Scope (Versi 1.0)

- Manajemen role admin terpisah
- Edit/hapus laporan CoI oleh pegawai
- Notifikasi email otomatis ke pimpinan
- Enkripsi password
- Manajemen data organik dan mitra dari dalam aplikasi (masih via Sheets langsung)

---

## 11. Prioritas Pengembangan

| Prioritas | Fitur |
|---|---|
| 🔴 P1 — Wajib | `Setup.gs`, Login/Auth, Identifikasi CoI, Daftar Potensi CoI |
| 🟡 P2 — Penting | Dashboard statistik, Filter tahun, Navbar + routing SPA |
| 🟢 P3 — Nice to have | Export/cetak, Search mitra, Grafik dashboard |

### Urutan Pengembangan yang Disarankan

1. `Setup.gs` — pastikan struktur sheet benar sebelum apapun
2. `Code.gs` + `Index.html` — shell aplikasi + navbar + routing
3. `Auth.gs` + `Login.html` — login/logout
4. `CoI.gs` + `IdentifikasiCoI.html` — fitur inti
5. `Dashboard.gs` + `Dashboard.html` — statistik
6. `Organik.gs` + `Organik.html` — daftar organik
7. `Mitra.gs` + `Mitra.html` — daftar mitra
8. `DaftarCoI.html` — rekap CoI

---

## 12. Catatan Tambahan

- Kolom `Tahun` perlu **ditambahkan di paling kiri (kolom A)** sheet `mitra` sebelum pengembangan dimulai, atau biarkan `Setup.gs` yang membuatnya jika sheet belum ada
- Untuk data yang sudah ada di sheet `mitra` tanpa kolom `Tahun`, tambahkan kolom secara manual terlebih dahulu
- Aplikasi berjalan sebagai **Google Apps Script Web App**, dibuka via browser dengan akses "Anyone within organization" atau "Anyone"

---

*Dokumen ini akan diperbarui seiring perkembangan kebutuhan.*

*BPS Kabupaten Kepahiang — Pembangunan Zona Integritas Menuju WBK/WBBM*