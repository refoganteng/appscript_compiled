/**
 * Setup sheets required for the CoI Dashboard.
 * Run this function once from the script editor.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup 'organik' sheet
  let organikSheet = ss.getSheetByName('organik');
  if (!organikSheet) {
    organikSheet = ss.insertSheet('organik');
    organikSheet.appendRow(['Nama', 'NIP', 'Username', 'Email']);
    organikSheet.getRange('1:1').setFontWeight('bold').setBackground('#f3f4f6');
    console.log('Sheet "organik" created.');
  } else {
    console.log('Sheet "organik" already exists.');
  }

  // 2. Setup 'mitra' sheet
  let mitraSheet = ss.getSheetByName('mitra');
  if (!mitraSheet) {
    mitraSheet = ss.insertSheet('mitra');
    mitraSheet.appendRow(['Tahun', 'Nama Lengkap', 'Posisi', 'Alamat Detail']);
    mitraSheet.getRange('1:1').setFontWeight('bold').setBackground('#f3f4f6');
    console.log('Sheet "mitra" created.');
  } else {
    console.log('Sheet "mitra" already exists.');
  }

  // 3. Setup 'coi_log' sheet
  let coiLogSheet = ss.getSheetByName('coi_log');
  const coiHeaders = [
    'Timestamp', 
    'Tahun', 
    'NIP Pelapor', 
    'Nama Pelapor', 
    'Pihak Terkait (Mitra/Pegawai)', 
    'Posisi', 
    'Hubungan', 
    'Keterangan Tambahan',
    'Kategori'
  ];

  if (!coiLogSheet) {
    coiLogSheet = ss.insertSheet('coi_log');
    coiLogSheet.appendRow(coiHeaders);
    coiLogSheet.getRange('1:1').setFontWeight('bold').setBackground('#f3f4f6');
    console.log('Sheet "coi_log" created.');
  } else {
    // Update headers if it already exists to accommodate new columns
    coiLogSheet.getRange(1, 1, 1, coiHeaders.length).setValues([coiHeaders]);
    coiLogSheet.getRange('1:1').setFontWeight('bold').setBackground('#f3f4f6');
    console.log('Sheet "coi_log" updated with new headers.');
  }

  SpreadsheetApp.getUi().alert('Setup Selesai! Struktur sheet telah disiapkan.');
}
