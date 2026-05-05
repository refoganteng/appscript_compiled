// ============================================================
// Monitoring.gs — Logic monitoring submit per bulan (admin only)
// BPS Kabupaten Kepahiang — Penilaian BerAKHLAK
// ============================================================

/**
 * Ambil status submit seluruh pegawai aktif untuk periode tertentu
 * @param {string} token - session token (admin only)
 * @param {string} [periode] - format YYYY-MM, default bulan berjalan
 * @returns {{ success: boolean, data?: Array, summary?: object, error?: string }}
 */
function getStatusSubmit(token, periode) {
  try {
    requireAdmin(token);
    const p = periode || getPeriode();

    // Ambil semua pegawai aktif dari Master Pegawai
    const masterSheet = getSheet(CONFIG.SHEET_MASTER);
    const lastRowMaster = masterSheet.getLastRow();
    const pegawaiList = [];

    if (lastRowMaster >= 2) {
      const rows = masterSheet
        .getRange(2, 1, lastRowMaster - 1, HEADERS.MASTER_PEGAWAI.length)
        .getValues();

      rows.forEach(row => {
        if (isAktif(row[5])) {
          pegawaiList.push({
            nip:  formatNIP(row[2]),
            nama: String(row[1]).trim(),
          });
        }
      });
    }

    // Ambil semua log submit untuk periode ini
    const logSheet = getSheet(CONFIG.SHEET_LOG);
    const lastRowLog = logSheet.getLastRow();
    const submitMap = {}; // { nip: { timestamp, jumlahDinilai } }

    if (lastRowLog >= 2) {
      const logRows = logSheet
        .getRange(2, 1, lastRowLog - 1, HEADERS.LOG_SUBMIT.length)
        .getValues();

      logRows.forEach(row => {
        if (_normalizePeriode(row[0]) === p) {
          const nip = formatNIP(row[1]);
          submitMap[nip] = {
            timestamp:    String(row[3]),
            jumlahDinilai: row[4],
          };
        }
      });
    }

    // Gabungkan
    const result = pegawaiList.map(pegawai => {
      const log = submitMap[pegawai.nip];
      return {
        nip:          pegawai.nip,
        nama:         pegawai.nama,
        sudahSubmit:  !!log,
        timestamp:    log ? log.timestamp : null,
        jumlahDinilai: log ? log.jumlahDinilai : 0,
      };
    });

    // Sort: Sudah submit dulu, lalu alphabetical
    result.sort((a, b) => {
      if (a.sudahSubmit !== b.sudahSubmit) return a.sudahSubmit ? -1 : 1;
      return a.nama.localeCompare(b.nama, 'id');
    });

    const sudahCount = result.filter(r => r.sudahSubmit).length;
    const summary = {
      total:        result.length,
      sudah:        sudahCount,
      belum:        result.length - sudahCount,
      persentase:   result.length > 0 ? Math.round((sudahCount / result.length) * 100) : 0,
    };

    return { success: true, data: result, summary: summary, periode: p };
  } catch (e) {
    Logger.log('getStatusSubmit error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Ambil daftar periode yang punya data (ada di Log Submit)
 * @param {string} token - session token (admin only)
 * @returns {{ success: boolean, data?: string[], error?: string }}
 */
function getListPeriode(token) {
  try {
    requireAdmin(token);
    const sheet = getSheet(CONFIG.SHEET_LOG);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      // Return setidaknya periode sekarang
      return { success: true, data: [getPeriode()] };
    }

    const rows = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const periodeSet = new Set();
    rows.forEach(row => {
      const p = _normalizePeriode(row[0]);
      if (p) periodeSet.add(p);
    });

    // Tambahkan periode berjalan agar selalu muncul di dropdown
    periodeSet.add(getPeriode());

    // Sort descending (terbaru di atas)
    const sorted = [...periodeSet].sort((a, b) => b.localeCompare(a));
    return { success: true, data: sorted };
  } catch (e) {
    Logger.log('getListPeriode error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Ambil rekap agregat seluruh pegawai untuk periode tertentu (admin)
 * @param {string} token
 * @param {string} [periode]
 * @returns {{ success: boolean, data?: Array, error?: string }}
 */
function getRekapAdmin(token, periode) {
  try {
    requireAdmin(token);
    const p = periode || getPeriode();
    const namaPenilaian = getNamaPenilaianSheet(p);
    const ss = getSS();
    const sheet = ss.getSheetByName(namaPenilaian);

    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, data: [] };
    }

    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.PENILAIAN.length).getValues();
    const map = {};

    rows.forEach(row => {
      const nipDinilai  = formatNIP(row[4]);
      const namaDinilai = String(row[5]).trim();
      const nilai       = parseFloat(row[6]);
      if (!nipDinilai || isNaN(nilai)) return;
      if (!map[nipDinilai]) map[nipDinilai] = { nama: namaDinilai, values: [] };
      map[nipDinilai].values.push(nilai);
    });

    const result = Object.entries(map).map(([nip, obj]) => {
      const avg = obj.values.reduce((s, v) => s + v, 0) / obj.values.length;
      return {
        nip:          nip,
        nama:         obj.nama,
        rataRata:     Math.round(avg * 100) / 100,
        jumlahPenilai: obj.values.length,
      };
    });

    result.sort((a, b) => b.rataRata - a.rataRata);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('getRekapAdmin error: ' + e.message);
    return { success: false, error: e.message };
  }
}
/**
 * Export rekap bulanan ke sheet baru (admin only)
 * @param {string} token
 * @param {string} periode
 * @returns {{ success: boolean, sheetName?: string, error?: string }}
 */
function exportRekapBulanan(token, periode) {
  try {
    requireAdmin(token);
    const p = periode || getPeriode();
    const data = getRekapAdmin(token, p);
    if (!data.success) throw new Error(data.error);

    const rekapData = data.data;
    if (rekapData.length === 0) throw new Error('Tidak ada data untuk diekspor pada periode ini.');

    const sheetName = getNamaRekapSheet(p);
    const ss = getSS();
    let sheet = ss.getSheetByName(sheetName);
    
    if (sheet) {
      sheet.clear();
    } else {
      sheet = ss.insertSheet(sheetName);
    }

    // Header
    const headers = [['No', 'Nama Pegawai', 'Rata-rata (1-5)', 'Nilai Akhir (0-100)', 'Jumlah Penilai']];
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

    // Data
    const rows = rekapData.map((r, i) => [
      i + 1,
      r.nama,
      r.rataRata,
      (r.rataRata * 20).toFixed(2),
      r.jumlahPenilai
    ]);

    sheet.getRange(2, 1, rows.length, headers[0].length).setValues(rows);

    // Styling
    sheet.getRange(1, 1, 1, headers[0].length)
         .setFontWeight('bold')
         .setBackground('#0891b2')
         .setFontColor('#ffffff')
         .setHorizontalAlignment('center');
    
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers[0].length);
    
    // Set format desimal
    sheet.getRange(2, 3, rows.length, 2).setNumberFormat('0.00');

    return { success: true, sheetName: sheetName };
  } catch (e) {
    Logger.log('exportRekapBulanan error: ' + e.message);
    return { success: false, error: e.message };
  }
}
