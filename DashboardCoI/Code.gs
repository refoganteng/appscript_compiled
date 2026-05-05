/**
 * Entry point for the Web App.
 */
function doGet(e) {
  const page = e.parameter.p;
  
  // Default ke login jika tidak ada parameter p
  if (!page || page === 'login') {
    return render('Login_UI', { title: 'Login - PakCoi' });
  }

  const titles = {
    dashboard: 'Dashboard',
    identifikasi: 'Identifikasi',
    rekap: 'Daftar Laporan',
    konflik: 'Daftar CoI',
    organik: 'Pegawai Organik',
    mitra: 'Mitra Statistik'
  };

  return render('Main_UI', { 
    page: page, 
    title: (titles[page] || 'Halaman') + ' - PakCoi' 
  });
}



/**
 * Helper to render HTML files with data.
 */
function render(filename, args) {
  const template = HtmlService.createTemplateFromFile(filename);
  if (args) {
    Object.keys(args).forEach(key => {
      template[key] = args[key];
    });
  }
  return template.evaluate()
    .setTitle(args.title || 'CoI Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include HTML partials in templates.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get script URL for navigation.
 */
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}
