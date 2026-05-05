# PRD — Aplikasi Penilaian Implementasi BerAKHLAK
**BPS Kabupaten Kepahiang**
**Version:** 1.1 | **Status:** Draft | **Platform:** Google Apps Script (Web App)

---

## 1. Latar Belakang & Tujuan

BPS Kabupaten Kepahiang memerlukan sistem penilaian peer-to-peer implementasi nilai **BerAKHLAK** (Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif) dan **Budaya Kerja Organisasi BPS** secara berkala (bulanan). Penilaian dilakukan antar sesama pegawai sehingga diharapkan lebih objektif dan merata.

**Tujuan:**
- Menyediakan platform penilaian digital yang mudah diakses tanpa login kompleks
- Merekam data penilaian bulanan secara terstruktur di Google Sheets
- Memberikan monitoring real-time kepada admin tentang progres pengisian
- Menghasilkan rekap agregat per pegawai per bulan

---

## 2. Scope & Out of Scope

| In Scope | Out of Scope |
|---|---|
| Login sederhana (username + NIP) | SSO / OAuth BPS |
| Penilaian peer (tidak menilai diri sendiri) | Penilaian atasan ke bawahan |
| Skala penilaian 1–5 per pegawai (1 nilai holistik) | Penilaian per dimensi/indikator |
| | Komentar/narasi penilaian |
| Log bulanan per periode | Arsip periode lebih dari 12 bulan (bisa dikembangkan) |
| Monitoring submit per bulan | Notifikasi otomatis via email/WA (bisa dikembangkan) |
| Mode dark/light | Ekspor PDF laporan |
| Setup otomatis via `setup.gs` | Manajemen pegawai via UI (tetap via sheet) |

---

## 3. Arsitektur Teknis

### 3.1 Platform
- **Google Apps Script** — Web App (doGet + HtmlService)
- **Google Sheets** sebagai database
- **Pure CSS** (variabel semantik, dark/light mode via `prefers-color-scheme` + toggle manual)
- **Vanilla JS** (fetch ke ScriptApp URL, tidak ada framework)

### 3.2 Struktur File

```
Code.gs          — Router utama (doGet, doPost)
Auth.gs          — Logic login/session (PropertiesService / CacheService)
Penilaian.gs     — Logic baca-tulis penilaian
Monitoring.gs    — Logic monitoring submit per bulan
Setup.gs         — Setup awal semua sheet secara otomatis
Utils.gs         — Helper: getPeriode(), formatNIP(), dsb.

index.html       — Shell SPA utama
login.html       — Halaman login (partial)
beranda.html     — Halaman beranda + form penilaian (partial)
monitoring.html  — Halaman monitoring admin (partial)
style.css.html   — CSS global dengan variabel semantik
script.js.html   — JS client-side (routing SPA, fetch)
```

### 3.3 Struktur Sheet Google Sheets

#### Sheet: `Master Pegawai`
| Kolom | Keterangan |
|---|---|
| A: No | Nomor urut |
| B: Nama | Nama lengkap pegawai |
| C: NIP | NIP (dipakai sebagai password login) |
| D: Username | Username (dipakai sebagai ID login) |
| E: Email | Email BPS |
| F: Status Aktif | `Aktif` / `Nonaktif` |

#### Sheet: `Penilaian_[YYYY-MM]` _(dibuat otomatis tiap periode)_
| Kolom | Keterangan |
|---|---|
| A: Periode | Format `YYYY-MM` |
| B: Timestamp | Waktu submit |
| C: NIP Penilai | NIP pegawai yang menilai |
| D: Nama Penilai | Nama pegawai yang menilai |
| E: NIP Dinilai | NIP pegawai yang dinilai |
| F: Nama Dinilai | Nama pegawai yang dinilai |
| G: Nilai | Nilai holistik BerAKHLAK & Budaya Kerja (skala 1–5) |

> Satu baris = satu pasang penilai → dinilai. Satu sesi submit menghasilkan N baris (N = jumlah rekan yang dinilai).

