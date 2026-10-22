// Level 9 — RUMAH MENYALA (Level9_RumahMenyala.cs, level penutup). Rumah mini 3 bilik + papan agihan.
//   1. Pasang RCCB 30mA di sebelah suis utama.
//   2. Pasang MCB 6A / 20A / 32A ke slot litar yang BETUL (1 LAMPU, 2 SOKET, 3 AIRCOND).
//   3. Sambung kabel 1.5 / 2.5 / 4.0 mm² ke MCB litar yang sepadan; kabel 3D "tumbuh" ke bilik.
//   4. Ketik SUIS UTAMA.  5. Uji RCCB (butang TEST -> trip).  6. Ketik RCCB -> malam, rumah menyala.
// Seret, atau ketik komponen kemudian ketik sasaran. +100 XP (-5 setiap kesilapan, minimum 50).
import { THREE, Penempatan, tengahkan, muatModel, kamera, cahayaSkena, pulihkanCahaya } from './ar.js';
import * as D from './data.js';
import { tambahXP, tandaSelesai } from './simpan.js';
import * as K from './kesan.js';
import { HUD, WARNA, KEADAAN } from './hud.js';
import { asasLevel, bawahDalamInduk } from './level6.js';
import { pusatDunia } from './level7.js';
import {
  pose, cariSemua, Pemilih, pasangSentuh, Zarah, kesanBetul, bungaApi, binaHantu, bahanHantu, bahanMenyala,
  srgb, sinar, keSkrin, tekstur, daftarUji,
} from './alat3d.js';

const JARAK_TOGOL = 0.011;
const SUDUT_CONDONG = 16 * Math.PI / 180;   // rumah anak patung: lihat ke dalam bilik dari atas sedikit
const ID_LITAR = ['6', '20', '32'];
const F = { RCCB: 0, MCB: 1, Kabel: 2, Utama: 3, Uji: 4, SetSemula: 5, Selesai: 6 };
const J = { RCCB: 0, MCB: 1, KABEL: 2 };
const jenis = (id) => (id === 'rccb' ? J.RCCB : id.startsWith('k') ? J.KABEL : J.MCB);
const kadar = (id) => (id.startsWith('k') ? id.slice(1) : id);

// Palet matte (PALET_RUMAH): nama bahan -> [r, g, b, kelicinan Unity, logam]
const PALET = {
  Rumah_Lantai: [0.58, 0.53, 0.47, 0.15, 0], Rumah_Dinding: [0.83, 0.76, 0.63, 0.04, 0], Rumah_DindingBilik: [0.60, 0.69, 0.78, 0.04, 0],
  Rumah_DindingDapur: [0.76, 0.82, 0.71, 0.04, 0], Rumah_Trim: [0.34, 0.23, 0.15, 0.12, 0], Rumah_Bingkai: [0.86, 0.86, 0.84, 0.15, 0],
  Rumah_Kayu: [0.48, 0.32, 0.19, 0.15, 0], Rumah_KayuGelap: [0.24, 0.16, 0.10, 0.15, 0], Rumah_Sofa: [0.48, 0.15, 0.12, 0.02, 0],
  Rumah_Kusyen: [0.86, 0.70, 0.32, 0.02, 0], Rumah_Hitam: [0.07, 0.07, 0.08, 0.35, 0], Rumah_SkrinTV: [0.03, 0.04, 0.05, 0.55, 0],
  Rumah_Putih: [0.84, 0.84, 0.83, 0.25, 0], Rumah_Perak: [0.62, 0.64, 0.67, 0.4, 0.6], Rumah_KacaLampu: [0.90, 0.88, 0.80, 0.25, 0],
  Rumah_Emas: [0.70, 0.55, 0.26, 0.35, 0.5], Rumah_Selimut: [0.21, 0.36, 0.62, 0.02, 0], Rumah_KipasBiru: [0.20, 0.47, 0.70, 0.25, 0],
  Rumah_LED: [0.08, 0.22, 0.10, 0.3, 0], Rumah_PapanAgihan: [0.32, 0.30, 0.28, 0.05, 0], Rumah_KotakDB: [0.82, 0.83, 0.83, 0.2, 0],
  Rumah_DBDalam: [0.27, 0.28, 0.30, 0.08, 0], Rumah_Rel: [0.66, 0.68, 0.71, 0.45, 0.6], Rumah_Label: [0.93, 0.80, 0.24, 0.1, 0],
  Rumah_Konduit: [0.52, 0.53, 0.55, 0.15, 0], Rumah_Rak: [0.52, 0.36, 0.23, 0.1, 0], Rumah_Atap: [0.56, 0.23, 0.15, 0.08, 0],
  Rumah_Gable: [0.86, 0.83, 0.76, 0.04, 0], Rumah_Kabel: [0.40, 0.20, 0.08, 0.3, 0], Rumah_TerasL: [0.40, 0.20, 0.08, 0.3, 0],
  Rumah_TerasN: [0.08, 0.22, 0.62, 0.3, 0], Rumah_TerasE: [0.45, 0.62, 0.10, 0.3, 0], Rumah_Drum: [0.42, 0.28, 0.16, 0.08, 0],
  Rumah_DrumMuka: [0.88, 0.88, 0.86, 0.08, 0], Rumah_TagRCCB: [0.15, 0.40, 0.78, 0.1, 0], Rumah_ButangTest: [0.95, 0.75, 0.10, 0.3, 0],
  MCB_Putih: [0.86, 0.86, 0.85, 0.22, 0], MCB_Hitam: [0.08, 0.08, 0.09, 0.3, 0], MCB_Kelabu: [0.45, 0.46, 0.48, 0.2, 0],
  MCB_Kuningan: [0.70, 0.56, 0.28, 0.4, 0.6], MCB_Logam: [0.62, 0.64, 0.66, 0.4, 0.6],
};

