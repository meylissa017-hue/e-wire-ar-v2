// Level 7 — PASANG KIPAS SILING (Level7_PasangKipas.cs). Sudut bilik 3D; bahagian kipas tergantung
// di hadapan papan alat. Pemain MENYERET setiap bahagian ke hologram di kedudukan pasangnya:
// rod & kanopi -> motor -> 3 bilah -> penutup, dan pengatur ke kotak dinding. Urutan dikuatkuasakan.
// Selepas lengkap, ketik pengatur untuk kelajuan 1..5 dan kipas BERPUTAR. +100 XP (-5 setiap kesilapan).
import { THREE, Penempatan, tengahkan, muatModel, kamera } from './ar.js';
import * as D from './data.js';
import { tambahXP, tandaSelesai } from './simpan.js';
import * as K from './kesan.js';
import { HUD, WARNA, KEADAAN } from './hud.js';
import { asasLevel } from './level6.js';
import {
  pose, cariSemua, Pemilih, pasangSentuh, Zarah, kesanBetul, bungaApi, binaHantu, bahanHantu, bahanMenyala,
  srgb, sinar, keSkrin, kotakTempatan, daftarUji,
} from './alat3d.js';

const KELAJUAN = [0, 140, 300, 480, 680, 900];   // darjah sesaat bagi setiap tahap pengatur
const SKALA_DULANG = 0.8;
const CONDONG = -13 * Math.PI / 180;            // condong ke belakang: kipas dilihat dari bawah sedikit

/** Titik dunia pada satah yang selari dengan skrin melalui `titik`, di bawah piksel (x, y). */
export function titikSatahSkrin(x, y, titik) {
  const n = kamera().getWorldDirection(new THREE.Vector3()).negate();
  const satah = new THREE.Plane().setFromNormalAndCoplanarPoint(n, titik);
  const h = new THREE.Vector3();
  return sinar(x, y).intersectPlane(satah, h) ? h : null;
}

/** Pusat dunia kotak sempadan sesuatu objek. */
export function pusatDunia(obj) {
  const k = kotakTempatan(obj);
  return obj.localToWorld(k.isEmpty() ? new THREE.Vector3() : k.getCenter(new THREE.Vector3()));
}

