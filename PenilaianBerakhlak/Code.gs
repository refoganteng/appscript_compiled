// ============================================================
// Code.gs — Router utama (doGet + doPost)
// BPS Kabupaten Kepahiang — Penilaian BerAKHLAK
// ============================================================

/**
 * doGet — Serve halaman web
 */
function doGet(e) {
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle(CONFIG.APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * doPost — API endpoint utama
 * Body JSON: { action: string, token?: string, ...params }
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (_) {
    return jsonErr('Request body tidak valid (bukan JSON).');
  }

  const action = body.action;
  const token  = body.token || null;

  try {
    switch (action) {

      // ── Auth ───────────────────────────────────────────────
      case 'login':
        return jsonOk(login(body.username, body.nip));

      case 'logout':
        return jsonOk(logout(token));

      case 'getSession':
        return jsonOk(getSession(token));

      // ── Penilaian ─────────────────────────────────────────
      case 'getPegawaiUntukDinilai':
        return jsonOk(getPegawaiUntukDinilai(token));

      case 'cekSudahSubmit':
        return jsonOk(cekSudahSubmit(token, body.periode || null));

      case 'submitPenilaian':
        return jsonOk(submitPenilaian(token, body.penilaianList));

      case 'getRekapPegawai':
        return jsonOk(getRekapPegawai(token, body.periode || null));

      // ── Monitoring (admin) ────────────────────────────────
      case 'getStatusSubmit':
        return jsonOk(getStatusSubmit(token, body.periode || null));

      case 'getListPeriode':
        return jsonOk(getListPeriode(token));

      case 'getRekapAdmin':
        return jsonOk(getRekapAdmin(token, body.periode || null));

      case 'exportRekapBulanan':
        return jsonOk(exportRekapBulanan(token, body.periode || null));

      default:
        return jsonErr('Action tidak dikenali: ' + action);
    }
  } catch (err) {
    Logger.log('doPost error [' + action + ']: ' + err.message);
    return jsonErr(err.message);
  }
}

/**
 * executeAction — Endpoint untuk google.script.run
 * Sama dengan doPost tapi mengembalikan objek langsung
 */
function executeAction(action, body) {
  const token = body.token || null;
  try {
    switch (action) {
      case 'login':                  return login(body.username, body.nip);
      case 'logout':                 return logout(token);
      case 'getSession':             return getSession(token);
      case 'getPegawaiUntukDinilai': return getPegawaiUntukDinilai(token);
      case 'cekSudahSubmit':         return cekSudahSubmit(token, body.periode || null);
      case 'submitPenilaian':        return submitPenilaian(token, body.penilaianList);
      case 'getRekapPegawai':        return getRekapPegawai(token, body.periode || null);
      case 'getStatusSubmit':        return getStatusSubmit(token, body.periode || null);
      case 'getListPeriode':         return getListPeriode(token);
      case 'getRekapAdmin':          return getRekapAdmin(token, body.periode || null);
      case 'exportRekapBulanan':     return exportRekapBulanan(token, body.periode || null);
      default: return { success: false, error: 'Action tidak dikenali: ' + action };
    }
  } catch (err) {
    Logger.log('executeAction error [' + action + ']: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Helper untuk include file HTML partial
 * Dipakai di dalam template HTML: <?!= include('style.css') ?>
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (e) {
    // Coba dengan suffix .html jika gagal
    return '<!-- Error include: ' + filename + ' (' + e.message + ') -->';
  }
}
