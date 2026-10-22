// Kandungan mod KAMPUNG ELEKTRIK (6 misi dalam satu diorama kampung AR) — SALINAN daripada
// Assets/Scripts/Kampung/DataKampung.cs versi Android. Ubah kedua-duanya bersama.

export const BIL_MISI = 6;

export const TAJUK_MISI = [
  'KENALI BEKALAN ELEKTRIK', 'RUMAH GELAP', 'WIRING CHALLENGE', 'PILIH PERLINDUNGAN', 'CARI BAHAYA', 'PULIHKAN KAMPUNG',
];
export const RINGKASAN_MISI = [
  'Ikut aliran tenaga dari pencawang ke rumah',
  'Cari punca rumah tiada bekalan',
  'Sambung kabel lampu & soket ke DB',
  'Pilih MCB / RCD / RCBO yang sesuai',
  'Kesan 5 bahaya elektrik tersembunyi',
  'Misi akhir: pulihkan seluruh kampung',
];
export const XP_MAKS_KAMPUNG = [60, 80, 120, 80, 100, 160];

// ---------------- MISI 1: aliran tenaga (hinggaAliran = indeks Aliran_NN terakhir yang menyala)
export const ALIRAN = [
  { label: 'PENCAWANG', nama: 'pencawang elektrik', sasaran: ['Pencawang', 'PagarPencawang'], hingga: 0,
    fakta: 'PENCAWANG: transformer menurunkan voltan tinggi 11 kV kepada 415 V (3 fasa) dan 230 V (1 fasa) untuk kegunaan pengguna.' },
  { label: 'TIANG', nama: 'tiang elektrik', sasaran: ['Tiang_1', 'Tiang_2', 'Tiang_3'], hingga: 1,
    fakta: 'TIANG ELEKTRIK: menyokong talian di udara. Penebat seramik menghalang arus mengalir ke badan tiang.' },
  { label: 'TALIAN', nama: 'talian agihan (wayar antara tiang)', sasaran: ['Talian_Agihan'], hingga: 3,
    fakta: 'TALIAN AGIHAN: 4 dawai — 3 fasa (L1, L2, L3) dan Neutral (N) — membawa tenaga ke setiap bangunan di kampung.' },
  { label: 'METER', nama: 'meter elektrik Rumah A', sasaran: ['Meter_A', 'TiangMeter_A'], hingga: 6,
    fakta: 'METER kWj: talian servis masuk ke meter yang mengukur tenaga digunakan (kilowatt-jam). Bil elektrik dikira daripadanya.' },
  { label: 'DB', nama: 'papan agihan (DB) dalam Rumah A', sasaran: ['DB_A', 'Togol_A_RCCB', 'Togol_A_MCB1', 'Togol_A_MCB2'], hingga: 10,
    fakta: 'PAPAN AGIHAN (DB): membahagikan bekalan kepada litar akhir. Setiap litar dilindungi MCB; RCCB mengesan arus bocor.' },
  { label: 'BEBAN', nama: 'beban (lampu) di hujung litar akhir', sasaran: ['Lampu_A', 'Kaca_A'], hingga: 13,
    fakta: 'LITAR AKHIR -> BEBAN: kabel dari MCB ke lampu dan soket. Beban menukar tenaga elektrik kepada cahaya, haba dan gerakan.' },
];

// ---------------- MISI 3: wiring
export const TERMINAL = [
  'T_DB_L1', 'T_DB_L2', 'T_DB_N', 'T_DB_E', 'T_Suis_1', 'T_Suis_2',
  'T_Lampu_L', 'T_Lampu_N', 'T_Lampu_E', 'T_Soket_L', 'T_Soket_N', 'T_Soket_E',
];
const NAMA_TERMINAL = {
  T_DB_L1: 'DB: L1 (MCB 6A - lampu)', T_DB_L2: 'DB: L2 (MCB 20A - soket)', T_DB_N: 'DB: bar Neutral (N)', T_DB_E: 'DB: bar Bumi (E)',
  T_Suis_1: 'Suis: terminal 1', T_Suis_2: 'Suis: terminal 2',
  T_Lampu_L: 'Lampu: Hidup (L)', T_Lampu_N: 'Lampu: Neutral (N)', T_Lampu_E: 'Lampu: Bumi (E)',
  T_Soket_L: 'Soket: Hidup (L)', T_Soket_N: 'Soket: Neutral (N)', T_Soket_E: 'Soket: Bumi (E)',
};
export const namaTerminal = (t) => NAMA_TERMINAL[t] || t;
/** Jenis konduktor terminal: 'L', 'N' atau 'E' (menentukan warna kabel). */
export const jenisTerminal = (t) => (t.endsWith('_N') ? 'N' : t.endsWith('_E') ? 'E' : 'L');