function realistikkanBahan(model) {
  const cache = new Map();
  const bahan = (asal, paksa) => {
    const kunci = asal.name + (paksa ? paksa.join() : '');
    if (cache.has(kunci)) return cache.get(kunci);
    const p = PALET[asal.name];
    const m = asal.clone();
    if (p) { m.color = srgb(p[0], p[1], p[2]); m.roughness = 1 - p[3]; m.metalness = p[4]; }
    else { m.color = asal.color.clone().multiplyScalar(0.92); m.roughness = 0.88; m.metalness = 0; }
    if (paksa) { m.color = srgb(...paksa); m.roughness = 0.7; }
    cache.set(kunci, m);
    return m;
  };
  model.traverse((x) => {
    if (!x.isMesh || x.material.name === 'Rumah_Tingkap' || x.material.name === 'Rumah_KayuPapan') return;
    // Togol mengikut produk sebenar: MCB = hitam, suis utama = merah, RCCB = biru.
    // (mesh berbilang bahan glTF dinamakan "<objek>_1", "<objek>_2" — semak nama objek dan induknya)
    let n = x.name, induk = x.parent;
    while (induk && !/^Togol/.test(n)) { n = induk.name || ''; induk = induk.parent; }
    const togol = /^Togol_MCB/.test(n) ? [0.09, 0.09, 0.1] : /^TogolUtama/.test(n) ? [0.72, 0.1, 0.08] : /^Togol_RCCB/.test(n) ? [0.14, 0.34, 0.72] : null;
    x.material = bahan(x.material, togol && x.material.name === 'MCB_Merah' ? togol : null);
  });
}

