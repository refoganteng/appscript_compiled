/**
 * Authentication module.
 */

/**
 * Handle login request.
 */
/**
 * Handle login request.
 */
function login(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('organik');
  const data = sheet.getDataRange().getValues();
  
  // Skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const [nama, nip, user, email] = row;
    
    if (user.toString().toLowerCase() === username.toLowerCase() && nip.toString() === password) {
      const userData = {
        nama: nama,
        nip: nip.toString(),
        username: user,
        email: email
      };
      
      // Return user data to client instead of saving to PropertiesService
      return { success: true, user: userData };
    }
  }
  
  return { success: false, message: 'Username atau Password (NIP) salah.' };
}

/**
 * Handle logout (Placeholder for server-side if needed, but session is client-side).
 */
function logout() {
  // Session is now handled in localStorage
  return true;
}

/**
 * Get current logged in user (Client will pass this data if needed).
 */
function getCurrentUser() {
  // We can no longer rely on server-side PropertiesService for 'Execute as Me' deployments
  return null;
}

