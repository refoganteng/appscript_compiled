/**
 * Organik module.
 */

/**
 * Get all organik employees.
 */
function getOrganikEmployees() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('organik');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  return data.slice(1).map(row => ({
    nama: row[0],
    nip: row[1],
    username: row[2],
    email: row[3]
  })).sort((a, b) => a.nama.localeCompare(b.nama));
}
