// ============================================================
// Config.gs — Konfigurasi global & konstanta aplikasi
// BPS Kabupaten Kepahiang — Penilaian BerAKHLAK
// ============================================================

const CONFIG = {
  APP_NAME: 'Penilaian BerAKHLAK BPS Kepahiang',
  APP_VERSION: '1.1',
  TIMEZONE: 'Asia/Jakarta',
  SESSION_TTL_SECONDS: 14400, // 4 jam

  // Whitelist NIP admin (akses halaman Monitoring)
  ADMIN_NIPS: ['199807172019121002'],

  // Nama sheet
  SHEET_MASTER: 'Master Pegawai',
  SHEET_LOG: 'Log Submit',

  // Prefix nama sheet penilaian & rekap
  PREFIX_PENILAIAN: 'Penilaian_',
  PREFIX_REKAP: 'Rekap_',
};

// Header kolom untuk tiap sheet
const HEADERS = {
  MASTER_PEGAWAI: ['No', 'Nama', 'NIP', 'Username', 'Email', 'Status Aktif'],
  LOG_SUBMIT: ['Periode', 'NIP', 'Nama', 'Timestamp Submit', 'Jumlah Dinilai'],
  PENILAIAN: ['Periode', 'Timestamp', 'NIP Penilai', 'Nama Penilai', 'NIP Dinilai', 'Nama Dinilai', 'Nilai'],
  REKAP: ['NIP', 'Nama', 'Rata-rata Nilai', 'Jumlah Penilai'],
};

// Data pegawai awal (dipakai oleh Setup.gs jika sheet Master Pegawai kosong)
// Format: [No, Nama, NIP, Username, Email, Status Aktif]
const DATA_PEGAWAI_AWAL = [
  [1,  'Ahmad Fauzi',           '199001012020121001', 'afauzi',     'afauzi@bps.go.id',     'Aktif'],
  [2,  'Budi Santoso',          '198503052010121002', 'bsantoso',   'bsantoso@bps.go.id',   'Aktif'],
  [3,  'Cahaya Dewi',           '199205152015122001', 'cdewi',      'cdewi@bps.go.id',      'Aktif'],
  [4,  'Dian Pratiwi',          '199308202016122002', 'dpratiwi',   'dpratiwi@bps.go.id',   'Aktif'],
  [5,  'Eko Wahyudi',           '198710012014121003', 'ewahyudi',   'ewahyudi@bps.go.id',   'Aktif'],
  [6,  'Fitri Handayani',       '199112252017122003', 'fhandayani', 'fhandayani@bps.go.id', 'Aktif'],
  [7,  'Gunawan Prasetyo',      '198806102013121004', 'gprasetyo',  'gprasetyo@bps.go.id',  'Aktif'],
  [8,  'Hesti Rahayu',          '199407182018122004', 'hrahayu',    'hrahayu@bps.go.id',    'Aktif'],
  [9,  'Irwan Setiawan',        '199002282019121005', 'isetiawan',  'isetiawan@bps.go.id',  'Aktif'],
  [10, 'Joko Purnomo',          '198901152012121006', 'jpurnomo',   'jpurnomo@bps.go.id',   'Aktif'],
  [11, 'Kartini Susanti',       '199306082016122007', 'ksusanti',   'ksusanti@bps.go.id',   'Aktif'],
  [12, 'Luthfi Hakim',          '198812202014121008', 'lhakim',     'lhakim@bps.go.id',     'Aktif'],
  [13, 'Maya Sari',             '199509112019122009', 'msari',      'msari@bps.go.id',      'Aktif'],
  [14, 'Nur Hidayat',           '198704252011121010', 'nhidayat',   'nhidayat@bps.go.id',   'Aktif'],
  [15, 'Oktavia Permata',       '199210302017122011', 'opermata',   'opermata@bps.go.id',   'Aktif'],
  [16, 'Pandu Wijaya',          '199105052015121012', 'pwijaya',    'pwijaya@bps.go.id',    'Aktif'],
  [17, 'Qori Amalia',           '199407022018122013', 'qamalia',    'qamalia@bps.go.id',    'Aktif'],
  [18, 'Rizki Ananda',          '199008152013121014', 'rananda',    'rananda@bps.go.id',    'Aktif'],
  [19, 'Siti Nurjanah',         '198906012012122015', 'snurjanah',  'snurjanah@bps.go.id',  'Aktif'],
  [20, 'Teguh Prasetio',        '199303122016121016', 'tprasetio',  'tprasetio@bps.go.id',  'Aktif'],
  [21, 'Umi Kalsum',            '199106282015122017', 'ukalsum',    'ukalsum@bps.go.id',    'Aktif'],
  [22, 'Vera Oktaviani',        '199511202019122018', 'voktaviani', 'voktaviani@bps.go.id', 'Aktif'],
  [23, 'Wahyu Nugroho',         '198802102011121019', 'wnugroho',   'wnugroho@bps.go.id',   'Aktif'],
  [24, 'Xena Fitriani',         '199304182016122020', 'xfitriani',  'xfitriani@bps.go.id',  'Aktif'],
  [25, 'Yoga Pratama',          '199009252014121021', 'ypratama',   'ypratama@bps.go.id',   'Aktif'],
  [26, 'Zahara Novia',          '199208112017122022', 'znovia',     'znovia@bps.go.id',     'Aktif'],
  [27, 'Agus Hermawan',         '198503152009121023', 'ahermawan',  'ahermawan@bps.go.id',  'Aktif'],
  [28, 'Bella Novitasari',      '199412282020122024', 'bnovitasari','bnovitasari@bps.go.id','Aktif'],
  [29, 'Candra Kurniawan',      '196805121992031002', 'ckurniawan', 'ckurniawan@bps.go.id', 'Aktif'],
];
