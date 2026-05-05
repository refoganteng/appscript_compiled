// ============================================================
// Penilaian.gs — Logic baca-tulis penilaian
// BPS Kabupaten Kepahiang — Penilaian BerAKHLAK
// ============================================================

/**
 * Ambil daftar pegawai aktif yang bisa dinilai (minus penilai sendiri)
 * @param {string} token - session token
 * @returns {{ success: boolean, data?: Array, error?: string }}
 */
function getPegawaiUntukDinilai(token) {
  try {
    const penilai = requireAuth(token);
    const sheet = getSheet(CONFIG.SHEET_MASTER);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };

    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.MASTER_PEGAWAI.length).getValues();
    const daftar = [];

    rows.forEach(row => {
      const nip    = formatNIP(row[2]);
      const nama   = String(row[1]).trim();
      const status = String(row[5]).trim();

      // Kecualikan penilai sendiri & nonaktif
      if (nip === penilai.nip) return;
      if (!isAktif(status)) return;

      daftar.push({
        nip:     nip,
        nama:    nama,
        inisial: getInisial(nama),
      });
    });

    // Sort by nama
    daftar.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

    return { success: true, data: daftar };
  } catch (e) {
    Logger.log('getPegawaiUntukDinilai error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Cek apakah penilai sudah submit di periode tertentu
 * @param {string} token
 * @param {string} [periode] - format YYYY-MM, default bulan berjalan
 * @returns {{ success: boolean, sudah?: boolean, timestamp?: string, error?: string }}
 */
function cekSudahSubmit(token, periode) {
  try {
    const penilai = requireAuth(token);
    const p = periode || getPeriode();
    const sheet = getSheet(CONFIG.SHEET_LOG);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) return { success: true, sudah: false };

    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.LOG_SUBMIT.length).getValues();
    for (const row of rows) {
      const rowP = _normalizePeriode(row[0]);
      if (rowP === p && formatNIP(row[1]) === penilai.nip) {
        return {
          success: true,
          sudah: true,
          timestamp: String(row[3]),
          jumlahDinilai: row[4],
        };
      }
    }

    return { success: true, sudah: false };
  } catch (e) {
    Logger.log('cekSudahSubmit error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Submit penilaian dari form
 * @param {string} token
 * @param {Array<{nipDinilai: string, namaDinilai: string, nilai: number}>} penilaianList
 * @returns {{ success: boolean, error?: string }}
 */
function submitPenilaian(token, penilaianList) {
  try {
    const penilai = requireAuth(token);
    const periode = getPeriode();

    // Cek duplikat submit
    const sudah = cekSudahSubmit(token, periode);
    if (sudah.sudah) {
      return { success: false, error: 'Anda sudah melakukan penilaian pada periode ' + periode + '.' };
    }

    // Validasi payload
    if (!Array.isArray(penilaianList) || penilaianList.length === 0) {
      return { success: false, error: 'Data penilaian tidak valid.' };
    }

    for (const p of penilaianList) {
      const nilai = parseInt(p.nilai);
      if (isNaN(nilai) || nilai < 1 || nilai > 5) {
        return { success: false, error: 'Nilai untuk ' + p.namaDinilai + ' tidak valid (harus 1–5).' };
      }
    }

    const timestamp = getTimestamp();

    // ── Tulis ke sheet Penilaian_YYYY-MM ──────────────────────
    const namaPenilaian = getNamaPenilaianSheet(periode);
    const ss = getSS();
    let penilaianSheet = ss.getSheetByName(namaPenilaian);
    if (!penilaianSheet) {
      // Buat sheet baru jika belum ada
      penilaianSheet = ss.insertSheet(namaPenilaian);
      penilaianSheet.getRange(1, 1, 1, HEADERS.PENILAIAN.length).setValues([HEADERS.PENILAIAN]);
      _styleHeaderPenilaian(penilaianSheet);
    }

    const baris = penilaianList.map(p => [
      periode,
      timestamp,
      penilai.nip,
      penilai.nama,
      formatNIP(p.nipDinilai),
      p.namaDinilai,
      parseInt(p.nilai),
    ]);
    penilaianSheet.getRange(
      penilaianSheet.getLastRow() + 1,
      1,
      baris.length,
      HEADERS.PENILAIAN.length
    ).setValues(baris);

    // Format kolom NIP Penilai & NIP Dinilai sebagai teks
    const lastDataRow = penilaianSheet.getLastRow();
    const startDataRow = lastDataRow - baris.length + 1;
    penilaianSheet.getRange(startDataRow, 3, baris.length, 1).setNumberFormat('@STRING@');
    penilaianSheet.getRange(startDataRow, 5, baris.length, 1).setNumberFormat('@STRING@');

    // ── Tulis ke sheet Log Submit ──────────────────────────────
    const logSheet = getSheet(CONFIG.SHEET_LOG);
    logSheet.appendRow([
      "'" + periode, // Paksa string agar tidak auto-format jadi Date
      penilai.nip,
      penilai.nama,
      timestamp,
      penilaianList.length,
    ]);
    // Format NIP log sebagai teks
    const logLastRow = logSheet.getLastRow();
    logSheet.getRange(logLastRow, 2, 1, 1).setNumberFormat('@STRING@');

    Logger.log('submitPenilaian sukses: ' + penilai.nip + ' periode ' + periode);
    return { success: true };
  } catch (e) {
    Logger.log('submitPenilaian error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Ambil rekap nilai yang diterima pegawai ini (sebagai dinilai)
 * @param {string} token
 * @param {string} [periode]
 * @returns {{ success: boolean, data?: {rataRata: number, jumlahPenilai: number}, error?: string }}
 */
function getRekapPegawai(token, periode) {
  try {
    const pegawai = requireAuth(token);
    const p = periode || getPeriode();
    const namaPenilaian = getNamaPenilaianSheet(p);
    const ss = getSS();
    const sheet = ss.getSheetByName(namaPenilaian);

    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, data: { rataRata: null, jumlahPenilai: 0 } };
    }

    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.PENILAIAN.length).getValues();
    const values = [];

    rows.forEach(row => {
      if (formatNIP(row[4]) === pegawai.nip) {
        const nilai = parseFloat(row[6]);
        if (!isNaN(nilai)) values.push(nilai);
      }
    });

    if (values.length === 0) {
      return { success: true, data: { rataRata: null, jumlahPenilai: 0 } };
    }

    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return {
      success: true,
      data: {
        rataRata: Math.round(avg * 100) / 100,
        jumlahPenilai: values.length,
      },
    };
  } catch (e) {
    Logger.log('getRekapPegawai error: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ─── Private helpers ──────────────────────────────────────────

function _styleHeaderPenilaian(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.PENILAIAN.length);
  range.setFontWeight('bold')
       .setBackground('#1a56db')
       .setFontColor('#ffffff')
       .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}