// ---------------- MISI 4: pilih perlindungan
export const SENARIO = [
  {
    fokus: 'rumahA', label: 'LAMPU',
    soalan: 'Litar LAMPU Rumah A (kabel 1.5 mm²). Pilih perlindungan yang sesuai dalam DB.',
    pilihan: ['MCB 6A', 'MCB 32A', 'RCCB 100mA', 'Fius 13A'], betul: 0,
    penerangan: [
      'BETUL! Arus litar lampu kecil. MCB 6A melindungi kabel 1.5 mm² daripada beban lebih dan litar pintas.',
      'Terlalu besar! Kabel 1.5 mm² akan panas melampau dan boleh terbakar sebelum MCB 32A trip.',
      'RCCB hanya mengesan arus BOCOR ke bumi — ia tidak melindungi kabel daripada beban lebih atau litar pintas.',
      'Fius 13A dipasang dalam PALAM peralatan, bukan untuk melindungi litar lampu dalam kotak agihan.',
    ],
  },
  {
    fokus: 'rumahB', label: 'PEMANAS AIR',
    soalan: 'Pemanas air di bilik mandi Rumah B (kawasan basah). Pilih perlindungan TAMBAHAN terhadap renjatan.',
    pilihan: ['MCB 20A', 'RCD 10mA', 'RCD 100mA', 'Fius 3A'], betul: 1,
    penerangan: [
      'MCB melindungi KABEL daripada beban lebih, tetapi tidak mengesan arus bocor yang boleh merenjat pengguna.',
      'BETUL! Kawasan basah berisiko tinggi — RCD 10mA trip pada arus bocor yang sangat kecil untuk melindungi nyawa.',
      '100mA terlalu tinggi untuk melindungi nyawa — ia biasanya untuk perlindungan kebakaran keseluruhan pepasangan.',
      'Fius 3A akan putus serta-merta kerana pemanas air menggunakan arus besar, dan fius tidak mengesan arus bocor.',
    ],
  },
  {
    fokus: 'kedai', label: 'PETI SEJUK',
    soalan: 'Litar soket peti sejuk Kedai Runcit: SATU peranti perlu melindungi daripada beban lebih DAN arus bocor.',
    pilihan: ['MCB 20A', 'RCCB 30mA', 'RCBO 20A 30mA', 'Fius 3A'], betul: 2,
    penerangan: [
      'MCB hanya melindungi daripada beban lebih dan litar pintas — tiada pengesanan arus bocor.',
      'RCCB hanya mengesan arus bocor — ia tidak melindungi kabel daripada beban lebih.',
      'BETUL! RCBO = MCB + RCD dalam satu unit. Jika rosak, hanya litar itu yang trip — litar lain kekal hidup.',
      'Terlalu kecil untuk litar soket — fius akan putus apabila pemampat peti sejuk mula berjalan.',
    ],
  },
  {
    fokus: 'dewan', label: 'AIRCOND',
    soalan: 'Penghawa dingin berkuasa tinggi di Dewan, litar khas dengan kabel 4 mm². Pilih MCB yang sesuai.',
    pilihan: ['MCB 6A', 'MCB 20A', 'MCB 32A', 'RCCB 30mA'], betul: 2,
    penerangan: [
      'Terlalu kecil — MCB 6A akan trip setiap kali pemampat aircond mula berjalan.',
      'MCB 20A dipadankan dengan kabel 2.5 mm² (soket). Aircond berkuasa tinggi dengan kabel 4 mm² guna MCB 32A.',
      'BETUL! Kabel 4 mm² dipadankan dengan MCB 32A untuk litar khas aircond berkuasa tinggi.',
      'RCCB tidak melindungi daripada beban lebih — litar aircond tetap memerlukan MCB yang sesuai.',
    ],
  },
];