#### Sheet: `Log Submit`
| Kolom | Keterangan |
|---|---|
| A: Periode | `YYYY-MM` |
| B: NIP | NIP penilai |
| C: Nama | Nama penilai |
| D: Timestamp Submit | Waktu submit lengkap |
| E: Jumlah Dinilai | Berapa pegawai yang dinilai dalam satu sesi |

#### Sheet: `Rekap_[YYYY-MM]` _(auto-generated)_
| Kolom | Keterangan |
|---|---|
| A: NIP | NIP pegawai yang dinilai |
| B: Nama | Nama pegawai |
| C: Rata-rata Nilai | Rata-rata nilai holistik dari semua penilai |
| D: Jumlah Penilai | Berapa banyak rekan yang sudah menilai |

---

## 4. Mekanisme Penilaian

### 4.1 Konsep
Penilaian bersifat **holistik** — setiap penilai memberikan **1 nilai tunggal (skala 1–5)** untuk setiap rekannya, mencerminkan keseluruhan implementasi BerAKHLAK dan budaya kerja organisasi BPS. Tidak ada rincian per dimensi; semua pegawai diasumsikan sudah memahami konteks BerAKHLAK dan budaya kerja BPS.

### 4.2 Skala Penilaian

| Nilai | Label | Deskripsi Singkat |
|---|---|---|
| 1 | Sangat Kurang | Hampir tidak terlihat implementasinya |
| 2 | Kurang | Masih perlu banyak peningkatan |
| 3 | Cukup | Sudah menunjukkan implementasi dasar |
| 4 | Baik | Konsisten mengimplementasikan nilai-nilai |
| 5 | Sangat Baik | Menjadi contoh dan inspirasi rekan lain |

### 4.3 Aturan Penilaian
- Setiap pegawai menilai **seluruh rekannya** (tidak menilai diri sendiri)
- Penilaian **1x per periode** — tidak bisa diubah setelah submit
- Semua rekan **harus diberi nilai** sebelum bisa submit (tidak boleh ada yang kosong)

---

## 5. Alur Aplikasi (User Flow)

```
[Buka Web App]
      |
      v
[Halaman Login]
  - Input: Username + NIP
  - Validasi ke sheet Master Pegawai
  - Jika cocok & Status Aktif → set session (CacheService)
  - Jika gagal → tampil pesan error
      |
      v
[Beranda / Dashboard]
  - Selamat datang, [Nama Pegawai]
  - Info periode berjalan (bulan-tahun)
  - Status: sudah/belum submit bulan ini
  - Tombol: [Mulai Penilaian] | [Lihat Rekap Saya] | [Logout]
      |
      |-- [Mulai Penilaian] ─────────────────────────────────────────────
      |        |
      |        v
      |   [Form Penilaian]
      |   - Daftar seluruh pegawai aktif (minus diri sendiri)
      |   - Per pegawai: 1 rating bintang (1–5), holistik BerAKHLAK + Budaya Kerja
      |   - Semua rekan harus diberi nilai sebelum bisa submit
      |   - Tombol [Submit Penilaian]
      |   - Konfirmasi → Data tersimpan ke sheet Penilaian_[YYYY-MM]
      |                  Log tersimpan ke sheet Log Submit
      |
      |-- [Lihat Rekap Saya] ────────────────────────────────────────────
      |        |
      |        v
      |   [Rekap Nilai Diterima]
      |   - Rata-rata nilai holistik yang diterima dari rekan pada bulan berjalan
      |   - Jumlah penilai yang sudah mengisi
      |
      |-- [ADMIN ONLY: Monitoring] ──────────────────────────────────────
               |
               v
          [Halaman Monitoring]
          - Periode dropdown (bulan berjalan default)
          - Tabel: Nama | Status Submit | Timestamp | Jumlah Dinilai
          - Badge: Sudah ✅ / Belum ❌
          - Summary: X dari Y pegawai sudah submit
```

---

## 6. Fitur per Modul

