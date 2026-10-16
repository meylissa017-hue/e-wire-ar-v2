// Kandungan permainan E-WIRE AR — SALINAN daripada versi Android
// (Assets/Scripts/Data/DataPermainan.cs dalam projek Unity). Kalau soalan, label atau markah
// diubah di sana, ubah di sini juga supaya kedua-dua versi kekal sama.

export const XP = { L1_SETIAP_SOALAN: 10, L2: 30, L3: 30, L4: 50, L5: 100, L6: 100, L7: 100, L8: 100, L9: 100 };
// Jumlah sebenar semua 9 level: 50+30+30+50+100 + 4 x 100 = 660 (PengurusPermainan.XP_MAKSIMUM).
export const XP_MAKSIMUM = 660;
export const AMBANG_LEGENDA = 650;
export const JUMLAH_LEVEL = 9;
export const MASA_SETIAP_SOALAN = 20; // saat — tamat masa = jawapan salah

// Sama seperti PengurusPermainan.SEMUA_LEVEL_DIBUKA dalam versi Android.
export const SEMUA_LEVEL_DIBUKA = true;

export const TAJUK_LEVEL = ['', 'KENALI IA', 'PADANKAN IA', 'PILIH IA', 'SUSUN IA', 'WAYARKAN IA',
  'CARI KEROSAKAN', 'PASANG KIPAS SILING', 'UJI DENGAN MULTIMETER', 'RUMAH MENYALA'];
export const HURAIAN_LEVEL = [
  '',
  'Imbas penanda AR, kenal pasti komponen elektrik',
  'Seret wayar ke terminal L / N / PE yang betul',
  'Pilih bahan untuk satu misi pemasangan',
  'Susun langkah pemasangan mengikut urutan',
  'Lengkapkan litar lampu satu hala dalam AR',
  'Sentuh komponen 3D yang rosak, baiki dengan selamat',
  'Seret bahagian kipas 3D ke kedudukannya',
  'Uji bumi, penebat, voltan & kekutuban',
  'Pasang RCCB, MCB & kabel — rumah menyala!',
];

export const SOALAN_L1 = [
  { model: 'MCB', teks: 'Apakah aksesori ini?',
    pilihan: ['Soket Outlet', 'Suis', 'MCB', 'Pemegang Lampu'], betul: 2,
    penjelasan: 'MCB ialah peranti perlindungan dalam pemasangan elektrik.' },
  { model: 'Suis', teks: 'Apakah aksesori ini?',
    pilihan: ['MCB', 'Suis Satu Hala', 'Kotak Agihan', 'Soket Outlet'], betul: 1,
    penjelasan: 'Suis satu hala mengawal satu litar lampu daripada satu lokasi.' },
  { model: 'Soket', teks: 'Apakah aksesori ini?',
    pilihan: ['Pemegang Lampu', 'MCB', 'Soket Outlet', 'Kotak Agihan'], betul: 2,
    penjelasan: 'Soket outlet membekalkan kuasa kepada peralatan mudah alih.' },
  { model: 'PemegangLampu', teks: 'Apakah aksesori ini?',
    pilihan: ['Pemegang Lampu', 'Suis', 'Kotak Agihan', 'MCB'], betul: 0,
    penjelasan: 'Pemegang lampu menyambungkan mentol kepada pendawaian tetap.' },
  { model: 'KotakAgihan', teks: 'Apakah aksesori ini?',
    pilihan: ['Soket Outlet', 'Kotak Agihan', 'Suis', 'Pemegang Lampu'], betul: 1,
    penjelasan: 'Kotak Agihan mengagihkan bekalan kuasa kepada litar-litar cabang.' },
];

export const WAYAR_L2 = [
  { id: 'L', label: 'PERANG (L — Hidup)', warna: '#8B4A24' },
  { id: 'N', label: 'BIRU (N — Neutral)', warna: '#2255CC' },
  { id: 'PE', label: 'HIJAU/KUNING (PE)', warna: '#3FAE44' },
];
export const TERMINAL_L2 = [
  { id: 'L', label: 'L — Hidup' },
  { id: 'N', label: 'N — Neutral' },
  { id: 'PE', label: 'PE — Konduktor Perlindungan' },
];

