// ============================================================
// Auth.gs — Logic login / session management
// BPS Kabupaten Kepahiang — Penilaian BerAKHLAK
// ============================================================

/**
 * Login: validasi username + NIP ke sheet Master Pegawai
 * @param {string} username
 * @param {string} nip
 * @returns {{ success: boolean, pegawai?: object, token?: string, error?: string }}
 */
function login(username, nip) {
  try {
    const sheet = getSheet(CONFIG.SHEET_MASTER);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'Data pegawai belum tersedia.' };

    const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.MASTER_PEGAWAI.length).getValues();

    for (const row of data) {
      const rowNama     = String(row[1]).trim();
      const rowNIP      = formatNIP(row[2]);
      const rowUsername = String(row[3]).trim();
      const rowEmail    = String(row[4]).trim();
      const rowStatus   = String(row[5]).trim();

      if (
        rowUsername.toLowerCase() === username.toLowerCase().trim() &&
        rowNIP === formatNIP(nip) &&
        isAktif(rowStatus)
      ) {
        const token = generateToken();
        const pegawai = {
          nama:     rowNama,
          nip:      rowNIP,
          username: rowUsername,
          email:    rowEmail,
          inisial:  getInisial(rowNama),
          isAdmin:  isAdmin(rowNIP),
        };

        // Simpan session di CacheService
        CacheService.getScriptCache().put(
          'session_' + token,
          JSON.stringify(pegawai),
          CONFIG.SESSION_TTL_SECONDS
        );

        return { success: true, token: token, pegawai: pegawai };
      }
    }

    return { success: false, error: 'Username atau NIP salah, atau akun tidak aktif.' };
  } catch (e) {
    Logger.log('login error: ' + e.message);
    return { success: false, error: 'Terjadi kesalahan sistem: ' + e.message };
  }
}

/**
 * Ambil data session dari CacheService berdasarkan token
 * @param {string} token
 * @returns {{ success: boolean, pegawai?: object, error?: string }}
 */
function getSession(token) {
  if (!token) return { success: false, error: 'Token tidak diberikan.' };
  try {
    const raw = CacheService.getScriptCache().get('session_' + token);
    if (!raw) return { success: false, error: 'Sesi tidak ditemukan atau sudah berakhir.' };
    return { success: true, pegawai: JSON.parse(raw) };
  } catch (e) {
    return { success: false, error: 'Gagal membaca sesi: ' + e.message };
  }
}

/**
 * Logout: hapus session dari cache
 * @param {string} token
 * @returns {{ success: boolean }}
 */
function logout(token) {
  if (!token) return { success: false };
  try {
    CacheService.getScriptCache().remove('session_' + token);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Middleware: validasi token dan return data pegawai.
 * Dipakai di semua fungsi yang butuh autentikasi.
 * @param {string} token
 * @returns {{ pegawai: object }} — throw Error jika invalid
 */
function requireAuth(token) {
  const result = getSession(token);
  if (!result.success) throw new Error('UNAUTHORIZED: ' + result.error);
  return result.pegawai;
}

/**
 * Middleware: validasi token + pastikan user adalah admin
 * @param {string} token
 * @returns {{ pegawai: object }}
 */
function requireAdmin(token) {
  const pegawai = requireAuth(token);
  if (!pegawai.isAdmin) throw new Error('FORBIDDEN: Anda tidak memiliki akses admin.');
  return pegawai;
}