// ---------------- MISI 5: cari bahaya
export const BAHAYA = [
  { objek: 'Bahaya_KabelTerdedah', label: 'KABEL TERDEDAH',
    penerangan: 'KABEL TERDEDAH: penebat rosak mendedahkan konduktor tembaga — boleh menyebabkan renjatan dan kebakaran. Mesti diganti oleh pendawai berdaftar.' },
  { objek: 'Bahaya_SoketBebanLebih', label: 'SOKET LEBIH BEBAN',
    penerangan: 'SOKET TERLEBIH BEBAN: terlalu banyak palam pada satu soket menyebabkan panas melampau dan kebakaran. Gunakan soket berasingan.' },
  { objek: 'Bahaya_PerkakasAir', label: 'DEKAT AIR',
    penerangan: 'PERALATAN DEKAT AIR: kabel sambungan dan radio di tebing sungai. Air mengalirkan arus — risiko renjatan maut.' },
  { objek: 'Bahaya_SambunganTakSelamat', label: 'SAMBUNGAN',
    penerangan: 'SAMBUNGAN TIDAK SELAMAT: wayar disambung dengan pita sahaja dan tergantung rendah. Sambungan mesti dalam kotak penyambung yang betul.' },
  { objek: 'Bahaya_PokokTalian', label: 'POKOK & TALIAN',
    penerangan: 'POKOK MENYENTUH TALIAN: boleh menyebabkan litar pintas, kebakaran dan bekalan terputus. Laporkan kepada pembekal — jangan cantas sendiri.' },
];
// Objek selamat yang boleh menjadi pengacau HINT (dipilih yang paling hampir dengan bahaya).
export const PENGACAU_SELAMAT = [
  'LampuJalan', 'KotakFius_Tiang', 'Cerek_A', 'Suis_A', 'Soket_A', 'Meter_A', 'DB_A', 'Lampu_A', 'SkrinTV_A', 'Kereta',
  'PetiSejuk_Kedai', 'PapanTanda_Kedai', 'DB_Kedai', 'DB_Dewan', 'PapanTanda_Dewan', 'Bendera', 'DB_B', 'Suis_B',
  'Tiang_1', 'Tiang_2', 'Tiang_3', 'Tiang_4', 'PagarPencawang',
];