### 6.1 Modul Auth (`Auth.gs`)
- `login(username, nip)` → validasi ke `Master Pegawai`, return `{success, pegawai}` atau `{error}`
- `getSession(token)` → ambil data session dari CacheService (expire 4 jam)
- `logout(token)` → hapus cache session
- Session disimpan sebagai JSON string di CacheService dengan key = random token
- Token dikirim ke client, disimpan di `sessionStorage` browser

### 6.2 Modul Penilaian (`Penilaian.gs`)
- `getPegawaiUntukDinilai(nipPenilai)` → return daftar pegawai aktif minus penilai sendiri
- `cekSudahSubmit(nipPenilai, periode)` → boolean, cek di `Log Submit`
- `submitPenilaian(payload)` → tulis ke `Penilaian_[YYYY-MM]` dan `Log Submit`
- `getRekapPegawai(nipDinilai, periode)` → ambil rata-rata nilai yang diterima
- Auto-create sheet `Penilaian_[YYYY-MM]` jika belum ada

### 6.3 Modul Monitoring (`Monitoring.gs`)
- `getStatusSubmit(periode)` → return array semua pegawai + status submit
- Hanya bisa diakses jika session user adalah admin (bisa ditentukan by NIP/username khusus)
- `getListPeriode()` → return daftar periode yang punya data

### 6.4 Modul Setup (`Setup.gs`)
- Fungsi `setupAll()` dipanggil manual via menu Apps Script atau trigger
- Membuat/memeriksa sheet: `Master Pegawai`, `Log Submit`
- Mengisi header kolom tiap sheet
- Menambahkan data pegawai awal dari array konstanta (opsional)
- Membuat protected range untuk sheet `Log Submit` dan `Penilaian_*`
- Menampilkan UI konfirmasi via `SpreadsheetApp.getUi().alert()`

---

## 7. UI/UX Specification

### 7.1 Design System

**Palet warna (CSS Variables — Semantik):**

```css
/* Light Mode */
--color-bg: #f5f7fa;
--color-surface: #ffffff;
--color-surface-raised: #eef1f7;
--color-primary: #1a56db;        /* BPS biru */
--color-primary-hover: #1e429f;
--color-accent: #e3a008;         /* Emas/amber untuk aksen */
--color-text: #111827;
--color-text-muted: #6b7280;
--color-border: #e5e7eb;
--color-success: #057a55;
--color-danger: #c81e1e;
--color-warning: #c27803;

/* Dark Mode */
--color-bg: #0f172a;
--color-surface: #1e293b;
--color-surface-raised: #334155;
--color-primary: #3b82f6;
--color-accent: #f59e0b;
--color-text: #f1f5f9;
--color-text-muted: #94a3b8;
--color-border: #334155;
```

**Toggle dark/light:** button di header, simpan preferensi di `localStorage`

### 7.2 Komponen UI

| Komponen | Spesifikasi |
|---|---|
| Card | `border-radius: 12px`, shadow lembut, padding 24px |
| Button Primary | Solid biru, hover darken, transition 200ms |
| Button Ghost | Border saja, hover fill |
| Input | Border 1.5px, focus ring biru, rounded-8px |
| Rating Widget | 5 bintang klik-able (★) atau radio button bergaya pill |
| Badge Status | Pill hijau (Sudah) / merah (Belum) |
| Progress Bar | Per pegawai yang dinilai (opsional, nice-to-have) |
| Toast Notif | Pojok kanan bawah, auto-dismiss 3 detik |

### 7.3 Halaman

#### Login
- Logo BPS + nama aplikasi
- Card center-aligned
- 2 input field + tombol masuk
- Footer: "BPS Kabupaten Kepahiang © [tahun]"

#### Beranda
- Header: Nama pegawai + avatar inisial + toggle dark/light + tombol logout
- Card status bulan: sudah/belum submit + periode
- Grid menu: Mulai Penilaian / Rekap Saya / Monitoring (admin only)
- Informasi singkat tentang BerAKHLAK (accordion/collapsible) → **konten akan dilengkapi stakeholder**

#### Form Penilaian
- Sticky header: progress "X dari Y pegawai dinilai"
- Per pegawai: card dengan nama + NIP + **1 rating bintang interaktif (1–5)**
- Label skala muncul saat hover/pilih (Sangat Kurang → Sangat Baik)
- Tombol Submit di bawah (disabled sampai semua rekan diberi nilai)
- Konfirmasi modal sebelum submit

