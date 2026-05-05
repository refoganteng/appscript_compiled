/**
 * Mitra Statistik module.
 */

/**
 * Get list of mitra for a specific year.
 */
function getMitraByTahun(tahun) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('mitra');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const targetTahun = tahun.toString().trim();
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    let rowYear;
    if (row[0] instanceof Date) {
      rowYear = row[0].getFullYear().toString();
    } else {
      rowYear = row[0].toString().split('.')[0].trim();
    }

    if (rowYear === targetTahun) {
      results.push({
        id: i, // Use row index as simple ID
        tahun: rowYear,
        nama: row[1] ? row[1].toString() : '',
        posisi: row[2] ? row[2].toString() : '',
        alamat: row[3] ? row[3].toString() : ''
      });
    }
  }
  return results;
}

/**
 * Get all available years from mitra sheet.
 */
function getAvailableYears() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('mitra');
    if (!sheet) return [new Date().getFullYear().toString()];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [new Date().getFullYear().toString()];
    
    const years = new Set();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        const y = row[0].toString().trim();
        if (y) years.add(y);
      }
    }
    
    let results = Array.from(years).sort((a, b) => b - a);
    if (results.length === 0) results.push(new Date().getFullYear().toString());
    
    return results;
  } catch (e) {
    console.error(e);
    return [new Date().getFullYear().toString()];
  }
}
