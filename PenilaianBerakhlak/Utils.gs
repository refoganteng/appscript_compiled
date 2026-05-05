// ============================================================
// Utils.gs — Helper functions
// BPS Kabupaten Kepahiang — Penilaian BerAKHLAK
// ============================================================

/**
 * Mendapatkan periode berjalan dalam format YYYY-MM (WIB)
 * @returns {string} e.g. "2026-05"
 */
function getPeriode() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1); // Penilaian dilakukan di bulan berikutnya (N+1), maka targetnya N-1
  return Utilities.formatDate(d, CONFIG.TIMEZONE, 'yyyy-MM');
}

/**
 * Mendapatkan nama sheet Penilaian untuk periode tertentu
 * @param {string} periode - format YYYY-MM
 * @returns {string}
 */
function getNamaPenilaianSheet(periode) {
  return CONFIG.PREFIX_PENILAIAN + (periode || getPeriode());
}

/**
 * Mendapatkan nama sheet Rekap untuk periode tertentu
 * @param {string} periode
 * @returns {string}
 */
function getNamaRekapSheet(periode) {
  return CONFIG.PREFIX_REKAP + (periode || getPeriode());
}

/**
 * Mendapatkan objek SpreadsheetApp.Spreadsheet aktif
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Mendapatkan sheet berdasarkan nama; throw Error jika tidak ada
 * @param {string} name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  const sheet = getSS().getSheetByName(name);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);
  return sheet;
}

/**
 * Mendapatkan sheet berdasarkan nama; buat baru jika belum ada
 * @param {string} name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(name) {
  const ss = getSS();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/**
 * Membuat token random 32 karakter hex
 * @returns {string}
 */
function generateToken() {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    new Date().getTime() + Math.random().toString()
  );
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

/**
 * Mendapatkan timestamp saat ini dalam format readable (WIB)
 * @returns {string}
 */
function getTimestamp() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Format NIP: pastikan string (karena sheets bisa baca sebagai number)
 * @param {*} nip
 * @returns {string}
 */
function formatNIP(nip) {
  if (nip === null || nip === undefined) return '';
  return String(nip).trim();
}

/**
 * Cek apakah NIP termasuk admin
 * @param {string} nip
 * @returns {boolean}
 */
function isAdmin(nip) {
  return CONFIG.ADMIN_NIPS.includes(formatNIP(nip));
}

/**
 * Cek apakah status pegawai adalah Aktif (case-insensitive)
 * @param {string} status
 * @returns {boolean}
 */
function isAktif(status) {
  if (!status) return false;
  return String(status).trim().toLowerCase() === 'aktif';
}

/**
 * Return response JSON sukses
 * @param {*} data
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Return response JSON error
 * @param {string} message
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonErr(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mendapatkan inisial nama untuk avatar (maks 2 huruf)
 * @param {string} nama
 * @returns {string}
 */
function getInisial(nama) {
  if (!nama) return '?';
  return nama.trim().substring(0, 2).toUpperCase();
}

/**
 * Normalisasi nilai periode dari sheet (string atau Date) ke format YYYY-MM
 * @param {*} val
 * @returns {string}
 */
function _normalizePeriode(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, CONFIG.TIMEZONE, 'yyyy-MM');
  }
  const s = String(val).trim();
  // Jika formatnya seperti Date string panjang, coba parse
  if (s.length > 10 && s.includes(' ')) {
    try {
      return Utilities.formatDate(new Date(s), CONFIG.TIMEZONE, 'yyyy-MM');
    } catch (_) { return s; }
  }
  return s;
}