export const MISI_L3 = 'Anda ingin memasang satu mata lampu yang dikawal menggunakan suis satu hala.';
export const ITEM_L3 = [
  { nama: 'Pemegang Lampu', perlu: true },
  { nama: 'Suis Satu Hala', perlu: true },
  { nama: 'Kabel', perlu: true },
  { nama: 'Soket Outlet', perlu: false },
  { nama: 'MCB 3 Fasa', perlu: false },
  { nama: 'Kotak Agihan', perlu: false },
  { nama: 'Suis Dua Hala', perlu: false },
  { nama: 'Fius Utama', perlu: false },
];

// urutan = kedudukan sebenar (0..3) dalam urutan pemasangan yang betul
export const LANGKAH_L4 = [
  { kod: 'A', teks: 'Membuat sambungan konduktor', urutan: 3 },
  { kod: 'B', teks: 'Menentukan kedudukan pemasangan', urutan: 0 },
  { kod: 'C', teks: 'Memasang laluan pendawaian', urutan: 1 },
  { kod: 'D', teks: 'Memasang aksesori', urutan: 2 },
];

export const WAYAR_L5 = [
  { id: 'L', label: 'PERANG (L)', warna: '#8B4A24' },
  { id: 'N', label: 'BIRU (N)', warna: '#2255CC' },
  { id: 'PE', label: 'HIJAU/KUNING (PE)', warna: '#3FAE44' },
];
export const TERMINAL_L5 = [
  { id: 'L', label: 'MCB → Suis (L)' },
  { id: 'N', label: 'Bekalan → Pemegang Lampu (N)' },
  { id: 'PE', label: 'Punca Bumi (PE)' },
];

export const CARA_MAIN = [
  'Level 1 - Kenali Ia: Imbas penanda AR, kenal pasti komponen elektrik.',
  'Level 2 - Padankan Ia: Seret wayar ke terminal L/N/PE yang betul.',
  'Level 3 - Pilih Ia: Pilih bahan yang diperlukan untuk satu misi pemasangan.',
  'Level 4 - Susun Ia: Susun langkah pemasangan mengikut urutan betul.',
  'Level 5 - Wayarkan Ia: Lengkapkan litar lampu satu hala penuh dalam AR!',
  'Level 6 - Cari Kerosakan: Sentuh komponen 3D yang rosak dan baiki mengikut prosedur selamat.',
  'Level 7 - Pasang Kipas Siling: Seret bahagian kipas 3D ke hologram mengikut urutan.',
  'Level 8 - Uji Dengan Multimeter: Tetapkan dial dan letak kuar pada titik ujian yang betul.',
  'Level 9 - Rumah Menyala: Pasang RCCB, MCB dan kabel yang betul, kemudian uji RCCB.',
  'KAMPUNG 3D: 6 misi dalam kampung AR — aliran tenaga, rumah gelap, wiring, perlindungan, cari bahaya dan pulihkan kampung.',
];

export const LABEL_SOLAR = [
  { objek: 'Label_Panel', teks: 'Panel Solar' },
  { objek: 'Label_Pengawal', teks: 'Pengawal Cas' },
  { objek: 'Label_Bateri', teks: 'Pek Bateri' },
  { objek: 'Label_Penyongsang', teks: 'Penyongsang' },
  { objek: 'Label_Grid', teks: 'Grid Awam' },
  { objek: 'Label_Rumah', teks: 'Beban (Rumah)' },
];
export const LABEL_LITAR = [
  { objek: 'SelKering', teks: 'Sel Kering' },
  { objek: 'SuisTapak', teks: 'Suis' },
  { objek: 'Mentol', teks: 'Mentol' },
  { objek: 'WayarPenyambung', teks: 'Wayar Penyambung', antara: ['Aliran_09', 'Aliran_10'] },
];

export function xpMaksimumLevel(n) {
  return [0, XP.L1_SETIAP_SOALAN * SOALAN_L1.length, XP.L2, XP.L3, XP.L4, XP.L5, XP.L6, XP.L7, XP.L8, XP.L9][n] || 0;
}