export async function level9(ctx) {
  const { el, m } = asasLevel(ctx, 9);
  const hud = new HUD(el, { cip: 5 });
  const elTajuk = el.querySelector('.l-tajuk');
  elTajuk.textContent = 'RUMAH MENYALA';
  hud.arahan('IMBAS', 'Halakan kamera ke poster untuk memaparkan rumah 3D.', WARNA.neon);

  let tempat = null, model = null, o = null, condong = null, zk = null, kabus = null;
  const komponen = [];                       // { obj, id, nama, terpasang, diisi, dulang, hantu, sasaran }
  const togol = new Map(), togolPose = new Map(), kabel = new Map();
  const mcbOn = { 6: false, 20: false, 32: false }, litarHidup = { 6: false, 20: false, 32: false };
  let suisUtama = null, butangTest = null;
  let utamaHidup = false, rccbHidup = false, pernahUtama = false, diuji = false, malam = false, selesai = false, sibuk = true, mula = false;
  let kesilapan = 0;
  const lampu = [], tingkap = [];
  let tv = null, tvAsal = null, tvBahan = null, tvKitar = null, bilahKipas = null, kipasLaju = 0, led = null, ledAsal = null, ledBahan = null;
  let flap = null, flapTutup = null, bahanKacaMenyala = null, bahanMalam = null;
  const pemilih = new Pemilih();
  const hantuBiasa = bahanHantu(false), hantuAktif = bahanHantu(true);
  let calon = null, diseret = null, dipilih = null, hover = null, posMula = null, denyut = null;

  const terpasang = (id) => komponen.some((b) => b.id === id && b.terpasang);
  const bilTerpasang = (j) => komponen.filter((b) => jenis(b.id) === j && b.terpasang).length;
  const fasa = () => {
    if (!terpasang('rccb')) return F.RCCB;
    if (bilTerpasang(J.MCB) < 3) return F.MCB;
    if (bilTerpasang(J.KABEL) < 3) return F.Kabel;
    if (selesai) return F.Selesai;
    if (!pernahUtama) return F.Utama;
    if (!diuji) return F.Uji;
    return F.SetSemula;
  };

  function kemaskiniCip() {
    const f = fasa();
    const semasa = f === F.RCCB ? 0 : f === F.MCB ? 1 : f === F.Kabel ? 2 : f === F.Utama ? 3 : f === F.Selesai ? -1 : 4;
    const mcb = bilTerpasang(J.MCB), kb = bilTerpasang(J.KABEL);
    const siap = [terpasang('rccb'), mcb === 3, kb === 3, pernahUtama, selesai];
    const label = ['RCCB', `MCB ${mcb}/3`, `KABEL ${kb}/3`, 'UTAMA', 'UJI RCCB'];
    for (let i = 0; i < 5; i++) hud.cip(i, siap[i] ? KEADAAN.Siap : i === semasa ? KEADAAN.Semasa : KEADAAN.Terkunci, label[i]);
    const bil = (siap[0] ? 1 : 0) + mcb + kb + (pernahUtama ? 1 : 0) + (diuji ? 1 : 0);
    hud.garis(selesai ? 1 : bil / 10);
  }
  kemaskiniCip();

  function paparArahan() {
    switch (fasa()) {
      case F.RCCB: hud.arahan('RCCB', 'Pasang RCCB 30mA (label biru) ke ruang RCCB, di sebelah suis utama.', WARNA.emas); break;
      case F.MCB: {
        const b = komponen.filter((x) => jenis(x.id) === J.MCB && !x.terpasang).map((x) => D.LITAR_L9[x.id]).sort((a, c) => a.slot - c.slot)[0];
        hud.arahan('MCB', `Pasang MCB yang betul ke slot ${b.slot + 1} (${b.litar}). Lihat kadar ampere pada label kuning.`, WARNA.emas); break;
      }
      case F.Kabel: {
        const b = komponen.filter((x) => jenis(x.id) === J.KABEL && !x.terpasang).map((x) => D.LITAR_L9[kadar(x.id)]).sort((a, c) => a.slot - c.slot)[0];
        hud.arahan('KABEL', `Sambung kabel: seret gegelung yang sesuai ke MCB litar ${b.slot + 1} (${b.litar}). Lihat saiz mm² pada gegelung.`, WARNA.emas); break;
      }
      case F.Utama: hud.arahan('UTAMA', 'Semua siap dipasang! Ketik SUIS UTAMA (paling kiri) untuk membekalkan elektrik.', WARNA.salah); break;
      case F.Uji: hud.arahan('UJI', 'Sebelum guna, UJI RCCB: ketik butang TEST kuning (T) pada RCCB.', WARNA.salah); break;
      case F.SetSemula: hud.arahan('SET', 'RCCB TRIP — ia berfungsi! Ketik RCCB untuk set semula (ON) dan hidupkan rumah.', WARNA.betul); break;
      default: break;
    }
  }

  function bolehAmbil(b) {
    const f = fasa(), j = jenis(b.id);
    if (j === J.MCB && f === F.RCCB) { hud.toast('Pasang RCCB dahulu — ia melindungi semua litar di belakangnya.', WARNA.neon, 2.4); return false; }
    if (j === J.KABEL && f < F.Kabel) { hud.toast(f === F.RCCB ? 'Pasang RCCB dahulu.' : 'Pasang ketiga-tiga MCB dahulu, kemudian sambung kabel.', WARNA.neon, 2.4); return false; }
    return true;
  }

  // ---------- hantu & slot
  function tunjukHantu(s, tunjuk, aktif = false) {
    s.hantu.visible = tunjuk;
    s.hantu.traverse((x) => { if (x.isMesh) x.material = aktif ? hantuAktif : hantuBiasa; });
  }
  const tunjukSemuaHantu = (tunjuk, j = -1) => { for (const s of komponen) tunjukHantu(s, tunjuk && !s.diisi && jenis(s.id) === j); };
  // Hantu kabel ialah laluan panjang — sasarannya ialah terminal atas MCB (asal objek kabel).
  const pusatHantu = (s) => (jenis(s.id) === J.KABEL ? s.hantu.getWorldPosition(new THREE.Vector3()) : pusatDunia(s.hantu));
  function slotTerdekat(x, y, nisbah, j) {
    let terbaik = null, had = el.clientHeight * nisbah;
    for (const s of komponen) {
      if (s.diisi || jenis(s.id) !== j) continue;
      const p = keSkrin(pusatHantu(s));
      const d = Math.hypot(p.x - x, p.y - y);
      if (p.z < 1 && d < had) { had = d; terbaik = s; }
    }
    return terbaik;
  }

  // ---------- input
  function mulaSentuh(x, y) {
    posMula = { x, y }; calon = null;
    if (sibuk || !model) return;
    const h = pemilih.kena(x, y, { jejari: 0.02 });
    if (h && h.data.komponen && !h.data.terpasang) calon = h.data;
  }

  function seret(x, y) {
    if (!diseret) {
      if (!calon || Math.hypot(x - posMula.x, y - posMula.y) < el.clientHeight * 0.025) return;
      const c = calon; calon = null;
      if (!bolehAmbil(c)) return;
      batalPilih();
      diseret = c;
      tunjukSemuaHantu(true, jenis(c.id));
    }
    const s = tempat.akar.scale.x;
    const depan = kamera().getWorldDirection(new THREE.Vector3());
    // Papan agihan & rak dianjak ~15.5 cm ke hadapan model, jadi satah seret mesti di hadapan kotak agihan
    // (0.2). Pada 0.08 komponen yang diseret berada DI BELAKANG papan dan terlindung.
    const titik = tempat.akar.getWorldPosition(new THREE.Vector3()).addScaledVector(depan, -0.2 * s);
    const satah = new THREE.Plane().setFromNormalAndCoplanarPoint(depan.clone().negate(), titik);
    const hit = new THREE.Vector3();
    if (sinar(x, y - el.clientHeight * 0.06).intersectPlane(satah, hit)) diseret.obj.position.copy(diseret.obj.parent.worldToLocal(hit));
    const p = keSkrin(diseret.obj.getWorldPosition(new THREE.Vector3()));
    const baru = slotTerdekat(p.x, p.y, 0.06, jenis(diseret.id));
    if (baru !== hover) {
      if (hover) tunjukHantu(hover, true);
      hover = baru;
      if (hover) { tunjukHantu(hover, true, true); K.bunyiKetik(); }
    }
  }

  function tamatSentuh(x, y, ketik) {
    if (diseret) {
      const b = diseret; diseret = null;
      const s = hover; hover = null;
      tunjukSemuaHantu(false);
      lepas(b, s);
      return;
    }
    if (!ketik) return;
    if (calon) {
      const b = calon; calon = null;
      if (dipilih === b) { batalPilih(); return; }
      if (bolehAmbil(b)) pilih(b);
      return;
    }
    if (dipilih) {
      const j = jenis(dipilih.id);
      const s = slotTerdekat(x, y, 0.08, j);
      if (!s) {
        const ke = j === J.RCCB ? 'ruang RCCB di sebelah suis utama' : j === J.KABEL ? 'MCB litar dalam kotak agihan' : 'slot 1, 2 atau 3 dalam kotak agihan';
        hud.toast('Ketik ' + ke + '.', WARNA.neon, 1.8);
        return;
      }
      const b = dipilih; batalPilih();
      lepas(b, s);
      return;
    }
    const h = pemilih.kena(x, y, { jejari: 0.02 });
    if (!h) return;
    if (h.data.id === 'utama') { ketikUtama(); return; }
    if (h.data.id === 'test') { ketikTest(); return; }
    const k = h.data;
    if (!k.komponen || !k.terpasang) return;
    if (k.id === 'rccb') {
      // Ketika fasa uji, ketik di mana-mana pada RCCB pun dikira menekan TEST (sasaran kecil di telefon).
      if (fasa() === F.Uji) ketikTest(); else ketikRCCB();
    } else if (jenis(k.id) === J.MCB && selesai) togolLitar(k.id);
  }

  function pilih(b) {
    batalPilih();
    dipilih = b;
    tunjukSemuaHantu(true, jenis(b.id));
    const asal = b.obj.scale.clone();
    denyut = m.setiap((dt, t) => { b.obj.scale.copy(asal).multiplyScalar(1.08 + 0.06 * Math.sin(t * 9)); });
    denyut.asal = asal;
    const ke = jenis(b.id) === J.RCCB ? 'ketik ruang RCCB dalam kotak agihan' : jenis(b.id) === J.KABEL ? 'ketik MCB litar yang sepadan' : 'ketik slot dalam kotak agihan';
    hud.toast(`${b.nama} dipilih — ${ke}.`, WARNA.emas, 2);
  }

  function batalPilih() {
    if (denyut) { denyut.henti(); if (dipilih) dipilih.obj.scale.copy(dipilih.dulang.skala); }
    denyut = null; dipilih = null;
    tunjukSemuaHantu(false);
  }

  // ---------- pasang
  function lepas(b, s) {
    if (!s) { pose(m, b.obj, b.dulang, 0.25); return; }
    if (s.id !== b.id) {
      kesilapan++;
      let mesej;
      if (jenis(b.id) === J.KABEL) {
        const ada = D.KABEL_L9[kadar(b.id)], perlu = D.KABEL_L9[kadar(s.id)], litar = D.LITAR_L9[kadar(s.id)].litar;
        mesej = ada.nilai < perlu.nilai
          ? `BAHAYA! Kabel ${ada.saiz} mm² terlalu KECIL untuk litar ${litar} — ia akan panas melampau dan boleh terbakar!`
          : `Kabel ${ada.saiz} mm² terlalu BESAR untuk litar ${litar} — membazir dan sukar masuk terminal MCB. Padankan dengan kadar MCB.`;
      } else {
        const k1 = Number(b.id), k2 = Number(s.id), litar = D.LITAR_L9[s.id].litar;
        mesej = k1 < k2 ? `MCB ${k1}A terlalu KECIL untuk litar ${litar} — ia akan trip setiap kali digunakan!`
          : `BAHAYA! MCB ${k1}A terlalu BESAR untuk litar ${litar} — kabel boleh terbakar sebelum MCB trip.`;
      }
      hud.toast(mesej + '  (-5 XP)', WARNA.salah, 3.5);
      K.kilat(WARNA.salah); K.bunyiSalah();
      pose(m, b.obj, b.dulang, 0.3);
      return;
    }
    pasang(b, s);
  }

  async function pasang(b, s) {
    sibuk = true;
    s.diisi = b; b.terpasang = true;
    const j = jenis(b.id);
    if (j === J.KABEL) {
      // Gegelung terbang ke terminal MCB dan mengecil; kabel 3D "tumbuh" dari MCB ke bilik.
      await pose(m, b.obj, { pos: s.hantu.position, skala: new THREE.Vector3(0.3, 0.3, 0.3) }, 0.22);
      b.obj.visible = false;
      const kd = kadar(b.id), kb = kabel.get(kd);
      if (kb) { kb.visible = true; kb.scale.set(0.001, 0.001, 0.001); K.bunyiKetik(); await pose(m, kb, { skala: new THREE.Vector3(1, 1, 1) }, 0.6); }
      kesanBetul(zk, model.worldToLocal(s.hantu.getWorldPosition(new THREE.Vector3())));
      K.kilat(WARNA.betul, 200);
      hud.toast(`Kabel ${D.KABEL_L9[kd].saiz} mm² -> litar ${D.LITAR_L9[kd].litar}: BETUL!`, WARNA.betul);
      hud.fakta(D.KABEL_L9[kd].fakta);
    } else {
      await pose(m, b.obj, { pos: s.hantu.position, rot: s.hantu.quaternion, skala: new THREE.Vector3(1, 1, 1) }, 0.22);
      K.bunyiBetul();
      kesanBetul(zk, model.worldToLocal(b.obj.getWorldPosition(new THREE.Vector3())));
      K.kilat(WARNA.betul, 200);
      if (j === J.RCCB) {
        hud.toast('RCCB 30mA dipasang: BETUL!', WARNA.betul);
        hud.fakta('RCCB mengesan arus BOCOR ke bumi. Pada 30mA ia trip dalam kurang 0.04 saat — cukup pantas untuk menyelamatkan nyawa daripada renjatan.');
      } else {
        hud.toast(`MCB ${b.id}A -> litar ${D.LITAR_L9[b.id].litar}: BETUL!`, WARNA.betul);
        hud.fakta(D.LITAR_L9[b.id].fakta);
      }
    }
    if (!m.hidup) return;
    kemaskiniCip(); paparArahan();
    sibuk = false;
  }

  // ---------- suis utama -> uji RCCB -> set semula -> malam -> rumah menyala
  function tetapkanTogol(t, on, segera) {
    const p = t && togolPose.get(t);
    if (!p) return Promise.resolve();
    const ke = on ? p.on.clone() : p.on.clone().addScaledVector(p.turun, JARAK_TOGOL);
    if (segera) { t.position.copy(ke); return Promise.resolve(); }
    return pose(m, t, { pos: ke }, 0.16).then(() => K.bunyiKetik());
  }

  async function ketikUtama() {
    if (sibuk) return;
    const f = fasa();
    if (f < F.Utama) { hud.toast('Pasang semua komponen dahulu (RCCB, MCB, kabel).', WARNA.neon); return; }
    if (f === F.Uji || f === F.SetSemula) { hud.toast(f === F.Uji ? 'Uji RCCB dahulu — ketik butang TEST kuning.' : 'Ketik RCCB untuk set semula.', WARNA.neon); return; }
    sibuk = true;
    if (utamaHidup) {
      utamaHidup = false;
      await tetapkanTogol(togol.get('utama'), false);
      kemaskiniBeban(false);
      hud.toast('SUIS UTAMA OFF — semua litar terputus.', WARNA.neon);
      sibuk = false; return;
    }
    utamaHidup = true;
    await tetapkanTogol(togol.get('utama'), true);
    if (!pernahUtama) {
      // Kali pertama: RCCB juga dihidupkan, MCB masih OFF — sedia untuk diuji.
      pernahUtama = true; rccbHidup = true;
      await tetapkanTogol(togol.get('rccb'), true);
      hud.fakta('Suis utama memutuskan SEMUA litar serentak. Matikan ia sebelum sebarang kerja penyelenggaraan.');
      kemaskiniCip(); paparArahan();
    } else { kemaskiniBeban(true); hud.toast('SUIS UTAMA ON.', WARNA.emas); }
    sibuk = false;
  }

  async function ketikTest() {
    if (sibuk) return;
    const f = fasa();
    if (f < F.Uji) { hud.toast(f === F.Utama ? 'Hidupkan SUIS UTAMA dahulu — RCCB perlu bekalan untuk diuji.' : 'Pasang semua komponen dahulu.', WARNA.neon); return; }
    if (!utamaHidup || !rccbHidup) { hud.toast('RCCB sudah OFF — ketik RCCB untuk set semula.', WARNA.neon); return; }
    sibuk = true;
    if (butangTest) {
      const asal = butangTest.scale.clone();
      await pose(m, butangTest, { skala: asal.clone().multiplyScalar(0.75) }, 0.08);
      await pose(m, butangTest, { skala: asal }, 0.1);
    }
    rccbHidup = false;
    await tetapkanTogol(togol.get('rccb'), false);
    kemaskiniBeban(false);
    K.kilat(WARNA.salah, 300); K.bunyiSalah();
    if (!diuji) {
      diuji = true;
      hud.toast('KLIK! RCCB TRIP — ujian LULUS.', WARNA.betul, 2.6);
      hud.fakta('Butang TEST mencipta arus bocor tiruan. Jika RCCB tidak trip, ia ROSAK dan mesti diganti. Uji setiap 3 bulan.');
      kemaskiniCip(); paparArahan();
    } else hud.toast('RCCB TRIP — semua litar terputus. Ketik RCCB untuk set semula.', WARNA.salah, 2.4);
    sibuk = false;
  }

  async function ketikRCCB() {
    if (sibuk) return;
    const f = fasa();
    if (f < F.Uji) { hud.toast(f === F.Utama ? 'Ketik SUIS UTAMA dahulu.' : 'Pasang semua komponen dahulu.', WARNA.neon); return; }
    if (f === F.Uji) return;
    if (rccbHidup) {
      sibuk = true; rccbHidup = false;
      await tetapkanTogol(togol.get('rccb'), false);
      kemaskiniBeban(false);
      hud.toast('RCCB OFF — semua litar terputus.', WARNA.neon);
      sibuk = false; return;
    }
    sibuk = true; rccbHidup = true;
    await tetapkanTogol(togol.get('rccb'), true);
    if (f === F.SetSemula) {
      hud.arahan('MALAM', 'RCCB ON! Malam menjelma... perhatikan rumah menyala.', WARNA.neon);
      if (!malam) await jadikanMalam();
      for (const k of ID_LITAR) {
        await m.tunggu(0.8);
        if (!m.hidup) return;
        mcbOn[k] = true;
        await tetapkanTogol(togol.get(k), true);
        kemaskiniBeban(true);
      }
      await tamat();
    } else { kemaskiniBeban(true); hud.toast('RCCB ON — bekalan dipulihkan.', WARNA.emas); }
    sibuk = false;
  }

  async function jadikanMalam() {
    malam = true;
    for (const t of tingkap) t.material = bahanMalam;
    const c = cahayaSkena();
    const gelap = new THREE.Color(0.12, 0.14, 0.24);
    await m.animasi(1.6, (k) => {
      if (!c) return;
      c.arah.intensity = 2.2 * (1 - 0.78 * k); c.isi.intensity = 0.8 * (1 - 0.78 * k);
      c.ambien.intensity = 1.5 * (1 - 0.6 * k); c.ambien.color.setRGB(1, 1, 1).lerp(gelap.clone().multiplyScalar(4), k);
    });
  }

  function togolLitar(id) {
    if (sibuk) return;
    const on = !mcbOn[id];
    mcbOn[id] = on;
    tetapkanTogol(togol.get(id), on);
    kemaskiniBeban(true);
    const sebab = !utamaHidup ? ' (tiada bekalan — suis utama OFF)' : !rccbHidup ? ' (tiada bekalan — RCCB OFF)' : '';
    hud.toast(`MCB ${id}A ${on ? 'ON' : 'OFF'} — litar ${D.LITAR_L9[id].litar}${sebab}`, on ? WARNA.emas : WARNA.neon, 1.8);
  }

  /** Beban hidup hanya jika SUIS UTAMA, RCCB dan MCB litarnya semua ON. */
  function kemaskiniBeban(kesan) {
    for (const id of ID_LITAR) {
      const on = utamaHidup && rccbHidup && mcbOn[id];
      if (on !== litarHidup[id]) tetapkanLitar(id, on, kesan);
    }
  }

  function tetapkanLitar(id, on, kesan) {
    litarHidup[id] = on;
    if (on && kesan) K.bunyiBetul();
    if (id === '6') {
      for (const l of lampu) {
        l.kaca.traverse((x) => { if (x.isMesh) x.material = on ? bahanKacaMenyala : x.userData.bahanAsal; });
        if (l.cahaya) l.cahaya.visible = on;
        if (on && kesan) kesanBetul(zk, model.worldToLocal(l.kaca.getWorldPosition(new THREE.Vector3())));
      }
    } else if (id === '20') {
      if (tv) tv.material = on ? tvBahan : tvAsal;
      if (tvKitar) { tvKitar.henti(); tvKitar = null; }
      if (on) {
        let baki = 0;
        tvKitar = m.setiap((dt) => {
          baki -= dt;
          if (baki > 0) return;
          baki = 0.25 + Math.random() * 0.45;
          const c = new THREE.Color().setHSL(Math.random(), 0.6, 0.5);
          tvBahan.emissive.copy(c).multiplyScalar(1.4); tvBahan.color.copy(c).multiplyScalar(0.3);
        });
      }
      kipasLaju = on ? 720 : 0;
      if (led) led.material = on ? ledBahan : ledAsal;
    } else if (id === '32') {
      if (flap) flap.quaternion.copy(flapTutup).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), on ? 35 * Math.PI / 180 : 0));
      if (kabus) {
        const t = o.get('TitikAngin');
        kabus.berterusan(on && t ? 22 : null, t ? {
          pos: model.worldToLocal(t.getWorldPosition(new THREE.Vector3())), kotak: new THREE.Vector3(0.06, 0.002, 0.002),
          arah: new THREE.Vector3(0, -0.7, 0.7), sebar: 0.2, laju: [0.03, 0.06], hayat: [0.8, 1.4], saiz: [0.008, 0.016], membesar: 2,
          warna: srgb(1, 1, 1), warnaAkhir: srgb(0.7, 0.85, 1), alfa: 0.55, pudarMasuk: 0.2,
        } : null);
      }
    }
  }

  async function tamat() {
    selesai = true;
    kemaskiniCip();
    const xp = Math.max(D.XP.L9 / 2, D.XP.L9 - 5 * kesilapan);
    tambahXP(xp, 9); tandaSelesai(9);
    bungaApi(zk, new THREE.Vector3(0, 0.15, 0));
    K.kilat(WARNA.emas, 500); K.bunyiMenang();
    elTajuk.textContent = 'RUMAH MENYALA!';
    hud.toast('TAHNIAH! SELURUH RUMAH MENYALA DENGAN SELAMAT!', WARNA.emas, 4);
    hud.arahan('SIAP', 'Cuba: ketik MCB (togol litar), butang TEST (RCCB trip), atau RCCB (set semula).', WARNA.betul);
    await m.tunggu(0.8);
    K.konfeti(); K.popup(`+${xp} XP`, WARNA.emas);
    await m.tunggu(4.5);
    if (!m.hidup) return;
    ctx.panelTamat({ tajuk: '★ RUMAH MENYALA! ★', subtajuk: 'LEVEL 9 SELESAI', bintang: kesilapan === 0 ? 3 : kesilapan <= 3 ? 2 : 1, xp: `+${xp} XP`,
      butang: [{ teks: 'LIHAT KEPUTUSAN', ke: 'keputusan', utama: true }, { teks: 'MENU UTAMA', ke: 'menu' }] });
  }

  // ---------- AR
  const sentuh = pasangSentuh({ turun: mulaSentuh, gerak: seret, naik: tamatSentuh,
    batal: () => { if (diseret) { const b = diseret; diseret = null; hover = null; tunjukSemuaHantu(false); pose(m, b.obj, b.dulang, 0.25); } } });
  const pengawal = {
    kemaskini(dt) {
      m.kemaskini(dt);
      if (!tempat) return;
      tempat.kemaskini(dt);
      el.classList.toggle('dikesan', tempat.nampak);
      if (tempat.nampak && !mula) { mula = true; sibuk = false; kemaskiniCip(); paparArahan(); }
      const s = tempat.akar.scale.x;
      for (const l of lampu) if (l.cahaya) l.cahaya.distance = 0.22 * s;
      if (bilahKipas) bilahKipas.rotateZ(kipasLaju * dt * Math.PI / 180);
      zk.kemaskini(dt); kabus.kemaskini(dt);
    },
  };
  await ctx.hidupAR(pengawal);
  model = await muatModel('Rumah');
  if (!m.hidup) return { tamat() {} };
  o = cariSemua(model);
  tempat = new Penempatan({ lebarModel: 1, lebarSkrin: 0.86, naik: 0.12, muat: { skrin: document.getElementById('s-level9'), atas: '.bar-atas, .l-tajuk, .l-subtajuk', bawah: '.hud-panel, .l-pilihan, .k-misi' } });
  model.updateMatrixWorld(true);
  sediakan();
  const saiz = tengahkan(condong, tempat.pusing);
  tempat.lebarModel = saiz.x;
  daftarUji(tempat.akar);

  function sediakan() {
    condong = new THREE.Group();
    condong.add(model);
    const ikat = (a, i) => { const ta = o.get(a), ti = o.get(i); if (ta && ti) ti.attach(ta); };
    for (const k of ID_LITAR) ikat('Togol_MCB_' + k, 'MCB_' + k);
    ikat('TogolUtama', 'SuisUtama'); ikat('Togol_RCCB', 'RCCB'); ikat('ButangTest_RCCB', 'RCCB');
    realistikkanBahan(model);
    const tk = o.get('Tingkap_Tamu');
    if (tk) tk.traverse((x) => { if (x.isMesh && x.material.name === 'Rumah_Tingkap') { x.material = x.material.clone(); x.material.emissive = new THREE.Color(1, 1, 1); x.material.emissiveMap = x.material.map; x.material.emissiveIntensity = 0.18; } });
    bahanMalam = new THREE.MeshStandardMaterial({ map: tekstur('langit_malam.png'), emissive: 0xffffff, emissiveMap: tekstur('langit_malam.png'), emissiveIntensity: 1.2 });
    bahanKacaMenyala = bahanMenyala(srgb(1, 0.97, 0.88), srgb(1, 0.86, 0.55), 2.2);

    const daftarTogol = (kunci, nama) => {
      const t = o.get(nama);
      if (t) { togol.set(kunci, t); togolPose.set(t, { on: t.position.clone(), turun: bawahDalamInduk(model, t) }); }
    };
    for (const n of ID_LITAR) daftarTogol(n, 'Togol_MCB_' + n);
    daftarTogol('utama', 'TogolUtama'); daftarTogol('rccb', 'Togol_RCCB');
    suisUtama = o.get('SuisUtama'); butangTest = o.get('ButangTest_RCCB');
    for (const t of togol.values()) tetapkanTogol(t, false, true);   // semua bermula OFF

    for (const [obj, id, nama, dulang, sasaran] of D.KOMPONEN_L9) {
      const t = o.get(obj), ts = o.get(sasaran);
      if (!t || !ts) continue;
      const hantu = binaHantu(ts, hantuBiasa);
      const d = o.get(dulang) || t;
      const b = { obj: t, id, nama, komponen: true, terpasang: false, diisi: null, hantu,
        dulang: { pos: d.position.clone(), rot: d.quaternion.clone(), skala: new THREE.Vector3(1, 1, 1) } };
      komponen.push(b);
    }
    for (const n of ID_LITAR) { const k = o.get('Kabel_' + n); if (k) { kabel.set(n, k); k.visible = false; } }
    for (const b of komponen) {
      pemilih.daftar(b.obj, b, { besar: 1.3, minimum: 0.035 });
      b.obj.position.copy(b.dulang.pos); b.obj.quaternion.copy(b.dulang.rot); b.obj.scale.copy(b.dulang.skala);
    }
    if (butangTest) pemilih.daftar(butangTest, { id: 'test' }, { besar: 1.8, minimum: 0.012 });
    if (suisUtama) pemilih.daftar(suisUtama, { id: 'utama' }, { besar: 1.15, minimum: 0.02 });

    for (const n of ['Dapur', 'Tamu', 'Bilik']) {
      const kaca = o.get('Kaca_' + n), titik = o.get('TitikCahaya_' + n);
      let cahaya = null;
      if (titik) { cahaya = new THREE.PointLight(srgb(1, 0.82, 0.5), 2.2, 0.22, 1.5); cahaya.visible = false; titik.add(cahaya); }
      if (kaca) { kaca.traverse((x) => { if (x.isMesh) x.userData.bahanAsal = x.material; }); lampu.push({ kaca, cahaya }); }
      const t = o.get('Tingkap_' + n);
      if (t) t.traverse((x) => { if (x.isMesh) tingkap.push(x); });
    }
    tv = o.get('SkrinTV');
    if (tv && tv.isMesh) { tvAsal = tv.material; tvBahan = new THREE.MeshStandardMaterial({ color: srgb(0.1, 0.15, 0.3), emissive: srgb(0.3, 0.5, 1), roughness: 0.4 }); }
    else tv = null;
    bilahKipas = o.get('BilahKipas');
    led = o.get('LEDPetiSejuk');
    if (led && led.isMesh) { ledAsal = led.material; ledBahan = bahanMenyala(srgb(0.2, 1, 0.3), srgb(0.2, 1, 0.3), 2); } else led = null;
    flap = o.get('FlapAircond'); if (flap) flapTutup = flap.quaternion.clone();
    zk = new Zarah(model);
    kabus = new Zarah(model, { tambah: false, maks: 60 });
    condong.rotation.x = SUDUT_CONDONG;
  }

  return {
    tamat() {
      m.henti();
      sentuh.lepas();
      pulihkanCahaya();
      if (tempat) tempat.buang();
      hud.buang();
      el.classList.remove('dikesan');
    },
  };
}
