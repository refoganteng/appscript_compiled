// ============================================================
// Setup.gs — Setup awal semua sheet secara otomatis
// BPS Kabupaten Kepahiang — Penilaian BerAKHLAK
// ============================================================

/**
 * Master function: panggil semua setup di bawah
 * Dipanggil via custom menu atau manual
 */
function setupAll() {
  setupMasterPegawai();
  setupLogSubmit();
  setupPenilaianBulanIni();
  addCustomMenu();

  SpreadsheetApp.getUi().alert(
    '✅ Setup Selesai!\n\n' +
    'Sheet yang berhasil dibuat/diverifikasi:\n' +
    '• Master Pegawai\n' +
    '• Log Submit\n' +
    '• Penilaian_' + getPeriode() + '\n\n' +
    'Aplikasi siap digunakan.'
  );
}

/**
 * Buat sheet Master Pegawai + header + data awal (jika kosong)
 */
function setupMasterPegawai() {
  const ss = getSS();
  let sheet = ss.getSheetByName(CONFIG.SHEET_MASTER);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_MASTER);
  }

  // Pastikan ada header
  const headerRow = sheet.getRange(1, 1, 1, HEADERS.MASTER_PEGAWAI.length);
  if (headerRow.getValues()[0][0] !== HEADERS.MASTER_PEGAWAI[0]) {
    headerRow.setValues([HEADERS.MASTER_PEGAWAI]);
    _styleHeader(sheet, HEADERS.MASTER_PEGAWAI.length);
  }

  // Isi data awal jika sheet kosong (baris 2 dan seterusnya)
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1 && DATA_PEGAWAI_AWAL.length > 0) {
    sheet.getRange(2, 1, DATA_PEGAWAI_AWAL.length, DATA_PEGAWAI_AWAL[0].length)
         .setValues(DATA_PEGAWAI_AWAL);
  }

  // Format kolom NIP sebagai teks agar tidak dipotong
  sheet.getRange(2, 3, Math.max(sheet.getLastRow() - 1, 1), 1)
       .setNumberFormat('@STRING@');

  Logger.log('✅ setupMasterPegawai selesai');
}

/**
 * Buat sheet Log Submit + header
 */
function setupLogSubmit() {
  const ss = getSS();
  let sheet = ss.getSheetByName(CONFIG.SHEET_LOG);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_LOG);
  }

  const headerRow = sheet.getRange(1, 1, 1, HEADERS.LOG_SUBMIT.length);
  if (headerRow.getValues()[0][0] !== HEADERS.LOG_SUBMIT[0]) {
    headerRow.setValues([HEADERS.LOG_SUBMIT]);
    _styleHeader(sheet, HEADERS.LOG_SUBMIT.length);
  }

  // Format kolom NIP (B) sebagai teks
  sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1)
       .setNumberFormat('@STRING@');

  // Proteksi: hanya owner yang bisa edit
  _protectSheet(sheet, 'Log Submit dilindungi. Edit hanya via Web App.');

  Logger.log('✅ setupLogSubmit selesai');
}

/**
 * Buat sheet Penilaian_YYYY-MM bulan berjalan
 */
function setupPenilaianBulanIni() {
  const periode = getPeriode();
  const nama = getNamaPenilaianSheet(periode);
  const ss = getSS();
  let sheet = ss.getSheetByName(nama);

  if (!sheet) {
    sheet = ss.insertSheet(nama);
  }

  const headerRow = sheet.getRange(1, 1, 1, HEADERS.PENILAIAN.length);
  if (headerRow.getValues()[0][0] !== HEADERS.PENILAIAN[0]) {
    headerRow.setValues([HEADERS.PENILAIAN]);
    _styleHeader(sheet, HEADERS.PENILAIAN.length);
  }

  // Format kolom NIP (C, E) sebagai teks
  sheet.getRange(2, 3, Math.max(sheet.getLastRow() - 1, 1), 1).setNumberFormat('@STRING@');
  sheet.getRange(2, 5, Math.max(sheet.getLastRow() - 1, 1), 1).setNumberFormat('@STRING@');

  // Proteksi sheet penilaian
  _protectSheet(sheet, 'Sheet penilaian dilindungi. Edit hanya via Web App.');

  Logger.log('✅ setupPenilaianBulanIni selesai: ' + nama);
}