export function kocok(senarai) {
  const a = senarai.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ------- LEVEL 6: CARI KEROSAKAN — 3 kes pada papan latihan 3D, sentuh objek 3D -------
// aksi: KenalPasti | MatikanMCB | HidupkanMCB | GantiSoket | KetatkanWayar
export const KES_L6 = [
  {
    tajuk: 'KES 1: LAMPU TIDAK MENYALA',
    gejala: 'Pelanggan mengadu lampu tidak menyala langsung walaupun suis dihidupkan. Soket masih berfungsi.',
    petunjuk: 'Petunjuk: semak peranti perlindungan litar LAMPU dalam papan.',
    xp: 30,
    langkah: [
      { sasaran: 'mcbLampu', aksi: 'KenalPasti', arahan: 'Ketik komponen 3D yang menyebabkan lampu tidak menyala.',
        berjaya: 'BETUL! MCB LAMPU berada pada kedudukan OFF — ia telah TRIP.' },
      { sasaran: 'mcbLampu', aksi: 'HidupkanMCB', arahan: 'Ketik MCB LAMPU sekali lagi untuk set semula (ON).',
        berjaya: 'MCB diset semula — lampu kembali menyala!' },
    ],
    penjelasan: 'MCB akan TRIP (terputus) apabila arus melebihi kadarannya, contohnya beban lampau atau litar pintas.\n\nDalam kerja sebenar, kenal pasti dan baiki PUNCA trip dahulu sebelum menghidupkan semula MCB.',
  },
  {
    tajuk: 'KES 2: SOKET BERASAP',
    gejala: 'Bau hangit dan asap keluar dari soket. Plat soket kelihatan hitam terbakar.',
    petunjuk: 'Petunjuk: cari aksesori yang berasap.',
    xp: 30,
    langkah: [
      { sasaran: 'soket', aksi: 'KenalPasti', arahan: 'Ketik komponen 3D yang rosak.', berjaya: 'BETUL! Soket hangus akibat panas berlebihan.' },
      { sasaran: 'mcbSoket', aksi: 'MatikanMCB', arahan: 'KESELAMATAN DAHULU: matikan bekalan litar soket. Ketik MCB yang betul.',
        berjaya: 'Bekalan soket DIPUTUSKAN. Kini selamat untuk dibaiki.' },
      { sasaran: 'soket', aksi: 'GantiSoket', arahan: 'Ketik soket untuk menggantikannya dengan soket baharu.', berjaya: 'Soket baharu dipasang!' },
      { sasaran: 'mcbSoket', aksi: 'HidupkanMCB', arahan: 'Hidupkan semula bekalan: ketik MCB SOKET.', berjaya: 'Bekalan dipulihkan — soket berfungsi dengan selamat.' },
    ],
    penjelasan: 'Soket hangus biasanya berpunca daripada sambungan terminal yang longgar atau beban berlebihan.\n\nSentiasa MATIKAN MCB litar berkenaan sebelum membuka atau menggantikan aksesori.',
  },
  {
    tajuk: 'KES 3: LAMPU BERKELIP & PERCIKAN API',
    gejala: 'Lampu berkelip-kelip dan kedengaran bunyi berdesis. Ada percikan api berhampiran suis.',
    petunjuk: 'Petunjuk: perhatikan dari mana percikan api datang.',
    xp: 40,
    langkah: [
      { sasaran: 'suis', aksi: 'KenalPasti', arahan: 'Ketik bahagian 3D yang menyebabkan percikan api.', berjaya: 'BETUL! Wayar pada terminal suis LONGGAR.' },
      { sasaran: 'mcbLampu', aksi: 'MatikanMCB', arahan: 'KESELAMATAN DAHULU: matikan bekalan litar lampu. Ketik MCB yang betul.',
        berjaya: 'Bekalan lampu DIPUTUSKAN. Percikan api berhenti.' },
      { sasaran: 'suis', aksi: 'KetatkanWayar', arahan: 'Ketik suis untuk memasukkan semula wayar dan mengetatkan skru terminal.',
        berjaya: 'Wayar disambung semula dan skru terminal diketatkan!' },
      { sasaran: 'mcbLampu', aksi: 'HidupkanMCB', arahan: 'Hidupkan semula bekalan: ketik MCB LAMPU.', berjaya: 'Lampu menyala stabil — tiada lagi kelipan!' },
    ],
    penjelasan: 'Terminal yang longgar menghasilkan rintangan tinggi, haba dan percikan api (arka) — punca biasa kebakaran elektrik.\n\nPutuskan bekalan, masukkan semula konduktor sepenuhnya ke dalam terminal dan ketatkan skru.',
  },
];

// Objek papan yang boleh disentuh: nama objek glTF -> (id logik, nama paparan) — SasaranPapan6.
export const SASARAN_PAPAN6 = [
  ['MCB_Lampu', 'mcbLampu', 'MCB LAMPU'], ['MCB_Soket', 'mcbSoket', 'MCB SOKET'], ['Suis', 'suis', 'SUIS'],
  ['WayarLonggar', 'suis', 'WAYAR SUIS'], ['Soket', 'soket', 'SOKET'], ['PemegangLampu', 'lampu', 'PEMEGANG LAMPU'],
  ['Mentol', 'lampu', 'MENTOL'], ['BarNeutral', 'barN', 'BAR NEUTRAL'], ['BarBumi', 'barE', 'BAR BUMI'],
];

// ------- LEVEL 7: PASANG KIPAS SILING — seret & lepas bahagian 3D ke kedudukan hantu -------
export const BAHAGIAN_L7 = [
  { id: 'rod', nama: 'ROD & KANOPI', prasyarat: [], arahan: 'Seret ROD & KANOPI ke cangkuk pada siling.',
    fakta: 'Rod digantung pada cangkuk J di siling. Kanopi menutup sambungan wayar bekalan di siling.' },
  { id: 'motor', nama: 'MOTOR', prasyarat: ['rod'], arahan: 'Seret MOTOR ke hujung bawah rod.',
    fakta: 'Motor diikat pada rod dengan bolt dan PIN KESELAMATAN supaya kipas tidak tercabut ketika berputar.',
    mesejPrasyarat: 'Motor mesti digantung pada rod. Pasang ROD & KANOPI dahulu.' },
  { id: 'bilah', nama: 'BILAH KIPAS', prasyarat: ['motor'], arahan: 'Seret setiap BILAH ke lengan motor (3 bilah).',
    fakta: 'Ketiga-tiga bilah mesti dipasang sama rata dan skrunya diketatkan. Bilah yang tidak seimbang menyebabkan kipas bergoyang.',
    mesejPrasyarat: 'Bilah dipasang pada lengan motor. Pasang MOTOR dahulu.' },
  { id: 'penutup', nama: 'PENUTUP & LAMPU', prasyarat: ['bilah'], arahan: 'Seret PENUTUP ke bawah motor.',
    fakta: 'Penutup bawah melindungi pendawaian motor dan boleh memuatkan lampu.',
    mesejPrasyarat: 'Pasang ketiga-tiga BILAH dahulu sebelum penutup.' },
  { id: 'pengatur', nama: 'PENGATUR KELAJUAN', prasyarat: [], arahan: 'Seret PENGATUR ke kotak kosong pada dinding.',
    fakta: 'Pengatur (regulator) mengawal kelajuan kipas dengan mengubah voltan ke motor. Ia disambung pada wayar HIDUP (L).' },
];
export const OBJEK_KIPAS7 = [
  ['RodKanopi', 'rod', 'ROD & KANOPI'], ['Motor', 'motor', 'MOTOR'], ['Bilah1', 'bilah', 'BILAH'], ['Bilah2', 'bilah', 'BILAH'],
  ['Bilah3', 'bilah', 'BILAH'], ['Penutup', 'penutup', 'PENUTUP & LAMPU'], ['Pengatur', 'pengatur', 'PENGATUR'],
];

// ------- LEVEL 8: UJI DENGAN MULTIMETER — 4 ujian pada papan latihan, seret kuar 3D -------
// mod: 0 OFF, 1 V, 2 Ohm, 3 MOhm
export const UJIAN_L8 = [
  { tajuk: 'UJIAN 1: KETERUSAN BUMI', label: 'BUMI', bekalanHidup: false, mod: 2, titikMerah: 'SoketE', titikHitam: 'BarE',
    arahanMerah: 'Seret KUAR MERAH ke lubang BUMI (E) soket — lubang atas.', arahanHitam: 'Seret KUAR HITAM ke skru BAR BUMI (E).',
    bacaan: '0.21 Ω',
    fakta: 'Rintangan konduktor bumi mesti sangat rendah (biasanya kurang 1 Ω) supaya arus bocor mengalir ke bumi dan peranti perlindungan terpelantik.' },
  { tajuk: 'UJIAN 2: RINTANGAN PENEBAT', label: 'PENEBAT', bekalanHidup: false, mod: 3, titikMerah: 'SoketL', titikHitam: 'SoketE',
    arahanMerah: 'Seret KUAR MERAH ke lubang HIDUP (L) soket — kanan bawah.', arahanHitam: 'Seret KUAR HITAM ke lubang BUMI (E) soket — atas.',
    bacaan: '>999 MΩ',
    fakta: 'Rintangan penebat mesti sekurang-kurangnya 1 MΩ. Bacaan yang tinggi bermakna penebat wayar dalam keadaan baik dan tiada kebocoran.' },
  { tajuk: 'UJIAN 3: VOLTAN BEKALAN', label: 'VOLTAN', bekalanHidup: true, mod: 1, titikMerah: 'SoketL', titikHitam: 'SoketN',
    arahanMerah: 'Seret KUAR MERAH ke lubang HIDUP (L) soket — kanan bawah.', arahanHitam: 'Seret KUAR HITAM ke lubang NEUTRAL (N) soket — kiri bawah.',
    bacaan: '230 V',
    fakta: 'Voltan bekalan satu fasa di Malaysia ialah 230 V AC, 50 Hz. Pegang kuar pada bahagian bertebat sahaja semasa mengukur litar hidup.' },
  { tajuk: 'UJIAN 4: KEKUTUBAN', label: 'KUTUB', bekalanHidup: true, mod: 1, titikMerah: 'SoketN', titikHitam: 'SoketE',
    arahanMerah: 'Seret KUAR MERAH ke lubang NEUTRAL (N) soket — kiri bawah.', arahanHitam: 'Seret KUAR HITAM ke lubang BUMI (E) soket — atas.',
    bacaan: '0.4 V',
    fakta: 'Hampir 0 V antara N dan E menunjukkan KEKUTUBAN betul: wayar Hidup dan Neutral tidak tertukar pada soket.' },
];

// ------- LEVEL 9: RUMAH MENYALA -------
export const LITAR_L9 = {
  6: { slot: 0, litar: 'LAMPU', fakta: 'Litar lampu dilindungi MCB 6A kerana arus lampu kecil; biasanya guna kabel 1.5 mm².' },
  20: { slot: 1, litar: 'SOKET', fakta: 'Litar soket alur keluar 13A (jejari) biasanya dilindungi MCB 20A dengan kabel 2.5 mm².' },
  32: { slot: 2, litar: 'AIRCOND', fakta: 'Penghawa dingin berkuasa tinggi memerlukan litar khas — contohnya MCB 32A dengan kabel 4 mm².' },
};
export const KABEL_L9 = {
  6: { saiz: '1.5', nilai: 1.5, fakta: 'Kabel 1.5 mm² cukup untuk litar lampu (MCB 6A) — arusnya kecil.' },
  20: { saiz: '2.5', nilai: 2.5, fakta: 'Kabel 2.5 mm² untuk litar soket (MCB 20A). Semakin besar arus, semakin besar keratan rentas kabel.' },
  32: { saiz: '4.0', nilai: 4.0, fakta: 'Kabel 4 mm² untuk aircond (MCB 32A). Kabel terlalu kecil akan panas dan boleh menyebabkan kebakaran.' },
};
// (objek, id, nama, dulang, objek hantu sasaran)
export const KOMPONEN_L9 = [
  ['RCCB', 'rccb', 'RCCB 30mA', 'Dulang_RCCB', 'RCCB'],
  ['MCB_6', '6', 'MCB 6A', 'Dulang_MCB_6', 'MCB_6'],
  ['MCB_20', '20', 'MCB 20A', 'Dulang_MCB_20', 'MCB_20'],
  ['MCB_32', '32', 'MCB 32A', 'Dulang_MCB_32', 'MCB_32'],
  ['Gegelung_6', 'k6', 'Kabel 1.5 mm²', 'Dulang_Gegelung_6', 'Kabel_6'],
  ['Gegelung_20', 'k20', 'Kabel 2.5 mm²', 'Dulang_Gegelung_20', 'Kabel_20'],
  ['Gegelung_32', 'k32', 'Kabel 4.0 mm²', 'Dulang_Gegelung_32', 'Kabel_32'],
];