// ---------------- MISI AKHIR
export const GANGGUAN = [
  {
    kunci: 'A', label: 'RUMAH A', fokus: 'rumahA', pemilih: ['RumahA', 'PerabotA', 'DB_A', 'Cerek_A', 'Meter_A', 'TiangMeter_A'],
    gejala: 'Rumah A gelap — RCCB TRIP. Cari punca kebocoran dahulu, kemudian set semula RCCB.',
    langkah: [
      { sasaran: ['Cerek_A'], berjaya: 'Cerek ini BOCOR arus ke bumi (elemen rosak). Palam dicabut — punca ditemui!', salahUrutan: '' },
      { sasaran: ['DB_A', 'Togol_A_RCCB'], berjaya: 'RCCB diset semula — bekalan Rumah A pulih.',
        salahUrutan: 'RCCB trip semula! Punca kebocoran masih ada — cari peralatan rosak di dapur dahulu.' },
    ],
  },
  {
    kunci: 'Kedai', label: 'KEDAI', fokus: 'kedai', pemilih: ['Kedai', 'PapanTanda_Kedai', 'PetiSejuk_Kedai', 'DB_Kedai', 'Bahaya_SoketBebanLebih'],
    gejala: 'Kedai gelap — MCB soket TRIP kerana beban lebih. Kurangkan beban dahulu, kemudian set semula MCB.',
    langkah: [
      { sasaran: ['Bahaya_SoketBebanLebih'], berjaya: 'Palam berlebihan dicabut — beban soket dikurangkan.', salahUrutan: '' },
      { sasaran: ['DB_Kedai', 'Togol_Kedai'], berjaya: 'MCB diset semula — kedai menyala semula.',
        salahUrutan: 'MCB trip semula! Soket masih terlebih beban — kurangkan palam pada soket dahulu.' },
    ],
  },
  {
    kunci: 'Dewan', label: 'DEWAN', fokus: 'dewan', pemilih: ['Dewan', 'PapanTanda_Dewan', 'DB_Dewan', 'Sambungan_Dewan'],
    gejala: 'Lampu dewan berkelip lalu padam — sambungan NEUTRAL longgar dalam DB. Kerja dengan selamat!',
    langkah: [
      { sasaran: ['DB_Dewan', 'Togol_Dewan'], berjaya: 'Suis utama DB dimatikan — selamat untuk membuka kotak agihan.', salahUrutan: '' },
      { sasaran: ['Sambungan_Dewan'], berjaya: 'Sambungan neutral yang longgar diketatkan.',
        salahUrutan: 'BAHAYA! Matikan suis utama DB dahulu sebelum menyentuh sambungan.' },
      { sasaran: ['DB_Dewan', 'Togol_Dewan'], berjaya: 'Suis utama dihidupkan semula — dewan menyala.',
        salahUrutan: 'Ketatkan sambungan neutral dahulu sebelum menghidupkan semula.' },
    ],
  },
  {
    kunci: 'Jalan', label: 'LAMPU JALAN', fokus: 'tiang', pemilih: ['LampuJalan', 'Kaca_LampuJalan', 'KotakFius_Tiang', 'Tiang_3'],
    gejala: 'Lampu jalan padam — fius dalam kotak fius tiang terbakar.',
    langkah: [
      { sasaran: ['KotakFius_Tiang'], berjaya: 'Fius terbakar diganti dengan fius baharu berkadar sama — lampu jalan menyala.', salahUrutan: '' },
    ],
  },
];

// ---------------- label terapung (KampungLabel.cs)
export const SENARAI_LABEL = [
  ['pencawang', 'Pencawang Elektrik', 'Pencawang', null, false],
  ['tiang', 'Tiang Elektrik', 'Tiang_2', null, false],
  ['talian', 'Talian Agihan', 'Aliran_01', 'Aliran_02', false],
  ['lampujalan', 'Lampu Jalan', 'LampuJalan', null, false],
  ['rumahA', 'Rumah Penduduk', 'RumahA', null, false],
  ['rumahB', 'Rumah Kampung', 'RumahB', null, false],
  ['dewan', 'Dewan Serbaguna', 'Dewan', null, false],
  ['kedai', 'Kedai Runcit', 'Kedai', null, false],
  ['meter', 'Meter kWj', 'Meter_A', null, true],
  ['db', 'Papan Agihan (DB)', 'DB_A', null, true],
  ['suis', 'Suis', 'Suis_A', null, true],
  ['lampu', 'Lampu', 'Kaca_A', null, true],
  ['soket', 'Soket Alur Keluar', 'Soket_A', null, true],
  // sasaran misi Rumah Gelap & Pulihkan Kampung (label kecil: hanya kelihatan semasa zum dekat)
  ['dbB', 'Kotak Agihan', 'DB_B', null, true],
  ['suisB', 'Suis Lampu', 'Suis_B', null, true],
  ['suisBRosak', 'Suis Lampu', 'Suis_B_Rosak', null, true],
  ['sambB', 'Sambungan Talian', 'Sambungan_B', null, true],
  ['dbKedai', 'Kotak Agihan', 'DB_Kedai', null, true],
  ['soketKedai', 'Soket', 'Bahaya_SoketBebanLebih', null, true],
  ['dbDewan', 'Kotak Agihan', 'DB_Dewan', null, true],
  ['sambDewan', 'Sambungan Neutral', 'Sambungan_Dewan', null, true],
  ['fius', 'Kotak Fius', 'KotakFius_Tiang', null, true],
];
// Langkah Misi 1 -> label yang dibuka.
export const LABEL_MISI1 = ['pencawang', 'tiang', 'talian', 'meter', 'db', 'lampu'];