/**
 * Generate Rekap sheet untuk bulan ini
 * Dipanggil dari custom menu
 */
function generateRekap() {
  const periode = getPeriode();
  const rekap = _hitungRekap(periode);

  const namaRekap = getNamaRekapSheet(periode);
  const ss = getSS();
  let sheet = ss.getSheetByName(namaRekap);

  if (!sheet) {
    sheet = ss.insertSheet(namaRekap);
  } else {
    // Bersihkan data lama (kecuali header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.REKAP.length).clearContent();
    }
  }

  // Header
  const headerRow = sheet.getRange(1, 1, 1, HEADERS.REKAP.length);
  headerRow.setValues([HEADERS.REKAP]);
  _styleHeader(sheet, HEADERS.REKAP.length);

  if (rekap.length > 0) {
    sheet.getRange(2, 1, rekap.length, HEADERS.REKAP.length).setValues(rekap);
  }

  SpreadsheetApp.getUi().alert(
    '✅ Rekap ' + periode + ' berhasil di-generate!\n' +
    'Total: ' + rekap.length + ' pegawai.'
  );
}

/**
 * Hitung rekap nilai per pegawai untuk periode tertentu
 * @param {string} periode
 * @returns {Array} array of [NIP, Nama, Rata-rata, JumlahPenilai]
 */
function _hitungRekap(periode) {
  const namaPenilaian = getNamaPenilaianSheet(periode);
  const ss = getSS();
  const sheet = ss.getSheetByName(namaPenilaian);

  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.PENILAIAN.length).getValues();

  // Kelompokkan nilai per NIP dinilai
  const map = {}; // { nip: { nama, values: [] } }
  data.forEach(row => {
    const nipDinilai = formatNIP(row[4]);
    const namaDinilai = row[5];
    const nilai = parseFloat(row[6]);
    if (!nipDinilai || isNaN(nilai)) return;
    if (!map[nipDinilai]) map[nipDinilai] = { nama: namaDinilai, values: [] };
    map[nipDinilai].values.push(nilai);
  });

  return Object.entries(map).map(([nip, obj]) => {
    const avg = obj.values.reduce((s, v) => s + v, 0) / obj.values.length;
    return [nip, obj.nama, Math.round(avg * 100) / 100, obj.values.length];
  });
}

/**
 * Tambah custom menu "BerAKHLAK Tools" di spreadsheet UI
 */
function addCustomMenu() {
  SpreadsheetApp.getUi()
    .createMenu('BerAKHLAK Tools')
    .addItem('🔧 Setup Awal', 'setupAll')
    .addItem('📋 Buat Sheet Penilaian Bulan Ini', 'setupPenilaianBulanIni')
    .addItem('📊 Generate Rekap Bulan Ini', 'generateRekap')
    .addToUi();
}

/**
 * Trigger onOpen: tambah custom menu
 */
function onOpen() {
  addCustomMenu();
}

// ─── Private helpers ─────────────────────────────────────────

/**
 * Style baris header sheet (bold, background biru BPS)
 */
function _styleHeader(sheet, numCols) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setFontWeight('bold')
       .setBackground('#1a56db')
       .setFontColor('#ffffff')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * Tambahkan proteksi ke sheet (hanya owner yang bisa edit)
 */
function _protectSheet(sheet, description) {
  const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  if (protections.length === 0) {
    const protection = sheet.protect().setDescription(description);
    protection.removeEditors(protection.getEditors());
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
  }
}