export async function level7(ctx) {
  const { el, m } = asasLevel(ctx, 7);
  const hud = new HUD(el, { cip: 5, meter: true });
  const elTajuk = el.querySelector('.l-tajuk');
  elTajuk.textContent = 'PASANG KIPAS SILING';
  hud.arahan('IMBAS', 'Halakan kamera ke poster untuk memaparkan bilik 3D.', WARNA.neon);

  let tempat = null, model = null, o = null, condong = null, pemutar = null, kabur = null, zk = null;
  let tombol = null, tombolAsal = null, kaca = null, bahanKacaAsal = null, bahanMenyalaKipas = null, cahaya = null;
  const bahagian = [];        // { obj, id, nama, terpasang, dulang:{pos,rot,skala}, hantu }
  const pemilih = new Pemilih();
  const hantuBiasa = bahanHantu(false), hantuAktif = bahanHantu(true);
  let diseret = null, offset = new THREE.Vector3(), slotHover = null, posMula = null;
  let kesilapan = 0, lengkap = false, selesai = false, sibuk = true, mula = false;
  let tahap = 0, darjahSemasa = 0, masaPenuh = 0, angin = null, denyutTombol = null;

  const terpasang = (id) => (id === 'bilah' ? bahagian.filter((b) => b.id === 'bilah' && b.terpasang).length >= 3 : bahagian.some((b) => b.id === id && b.terpasang));

  function kemaskiniCip(semasa) {
    D.BAHAGIAN_L7.forEach((d, i) => {
      const label = { rod: 'ROD', motor: 'MOTOR', penutup: 'PENUTUP', pengatur: 'PENGATUR', bilah: `BILAH ${bahagian.filter((b) => b.id === 'bilah' && b.terpasang).length}/3` }[d.id];
      hud.cip(i, terpasang(d.id) ? KEADAAN.Siap : d.id === semasa ? KEADAAN.Semasa : KEADAAN.Terkunci, label);
    });
  }
  kemaskiniCip('rod');

  function paparArahanSeterusnya() {
    for (const d of D.BAHAGIAN_L7) {
      if (terpasang(d.id) || d.prasyarat.some((p) => !terpasang(p))) continue;
      hud.arahan('SERET', d.arahan, WARNA.emas);
      kemaskiniCip(d.id);
      return;
    }
  }

  // ---------- hantu
  function tunjukHantu(b, tunjuk, aktif = false) {
    b.hantu.visible = tunjuk;
    b.hantu.traverse((x) => { if (x.isMesh) x.material = aktif ? hantuAktif : hantuBiasa; });
  }
  const slotTerdekat = (x, y, id) => {
    let terbaik = null, had = el.clientHeight * 0.075;
    for (const b of bahagian) {
      if (b.diisi || (id && b.id !== id)) continue;
      const s = keSkrin(pusatDunia(b.hantu));
      if (s.z > 1) continue;
      const j = Math.hypot(s.x - x, s.y - y);
      if (j < had) { had = j; terbaik = b; }
    }
    return terbaik;
  };

  function silap(b, mesej) {
    kesilapan++;
    hud.toast(mesej + '  (-5 XP)', WARNA.salah, 3);
    K.kilat(WARNA.salah); K.bunyiSalah();
  }

  // ---------- sentuhan
  function mulaSentuh(x, y) {
    posMula = { x, y };
    if (!model || sibuk || (selesai && !lengkap)) return;
    const h = pemilih.kena(x, y, { jejari: 0.02, tapis: (b) => !b.terpasang });
    if (!h) return;
    const b = h.data;
    const tengah = b.obj.getWorldPosition(new THREE.Vector3());
    const p = titikSatahSkrin(x, y, tengah);
    offset = p ? tengah.clone().sub(p) : new THREE.Vector3();
    diseret = b;
    pose(m, b.obj, { skala: new THREE.Vector3(1, 1, 1) }, 0.15);
    for (const s of bahagian) if (!s.diisi) tunjukHantu(s, s.id === b.id);
    hud.toast('Seret ' + b.nama + ' ke hologram biru', WARNA.neon, 1.6);
  }

  function seret(x, y) {
    if (!diseret) return;
    const p = titikSatahSkrin(x, y, condong.getWorldPosition(new THREE.Vector3()));
    if (p) diseret.obj.position.copy(diseret.obj.parent.worldToLocal(p.add(offset)));
    const baru = slotTerdekat(x, y, diseret.id);
    if (baru !== slotHover) {
      if (slotHover) tunjukHantu(slotHover, true);
      slotHover = baru;
      if (slotHover) { tunjukHantu(slotHover, true, true); K.bunyiKetik(); }
    }
  }

  function tamatSentuh(x, y, ketik) {
    if (!diseret) {
      if (lengkap && ketik) {
        const h = pemilih.kena(x, y, { jejari: 0.02 });
        if (h && h.data.id === 'pengatur') tukarKelajuan();
        else hud.toast('Ketik PENGATUR pada dinding', WARNA.neon);
      }
      return;
    }
    const b = diseret; diseret = null;
    const sasaran = slotHover; slotHover = null;
    for (const s of bahagian) if (!s.diisi) tunjukHantu(s, false);
    if (!sasaran) {
      const salah = slotTerdekat(x, y, null);
      if (salah && salah.id !== b.id) silap(b, `${b.nama} tidak dipasang di situ.`);
      kembali(b);
      return;
    }
    const data = D.BAHAGIAN_L7.find((d) => d.id === b.id);
    if (data.prasyarat.some((p) => !terpasang(p))) { silap(b, 'Belum boleh! ' + data.mesejPrasyarat); kembali(b); return; }
    pasang(b, sasaran, data);
  }

  const kembali = (b) => pose(m, b.obj, { pos: b.dulang.pos, rot: b.dulang.rot, skala: b.dulang.skala }, 0.3);

  async function pasang(b, s, data) {
    sibuk = true;
    s.diisi = b; b.terpasang = true;
    tunjukHantu(s, false);
    await pose(m, b.obj, { pos: s.hantu.position, rot: s.hantu.quaternion, skala: new THREE.Vector3(1, 1, 1) }, 0.25);
    if (!m.hidup) return;
    K.bunyiBetul(); K.kilat(WARNA.betul, 200);
    kesanBetul(zk, model.worldToLocal(b.obj.getWorldPosition(new THREE.Vector3())));
    const siap = bahagian.filter((x) => x.terpasang).length;
    hud.toast('TERPASANG: ' + b.nama + '!', WARNA.betul);
    hud.fakta(data.fakta);
    hud.garis(siap / bahagian.length);
    if (siap >= bahagian.length) {
      lengkap = true;
      kemaskiniCip(null);
      hud.arahan('KETIK', 'Kipas siap! Ketik PENGATUR pada dinding untuk menghidupkannya.', WARNA.emas);
      hud.paparMeter();
      if (tombol) {
        const plat = tombol.parent, asal = plat.scale.clone();
        denyutTombol = m.setiap((dt, t) => { plat.scale.copy(asal).multiplyScalar(1 + 0.1 * (0.5 + 0.5 * Math.sin(t * 7))); if (tahap > 0) { plat.scale.copy(asal); return false; } });
      }
    } else paparArahanSeterusnya();
    sibuk = false;
  }

  // ---------- kipas berputar
  function masukkanKePemutar() {
    for (const b of bahagian) if (b.id === 'motor' || b.id === 'bilah' || b.id === 'penutup') pemutar.attach(b.obj);
    if (kabur) kabur.visible = true;
  }

  function tukarKelajuan() {
    if (tahap === 0) masukkanKePemutar();
    tahap = (tahap + 1) % KELAJUAN.length;
    if (tombol) tombol.quaternion.copy(tombolAsal).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (-60 * tahap) * Math.PI / 180));
    hud.kelajuan(tahap);
    K.bunyiKetik();
    const hidup = tahap > 0;
    if (cahaya) cahaya.visible = hidup;
    if (kaca) kaca.traverse((x) => { if (x.isMesh) x.material = hidup ? bahanMenyalaKipas : x.userData.bahanAsal; });
    if (tahap === 0) hud.toast('Kipas dimatikan', WARNA.neon);
    else hud.toast(tahap < 5 ? 'Ketik lagi untuk lebih laju!' : 'KELAJUAN MAKSIMUM!', tahap < 5 ? WARNA.neon : WARNA.emas);
    if (!angin) angin = K.bunyiAngin();
  }

  function kemaskiniPutaran(dt) {
    if (!pemutar) return;
    const sasaran = KELAJUAN[tahap];
    // Pecutan beransur — kipas sebenar mengambil masa untuk mencapai kelajuan.
    darjahSemasa += Math.sign(sasaran - darjahSemasa) * Math.min(Math.abs(sasaran - darjahSemasa), 260 * dt);
    pemutar.rotateY(darjahSemasa * dt * Math.PI / 180);
    const k = darjahSemasa / KELAJUAN[KELAJUAN.length - 1];
    if (kabur) kabur.material.opacity = Math.max(0, Math.min(1, (k - 0.25) / 0.75)) * 0.38;
    if (angin) angin.tetap(k * 0.35, 0.6 + k * 0.7);
    if (lengkap && !selesai && tahap === KELAJUAN.length - 1 && darjahSemasa >= sasaran - 1) {
      masaPenuh += dt;
      if (masaPenuh > 1.2) rutinTamat();
    }
  }

  async function rutinTamat() {
    selesai = true;
    const xp = Math.max(D.XP.L7 / 2, D.XP.L7 - 5 * kesilapan);
    tambahXP(xp, 7); tandaSelesai(7);
    bungaApi(zk, kaca ? model.worldToLocal(kaca.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3());
    K.kilat(WARNA.emas, 500); K.bunyiMenang();
    hud.toast('TAHNIAH! KIPAS SILING BERFUNGSI!', WARNA.emas, 4);
    hud.arahan('SIAP', kesilapan === 0 ? 'Sempurna — tiada kesilapan!' : `Siap dengan ${kesilapan} kesilapan.`, WARNA.betul);
    await m.tunggu(0.8);
    K.konfeti(); K.popup(`+${xp} XP`, WARNA.emas);
    // Biar pemain menikmati kipas berputar sebelum panel tamat menutup pandangan.
    await m.tunggu(3.5);
    if (!m.hidup) return;
    ctx.panelTamat({ tajuk: '★ KIPAS SILING BERFUNGSI! ★', subtajuk: 'LEVEL 7 SELESAI', bintang: kesilapan === 0 ? 3 : kesilapan <= 3 ? 2 : 1, xp: `+${xp} XP`,
      butang: [{ teks: 'TERUSKAN: LEVEL 8 ➡', ke: 'level8', utama: true }, { teks: 'MENU UTAMA', ke: 'menu' }] });
  }

  // ---------- AR
  const sentuh = pasangSentuh({ turun: mulaSentuh, gerak: seret, naik: tamatSentuh, batal: () => { if (diseret) { const b = diseret; diseret = null; slotHover = null; for (const s of bahagian) if (!s.diisi) tunjukHantu(s, false); kembali(b); } } });
  const pengawal = {
    kemaskini(dt) {
      m.kemaskini(dt);
      if (!tempat) return;
      tempat.kemaskini(dt);
      el.classList.toggle('dikesan', tempat.nampak);
      if (tempat.nampak && !mula) {
        mula = true; sibuk = false;
        paparArahanSeterusnya();
        hud.fakta('Kipas siling seberat 5 hingga 8 kg mesti digantung pada cangkuk keluli yang dipasang kukuh pada struktur siling, bukan pada papan siling.');
      }
      kemaskiniPutaran(dt);
      if (cahaya) cahaya.distance = 0.5 * tempat.akar.scale.x;
      zk.kemaskini(dt);
    },
  };
  await ctx.hidupAR(pengawal);
  model = await muatModel('KipasSiling');
  if (!m.hidup) return { tamat() {} };
  o = cariSemua(model);
  tempat = new Penempatan({ lebarModel: 1, lebarSkrin: 0.84, naik: 0.12 });
  model.updateMatrixWorld(true);
  sediakan();
  const saiz = tengahkan(condong, tempat.pusing);
  tempat.lebarModel = saiz.x;
  daftarUji(tempat.akar);

  function sediakan() {
    // Condong: semua kandungan dimasukkan ke bawah satu kumpulan yang dicondongkan.
    condong = new THREE.Group();
    condong.add(model);
    const ikat = (a, i) => { const ta = o.get(a), ti = o.get(i); if (ta && ti) ti.attach(ta); };
    ikat('TombolPengatur', 'Pengatur');
    ikat('KacaLampu', 'Penutup');
    tombol = o.get('TombolPengatur'); if (tombol) tombolAsal = tombol.quaternion.clone();
    kaca = o.get('KacaLampu');
    bahanMenyalaKipas = bahanMenyala(srgb(1, 0.97, 0.88), srgb(1, 0.88, 0.6), 2.2);
    if (kaca) {
      kaca.traverse((x) => { if (x.isMesh) x.userData.bahanAsal = x.material; });
      cahaya = new THREE.PointLight(srgb(1, 0.9, 0.7), 1.8, 0.5, 1.5); cahaya.visible = false; kaca.add(cahaya);
    }
    for (const [nama, id, paparan] of D.OBJEK_KIPAS7) {
      const t = o.get(nama);
      if (!t) continue;
      const hantu = binaHantu(t, hantuBiasa);
      const d = o.get('Dulang_' + nama);
      const b = {
        obj: t, id, nama: paparan, terpasang: false, diisi: null, hantu,
        dulang: { pos: (d || t).position.clone(), rot: (d || t).quaternion.clone(), skala: new THREE.Vector3(SKALA_DULANG, SKALA_DULANG, SKALA_DULANG) },
      };
      pemilih.daftar(t, b, { besar: 1.1, minimum: 0.025 });
      bahagian.push(b);
      t.position.copy(b.dulang.pos); t.quaternion.copy(b.dulang.rot); t.scale.copy(b.dulang.skala);
    }
    // Pemutar: pangsi pada paksi kipas; motor, bilah dan penutup dijadikan anaknya bila berputar.
    pemutar = new THREE.Group();
    model.add(pemutar);
    const paksi = o.get('PaksiKipas');
    if (paksi) pemutar.position.copy(paksi.position);
    kabur = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.315, 0.0012, 48),
      new THREE.MeshBasicMaterial({ color: srgb(0.3, 0.18, 0.09), transparent: true, opacity: 0, depthWrite: false }));
    kabur.position.y = -0.004; kabur.visible = false; kabur.userData.milikSendiri = true; kabur.userData.bukanSempadan = true;
    pemutar.add(kabur);
    zk = new Zarah(model);
    condong.rotation.x = CONDONG;
  }

  return {
    tamat() {
      m.henti();
      sentuh.lepas();
      if (angin) angin.henti();
      if (tempat) tempat.buang();
      hud.buang();
      el.classList.remove('dikesan');
    },
  };
}