#### Monitoring
- Dropdown pilih periode
- Summary cards: Total, Sudah Submit, Belum Submit
- Tabel responsif dengan badge status
- Sort by nama / status

---

## 8. Setup.gs — Spesifikasi Detail

```javascript
// Fungsi yang harus ada di Setup.gs:

setupAll()           // Master function: panggil semua setup di bawah
setupMasterPegawai() // Buat sheet + header + data awal (jika kosong)
setupLogSubmit()     // Buat sheet Log Submit + header
setupPenilaianBulanIni() // Buat sheet Penilaian_YYYY-MM bulan berjalan
addCustomMenu()      // Tambah menu "BerAKHLAK Tools" di spreadsheet UI
```

Custom menu di Spreadsheet:
```
BerAKHLAK Tools
  ├── 🔧 Setup Awal (setupAll)
  ├── 📋 Buat Sheet Penilaian Bulan Ini (setupPenilaianBulanIni)
  └── 📊 Generate Rekap Bulan Ini (generateRekap)
```

---

## 9. Keamanan & Batasan

| Aspek | Pendekatan |
|---|---|
| Autentikasi | Username + NIP — sederhana, cukup untuk internal |
| Session | CacheService (server-side), token random di sessionStorage client |
| Akses admin | Whitelist NIP/username admin di konstanta `Config.gs` |
| Cek duplikat submit | Sebelum simpan, cek `Log Submit` per NIP per periode |
| Proteksi sheet | Sheet `Log Submit` dan `Penilaian_*` diberi proteksi editor |
| CORS | Apps Script Web App otomatis handle via `doPost` |

---

## 10. Periode & Siklus Data

- Periode format: `YYYY-MM` (contoh: `2025-05`)
- Periode berjalan: `Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM')`
- Submit hanya bisa 1x per periode per penilai (cek duplikat)
- Data periode lama tetap tersimpan dan bisa dilihat di monitoring
- Sheet baru `Penilaian_[YYYY-MM]` dibuat otomatis saat pertama ada submit di periode tersebut

---

## 11. Milestone & Urutan Development

| Fase | Deliverable | Estimasi |
|---|---|---|
| **0** | Setup.gs selesai, semua sheet terbentuk | 1 hari |
| **1** | Auth.gs + Login UI berfungsi | 1 hari |
| **2** | Beranda + session management | 1 hari |
| **3** | Form penilaian + submit + validasi | 2 hari |
| **4** | Monitoring admin | 1 hari |
| **5** | Rekap per pegawai | 1 hari |
| **6** | Polish UI: dark mode, animasi, responsif | 1 hari |
| **7** | Testing end-to-end + deploy Web App | 1 hari |

**Total estimasi: ~9 hari kerja**

---

## 12. Open Items (Perlu Input Stakeholder)

| # | Item | Keterangan |
|---|---|---|
| 1 | Username & NIP admin | Siapa yang punya akses halaman Monitoring |
| 2 | Apakah rekap bisa dilihat semua pegawai atau hanya admin? | Kebijakan transparansi data |
| 3 | Batas tanggal submit per bulan? | Misal: hanya bisa submit s/d tanggal 25 tiap bulan |
| 4 | Nama resmi aplikasi | Saat ini placeholder "Penilaian BerAKHLAK BPS Kepahiang" |
| 5 | Konten accordion BerAKHLAK di beranda | Teks penjelasan ringkas BerAKHLAK untuk pengingat pegawai (opsional) |

---

## 13. Referensi

- Data pegawai: Sheet `Master Pegawai` (29 pegawai aktif per data awal)
- Nilai BerAKHLAK: PermenPAN-RB No. 3 Tahun 2023
- Platform: Google Workspace BPS (`bps.go.id`)

---

*Dokumen ini adalah living document. Update dilakukan seiring konfirmasi open items dari stakeholder.*

**Author:** Tim IT BPS Kepahiang | **Last Updated:** 2026-05