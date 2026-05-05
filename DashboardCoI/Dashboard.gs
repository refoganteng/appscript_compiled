/**
 * Dashboard module.
 */

/**
 * Get dashboard statistics for a specific year.
 */
function getDashboardStats(tahun) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Get Organik Data
  const organikSheet = ss.getSheetByName('organik');
  const organikData = organikSheet.getDataRange().getValues();
  const totalOrganik = organikData.length - 1;
  const listOrganik = organikData.slice(1).map(row => ({
    nama: row[0],
    nip: row[1],
    username: row[2],
    email: row[3]
  }));

  // 2. Get Mitra Data for year
  const mitraList = getMitraByTahun(tahun);
  const totalMitra = mitraList.length;

  // 3. Get CoI Logs for year
  const coiLogs = getCoILogs(tahun);
  
  // 4. Calculate status per organik
  const nipsLaporMitra = new Set();
  const nipsLaporPegawai = new Set();
  const nipsCoiMitra = new Set();
  const nipsCoiPegawai = new Set();

  coiLogs.forEach(log => {
    const nipStr = log.nipPelapor.toString();
    const isPegawai = log.kategori === 'Sesama Pegawai' || log.posisiMitra === 'Pegawai Organik';
    const isNihil = log.namaMitra === 'TIDAK ADA POTENSI COI';

    if (isPegawai) {
      nipsLaporPegawai.add(nipStr);
      if (!isNihil) nipsCoiPegawai.add(nipStr);
    } else {
      nipsLaporMitra.add(nipStr);
      if (!isNihil) nipsCoiMitra.add(nipStr);
    }
  });

  const organikWithStatus = listOrganik.map(o => {
    const nipStr = o.nip.toString();
    const lMitra = nipsLaporMitra.has(nipStr);
    const lPegawai = nipsLaporPegawai.has(nipStr);
    const cMitra = nipsCoiMitra.has(nipStr);
    const cPegawai = nipsCoiPegawai.has(nipStr);

    return {
      ...o,
      lMitra, lPegawai, cMitra, cPegawai,
      adaPotensiCoi: cMitra || cPegawai,
      sudahLapor: lMitra && lPegawai, // Selesai dua-duanya
      isNihil: lMitra && lPegawai && !cMitra && !cPegawai
    };
  });

  const totalAdaPotensi = organikWithStatus.filter(o => o.adaPotensiCoi).length;
  const totalNihil = organikWithStatus.filter(o => o.isNihil).length;
  const totalBelumIdentifikasi = organikWithStatus.filter(o => !o.sudahLapor).length;

  const totalAdaPotensiMitra = nipsCoiMitra.size;
  const totalAdaPotensiPegawai = nipsCoiPegawai.size;

  // Breakdown laporan (Jumlah record laporan)
  const coiReports = coiLogs.filter(log => log.namaMitra !== 'TIDAK ADA POTENSI COI');
  const totalCoiMitra = coiReports.filter(log => log.kategori !== 'Sesama Pegawai' && log.posisiMitra !== 'Pegawai Organik').length;
  const totalCoiPegawai = coiReports.filter(log => log.kategori === 'Sesama Pegawai' || log.posisiMitra === 'Pegawai Organik').length;

  return {
    totalOrganik,
    totalMitra,
    totalReports: coiReports.length,
    totalCoiMitra,
    totalCoiPegawai,
    totalAdaPotensi,
    totalAdaPotensiMitra,
    totalAdaPotensiPegawai,
    totalNihil,
    totalBelumIdentifikasi,
    organikWithStatus: organikWithStatus.sort((a, b) => a.nama.localeCompare(b.nama))
  };

}

