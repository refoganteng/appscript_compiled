/**
 * CoI (Conflict of Interest) module.
 */

function saveCoILog(data, user) {
  try {
    if (!user) throw new Error('Unauthorized');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('coi_log');
    if (!sheet) throw new Error('Sheet "coi_log" tidak ditemukan.');
    const timestamp = new Date();
    const rows = data.reports.map(report => {
      const kategori = report.posisiMitra === 'Pegawai Organik' ? 'Sesama Pegawai' : 'Mitra Statistik';
      return [
        timestamp, data.tahun, user.nip, user.nama,
        report.namaMitra, report.posisiMitra, report.hubungan, report.keterangan || '',
        kategori
      ];
    });
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
    }

    return { success: true };
  } catch (e) {
    throw new Error('Gagal menyimpan: ' + e.message);
  }
}

function getCoILogs(tahun) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('coi_log');
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const targetYear = parseInt(tahun.toString());
    const results = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue; // skip truly empty rows

      let rowYear;
      if (row[1] instanceof Date) {
        rowYear = row[1].getFullYear();
      } else {
        rowYear = parseInt(row[1].toString());
      }

      if (rowYear === targetYear) {
        // Serialize timestamp safely
        const ts = row[0] instanceof Date ? row[0].toISOString() : row[0].toString();
        results.push({
          id: i + 1,
          timestamp: ts,
          tahun: rowYear,
          nipPelapor: row[2] ? row[2].toString().replace(/\.0$/, '').replace(/[^0-9]/g, '') : '',
          namaPelapor: row[3] ? row[3].toString() : '',
          namaMitra: row[4] ? row[4].toString() : '',
          posisiMitra: row[5] ? row[5].toString() : '',
          hubungan: row[6] ? row[6].toString() : '',
          keterangan: row[7] ? row[7].toString() : '',
          kategori: row[8] ? row[8].toString() : (row[5] === 'Pegawai Organik' ? 'Sesama Pegawai' : 'Mitra Statistik')
        });

      }
    }

    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (e) {
    console.error('getCoILogs error:', e);
    return []; // return empty, don't throw - let UI show empty state
  }
}

function getMyCoILogs(tahun, user) {
  try {
    if (!user) return [];
    const allLogs = getCoILogs(tahun);
    const userNip = user.nip.toString().replace(/\.0$/, '').replace(/[^0-9]/g, '');
    return allLogs.filter(log => log.nipPelapor === userNip);
  } catch (e) {
    console.error('getMyCoILogs error:', e);
    return [];
  }
}

function reportNoCoI(tahun, posisiMitra, user) {
  try {
    if (!user) throw new Error('Unauthorized');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('coi_log');
    
    const existing = getMyCoILogs(tahun, user);
    const existingNoCoI = existing.filter(l => l.namaMitra === 'TIDAK ADA POTENSI COI' && (posisiMitra === 'Pegawai Organik' ? l.posisiMitra === 'Pegawai Organik' : l.posisiMitra !== 'Pegawai Organik'));
    
    if (existingNoCoI.length > 0) {
      throw new Error(`Anda sudah mendeklarasikan "Bebas CoI" untuk ${posisiMitra === 'Pegawai Organik' ? 'Sesama Pegawai' : 'Mitra Statistik'} tahun ini.`);
    }
    
    const kategori = posisiMitra === 'Pegawai Organik' ? 'Sesama Pegawai' : 'Mitra Statistik';
    
    sheet.appendRow([
      new Date(), tahun, user.nip, user.nama,
      'TIDAK ADA POTENSI COI', posisiMitra, 'NIHIL',
      'Deklarasi mandiri: Tidak memiliki potensi CoI.',
      kategori
    ]);

    return { success: true };

  } catch (e) {
    throw new Error(e.message);
  }
}

function updateCoILog(id, data, user) {
  try {
    if (!user) throw new Error('Unauthorized');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('coi_log');
    const rowNip = sheet.getRange(id, 3).getValue().toString().replace(/[^0-9]/g, '');
    const userNip = user.nip.toString().replace(/[^0-9]/g, '');
    if (rowNip !== userNip) throw new Error('Anda tidak memiliki izin mengedit data ini.');
    sheet.getRange(id, 7, 1, 2).setValues([[data.hubungan, data.keterangan || '']]);
    return { success: true };
  } catch (e) {
    throw new Error('Gagal update: ' + e.message);
  }
}

function deleteCoILog(id, user) {
  try {
    if (!user) throw new Error('Unauthorized');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('coi_log');
    const rowNip = sheet.getRange(id, 3).getValue().toString().replace(/[^0-9]/g, '');
    const userNip = user.nip.toString().replace(/[^0-9]/g, '');
    if (rowNip !== userNip) throw new Error('Izin ditolak.');
    sheet.deleteRow(id);
    return { success: true };
  } catch (e) {
    throw new Error(e.message);
  }
}


/**
 * Debug: check raw coi_log data - run from GAS editor to diagnose.
 */
function debugCoILogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('coi_log');
  if (!sheet) { Logger.log('Sheet coi_log not found!'); return; }
  const data = sheet.getDataRange().getValues();
  Logger.log('Total rows (incl header): ' + data.length);
  for (let i = 0; i < Math.min(data.length, 5); i++) {
    Logger.log('Row ' + i + ': ' + JSON.stringify(data[i].map(v => ({val: v, type: typeof v, isDate: v instanceof Date}))));
  }
  Logger.log('getCoILogs(2026): ' + JSON.stringify(getCoILogs('2026')));
  Logger.log('getCurrentUser: ' + JSON.stringify(getCurrentUser()));
  Logger.log('getMyCoILogs(2026): ' + JSON.stringify(getMyCoILogs('2026')));
}
