// Level 6 — CARI KEROSAKAN (Level6_CariKerosakan.cs). Papan latihan 3D; tiga kes kerosakan.
// Pemain MENYENTUH objek 3D: kenal pasti komponen rosak, kemudian ikut prosedur selamat
// (matikan MCB -> baiki -> hidupkan). Menyentuh bahagian rosak sebelum bekalan diputuskan = BAHAYA.
import { THREE, Penempatan, tengahkan, muatModel } from './ar.js';
import * as D from './data.js';
import { mulakanPercubaan, tambahXP, tandaSelesai, xpLevel } from './simpan.js';
import * as K from './kesan.js';
import { HUD, WARNA, KEADAAN } from './hud.js';
import {
  Masa, pose, denyut, goncang, cariSemua, Pemilih, pasangSentuh, Zarah, kesanBetul, bungaApi,
  XRay, XR, bahanMenyala, srgb, tekstur, daftarUji,
} from './alat3d.js';

const JARAK_TOGOL = 0.011;   // meter model: togol MCB ON (atas) -> OFF (bawah)

/** Arah "bawah" model dalam ruang induk `obj` (selepas obj dilekatkan pada induk lain). */
export function bawahDalamInduk(model, obj) {
  model.updateMatrixWorld(true);
  const a = obj.parent.worldToLocal(model.localToWorld(new THREE.Vector3(0, 0, 0)));
  const b = obj.parent.worldToLocal(model.localToWorld(new THREE.Vector3(0, -1, 0)));
  return b.sub(a).normalize();
}

/** Lampirkan halo cahaya lembut (sprite aditif) pada `titik`. */
export function binaHalo(induk, pos, saiz = 0.13) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tekstur('zarah_lembut.png'), color: srgb(1, 0.85, 0.45), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(saiz); s.position.copy(pos); s.visible = false; s.userData.milikSendiri = true; s.renderOrder = 6;
  induk.add(s);
  return s;
}

/** Kerangka dikongsi Level 6-9: HUD, masa, sentuhan, penempatan; mula() dipanggil sekali bila model nampak. */
export function asasLevel(ctx, n) {
  const el = ctx.el;
  const m = new Masa();
  el.classList.remove('dikesan');
  mulakanPercubaan(n);
  return { el, m };
}

export async function level6(ctx) {
  const { el, m } = asasLevel(ctx, 6);
  const hud = new HUD(el, { cip: D.KES_L6.length, tajukKotak: 'GEJALA', warnaKotak: WARNA.salah });
  const elTajuk = el.querySelector('.l-tajuk');
  const butangXRay = el.querySelector('.butang-xray');
  const panelP = el.querySelector('.l-panel');
  elTajuk.textContent = 'CARI KEROSAKAN';
  hud.arahan('IMBAS', 'Halakan kamera ke poster untuk memaparkan papan latihan 3D.', WARNA.neon);
  panelP.hidden = true;
  kemaskiniCip(-1);

  let tempat = null, model = null, o = null, xray = null, zk = null, asap = null, percik = null, percikBahaya = null;
  let mula = false, sibuk = true;
  let indeksKes = -1, indeksLangkah = 0, salahLangkahIni = 0, kesilapanKes = 0;
  let mcbLampuOn = true, mcbSoketOn = true, wayarLonggar = false;
  let togolLampu = null, togolSoket = null, onLampu = null, onSoket = null, turunLampu = null, turunSoket = null;
  let mentolKaca = [], bahanMentolMenyala = null, halo = null, cahaya = null, kilatPercik = null;
  let denyutPetunjuk = null, sasaranDenyut = null, kelipan = 0;
  const skalaAsal = new Map(), sasaran = new Map();
  const pemilih = new Pemilih();

  function kemaskiniCip(semasa) {
    const label = ['LAMPU', 'SOKET', 'PERCIKAN'];
    D.KES_L6.forEach((_, i) => hud.cip(i, i < semasa ? KEADAAN.Siap : i === semasa ? KEADAAN.Semasa : KEADAAN.Terkunci, label[i]));
  }

  // ---------------------------------------------------------------- keadaan visual papan
  function tetapkanTogol(togol, posOn, turun, on, segera) {
    if (!togol) return Promise.resolve();
    const ke = on ? posOn.clone() : posOn.clone().addScaledVector(turun, JARAK_TOGOL);
    if (segera) { togol.position.copy(ke); return Promise.resolve(); }
    return pose(m, togol, { pos: ke }, 0.18).then(() => K.bunyiKetik());
  }

  function tetapkanMentol(menyala, kecerahan = 1) {
    if (cahaya) { cahaya.visible = menyala; cahaya.intensity = 2.4 * kecerahan; }
    for (const mesh of mentolKaca) mesh.material = menyala ? bahanMentolMenyala : mesh.userData.bahanAsal;
    if (halo) { halo.visible = menyala; halo.scale.setScalar(0.13 * kecerahan); }
  }

  function kemaskiniLampu() {
    kelipan++;
    if (mcbLampuOn && wayarLonggar) { rutinKelipan(kelipan); return; }
    tetapkanMentol(mcbLampuOn);
  }

  // Kes 3: lampu berkelip mengikut percikan api pada terminal longgar.
  async function rutinKelipan(token) {
    const titik = o.get('TitikPercikan');
    while (m.hidup && token === kelipan) {
      tetapkanMentol(true, 0.6 + Math.random() * 0.4);
      await m.tunggu(0.05 + Math.random() * 0.3);
      if (token !== kelipan) return;
      tetapkanMentol(false);
      if (Math.random() < 0.75 && titik) {
        percik.pancar(10 + Math.floor(Math.random() * 12), opsyenPercik(titik.position));
        if (kilatPercik) { kilatPercik.intensity = 3.5; m.tunggu(0.06).then(() => { if (kilatPercik) kilatPercik.intensity = 0; }); }
      }
      await m.tunggu(0.06 + Math.random() * 0.22);
      if (Math.random() < 0.3) await m.tunggu(0.4 + Math.random() * 0.5);
    }
  }

  const opsyenPercik = (pos, biru = false) => ({
    pos, laju: [0.05, 0.16], hayat: [0.15, 0.45], saiz: [0.004, 0.008], sebar: 1,
    warna: biru ? srgb(0.75, 0.9, 1) : srgb(1, 0.92, 0.55), warnaAkhir: biru ? srgb(0.3, 0.55, 1) : srgb(1, 0.45, 0.1), redam: 4, graviti: 0.15,
  });

  function tetapkanHangus(rosak) {
    const h = o.get('HangusSoket');
    if (h) h.visible = rosak;
    const t = o.get('TitikAsap');
    if (!asap) return;
    if (rosak && t) {
      asap.berterusan(14, {
        pos: t.getWorldPosition(new THREE.Vector3()).applyMatrix4(new THREE.Matrix4().copy(model.matrixWorld).invert()),
        arah: new THREE.Vector3(0, 1, 0), sebar: 0.25, laju: [0.016, 0.03], hayat: [1.8, 2.8], saiz: [0.014, 0.024], membesar: 2.6,
        warna: srgb(0.45, 0.43, 0.4), warnaAkhir: srgb(0.75, 0.75, 0.75), alfa: 0.7, pudarMasuk: 0.15,
      });
    } else { asap.berterusan(null); asap.kosongkan(); }
  }

  function tetapkanWayarLonggar(longgar) {
    wayarLonggar = longgar;
    const k = o.get('WayarKetat'), l = o.get('WayarLonggar');
    if (k) k.visible = !longgar;
    if (l) l.visible = longgar;
  }

  // ---------------------------------------------------------------- X-RAY
  function kemaskiniXRay() {
    const Km = XR.Mati;
    const arusLampu = !mcbLampuOn ? XR.Mati : wayarLonggar ? XR.Berkelip : XR.Mengalir;
    const hangus = o.get('HangusSoket') && o.get('HangusSoket').visible;
    const soketL = !mcbSoketOn ? Km : hangus ? XR.Panas : XR.Bertenaga;
    xray.tetapkan('Wayar_BekalanL', arusLampu !== Km || (hangus && mcbSoketOn) ? XR.Mengalir : XR.Bertenaga);
    xray.tetapkan('Wayar_LampuL', arusLampu);
    xray.tetapkan('WayarKetat', wayarLonggar ? Km : arusLampu);
    xray.tetapkan('WayarLonggar', wayarLonggar ? arusLampu : Km);
    xray.tetapkan('Wayar_LampuN', arusLampu);
    xray.tetapkan('Wayar_SoketL', soketL);
    xray.tetapkan('Wayar_SoketN', hangus && mcbSoketOn ? XR.Panas : Km);
    xray.tetapkan('Wayar_SoketE', Km);
  }

  butangXRay.onclick = () => {
    if (!xray) { hud.toast('Imbas poster dahulu untuk memaparkan papan.', WARNA.neon); return; }
    const on = !xray.aktif;
    xray.tetapkanAktif(on);
    if (on) kemaskiniXRay();
    butangXRay.textContent = on ? 'X-RAY: ON' : 'X-RAY';
    butangXRay.classList.toggle('hidup', on);
    K.kilat('#4d99ff', on ? 350 : 150);
    if (on) hud.toast('X-RAY: OREN = Hidup (L), BIRU = Neutral (N), HIJAU = Bumi (E). Titik bergerak = ARUS mengalir.', WARNA.neon, 5);
  };

  // ---------------------------------------------------------------- aliran kes
  async function mulaKes(i) {
    indeksKes = i; indeksLangkah = 0; kesilapanKes = 0; salahLangkahIni = 0;
    const kes = D.KES_L6[i];
    kelipan++;
    tetapkanHangus(false);
    tetapkanWayarLonggar(false);
    mcbLampuOn = mcbSoketOn = true;
    tetapkanTogol(togolLampu, onLampu, turunLampu, true, true);
    tetapkanTogol(togolSoket, onSoket, turunSoket, true, true);
    if (i === 0) { mcbLampuOn = false; tetapkanTogol(togolLampu, onLampu, turunLampu, false, true); }
    else if (i === 1) tetapkanHangus(true);
    else tetapkanWayarLonggar(true);
    kemaskiniLampu();
    elTajuk.textContent = kes.tajuk; K.pop(elTajuk);
    kemaskiniCip(i);
    hud.fakta(kes.gejala);
    hud.toast(`KES ${i + 1}: kerosakan baharu dilaporkan!`, WARNA.emas);
    paparLangkah();
    sibuk = false;
  }

  function paparLangkah() {
    const kes = D.KES_L6[indeksKes], l = kes.langkah[indeksLangkah];
    hud.arahan(`${indeksLangkah + 1}/${kes.langkah.length}`, l.arahan, l.aksi === 'MatikanMCB' ? WARNA.salah : WARNA.emas);
  }

  function ketik(x, y) {
    if (sibuk || !model || indeksKes < 0) return;
    const h = pemilih.kena(x, y, { jejari: 0.018 });
    if (!h) return;   // ketik pada papan kosong — abaikan, bukan kesilapan
    nilaiKetikan(h.data, h.titik);
  }

  function nilaiKetikan(s, titikDunia) {
    const kes = D.KES_L6[indeksKes], langkah = kes.langkah[indeksLangkah];
    if (s.obj !== sasaranDenyut) denyut(m, s.obj, 0.22, 1.1, skalaAsal.get(s.obj));
    if (s.id === langkah.sasaran) { langkahBetul(s, langkah); return; }

    salahLangkahIni++; kesilapanKes++;
    const bekalanMasihHidup = langkah.aksi === 'MatikanMCB' && s.id === kes.langkah[0].sasaran;
    if (bekalanMasihHidup) {
      hud.toast('BAHAYA! Bekalan masih HIDUP. Matikan MCB dahulu!', WARNA.salah, 3.5);
      K.kilat('#66a6ff', 500);
      percikBahaya.pancar(40, opsyenPercik(model.worldToLocal(titikDunia.clone()), true));
      if (navigator.vibrate) navigator.vibrate(200);
    } else {
      hud.toast(langkah.aksi === 'KenalPasti' ? `Itu ${s.nama} — bukan punca kerosakan ini.` : `Bukan ${s.nama}. ${langkah.arahan}`, WARNA.salah, 2.8);
      K.kilat(WARNA.salah);
    }
    K.bunyiSalah();
    goncang(m, s.obj);
    if (salahLangkahIni >= 2 && !denyutPetunjuk && sasaran.has(langkah.sasaran)) {
      if (langkah.aksi === 'KenalPasti') hud.arahan('?', langkah.arahan + ' ' + kes.petunjuk, WARNA.neon);
      const t = sasaran.get(langkah.sasaran);
      sasaranDenyut = t;
      const asal = skalaAsal.get(t);
      denyutPetunjuk = m.setiap((dt, masa) => { t.scale.copy(asal).multiplyScalar(1 + 0.12 * (0.5 + 0.5 * Math.sin(masa * 7))); });
    }
  }

  function hentiDenyutPetunjuk() {
    if (denyutPetunjuk) denyutPetunjuk.henti();
    if (sasaranDenyut) sasaranDenyut.scale.copy(skalaAsal.get(sasaranDenyut));
    denyutPetunjuk = null; sasaranDenyut = null;
  }

  async function langkahBetul(s, langkah) {
    sibuk = true;
    hentiDenyutPetunjuk();
    salahLangkahIni = 0;
    K.bunyiBetul(); K.kilat(WARNA.betul, 220);
    const pusatS = model.worldToLocal(s.obj.getWorldPosition(new THREE.Vector3()));
    switch (langkah.aksi) {
      case 'KenalPasti': kesanBetul(zk, pusatS); break;
      case 'MatikanMCB':
      case 'HidupkanMCB': {
        const hidup = langkah.aksi === 'HidupkanMCB';
        if (s.id === 'mcbLampu') { mcbLampuOn = hidup; await tetapkanTogol(togolLampu, onLampu, turunLampu, hidup); }
        else { mcbSoketOn = hidup; await tetapkanTogol(togolSoket, onSoket, turunSoket, hidup); }
        if (!hidup && s.id === 'mcbSoket' && asap) asap.berterusan(null);   // tiada bekalan = tiada asap baharu
        kemaskiniLampu();
        break;
      }
      case 'GantiSoket': {
        const asal = skalaAsal.get(s.obj);
        await pose(m, s.obj, { skala: asal.clone().multiplyScalar(0.05) }, 0.25);
        tetapkanHangus(false);
        await m.tunggu(0.1);
        await pose(m, s.obj, { skala: asal }, 0.3);
        kesanBetul(zk, pusatS);
        break;
      }
      case 'KetatkanWayar': {
        tetapkanWayarLonggar(false);
        const k = o.get('WayarKetat');
        if (k) { const a = k.scale.clone(); k.scale.multiplyScalar(0.85); await pose(m, k, { skala: a }, 0.25); kesanBetul(zk, model.worldToLocal(k.getWorldPosition(new THREE.Vector3()))); }
        kemaskiniLampu();
        break;
      }
      default: break;
    }
    if (!m.hidup) return;
    hud.toast(langkah.berjaya, WARNA.betul, 2.2);
    await m.tunggu(0.6);
    const kes = D.KES_L6[indeksKes];
    indeksLangkah++;
    if (indeksLangkah < kes.langkah.length) { paparLangkah(); sibuk = false; }
    else await kesSelesai(kes);
  }

  async function kesSelesai(kes) {
    const xp = Math.max(kes.xp / 2, kes.xp - 5 * kesilapanKes);
    tambahXP(xp, 6);
    kemaskiniCip(indeksKes + 1);
    hud.garis((indeksKes + 1) / D.KES_L6.length);
    const tc = o.get('TitikCahaya');
    if (tc) bungaApi(zk, tc.position.clone());
    await m.tunggu(0.9);
    if (!m.hidup) return;
    const akhir = indeksKes + 1 >= D.KES_L6.length;
    panelP.querySelector('h2').textContent = `KES ${indeksKes + 1} SELESAI!`;
    panelP.querySelector('p').textContent = kes.penjelasan;
    panelP.querySelector('.xp-baris').textContent = kesilapanKes === 0 ? `+${xp} XP  (tiada kesilapan!)` : `+${xp} XP  (${kesilapanKes} kesilapan)`;
    const b = panelP.querySelector('button');
    b.textContent = akhir ? 'SELESAI ➡' : 'KES SETERUSNYA ➡';
    panelP.hidden = false;
    K.pop(panelP.firstElementChild);
  }

  panelP.querySelector('button').onclick = async () => {
    K.bunyiKetik();
    panelP.hidden = true;
    const seterusnya = indeksKes + 1;
    if (seterusnya < D.KES_L6.length) { sibuk = true; await m.tunggu(0.3); if (m.hidup) mulaKes(seterusnya); }
    else rutinTamat();
  };

  async function rutinTamat() {
    sibuk = true;
    tandaSelesai(6);
    elTajuk.textContent = 'SEMUA KEROSAKAN DIBAIKI!';
    hud.fakta('Papan latihan beroperasi dengan selamat. Semua litar dilindungi dan disambung dengan betul.');
    hud.arahan('SIAP', 'Tahniah — tiga kerosakan berjaya dibaiki!', WARNA.betul);
    for (let i = 0; i < 3; i++) {
      if (cahaya) cahaya.intensity = 4.5;
      await m.tunggu(0.15);
      if (cahaya) cahaya.intensity = 2.4;
      await m.tunggu(0.15);
    }
    if (!m.hidup) return;
    const tc = o.get('TitikCahaya');
    bungaApi(zk, tc ? tc.position.clone() : new THREE.Vector3());
    K.kilat(WARNA.emas, 500); K.bunyiMenang();
    hud.toast('TAHNIAH! ANDA JURUTEKNIK HEBAT!', WARNA.emas, 4);
    await m.tunggu(1);
    K.konfeti();
    K.popup(`+${xpLevel(6)} XP`, WARNA.emas);
    await m.tunggu(0.6);
    ctx.panelTamat({ tajuk: '★ SEMUA KEROSAKAN DIBAIKI! ★', subtajuk: 'LEVEL 6 SELESAI', bintang: 3, xp: `+${xpLevel(6)} XP`,
      butang: [{ teks: 'TERUSKAN: LEVEL 7 ➡', ke: 'level7', utama: true }, { teks: 'MENU UTAMA', ke: 'menu' }] });
  }

  // ---------------------------------------------------------------- AR
  const sentuh = pasangSentuh({ naik: (x, y, ketikan) => { if (ketikan) ketik(x, y); } });
  const pengawal = {
    kemaskini(dt) {
      m.kemaskini(dt);
      if (!tempat) return;
      tempat.kemaskini(dt);
      el.classList.toggle('dikesan', tempat.nampak);
      // Ayunan KECIL sahaja — pemain perlu menyasarkan komponen, jadi papan tidak boleh lari.
      tempat.pusing.rotation.set(0.05, Math.sin(m.masa * 0.35 * Math.PI * 2) * (6 * Math.PI / 180), 0);
      if (tempat.nampak && !mula) { mula = true; m.tunggu(0.8).then(() => { if (m.hidup) mulaKes(0); }); }
      const s = tempat.akar.scale.x;
      if (cahaya) cahaya.distance = 0.45 * s;
      if (kilatPercik) kilatPercik.distance = 0.25 * s;
      if (xray && xray.aktif) { kemaskiniXRay(); xray.kemaskini(m.masa); }
      zk.kemaskini(dt); asap.kemaskini(dt); percik.kemaskini(dt); percikBahaya.kemaskini(dt);
    },
  };
  await ctx.hidupAR(pengawal);
  model = await muatModel('PapanKerosakan');
  if (!m.hidup) return { tamat() {} };
  o = cariSemua(model);
  tempat = new Penempatan({ lebarModel: 1, lebarSkrin: 0.8, naik: 0.14 });
  const saiz = tengahkan(model, tempat.pusing);
  tempat.lebarModel = saiz.x;
  sediakanPapan();
  daftarUji(tempat.akar);

  function sediakanPapan() {
    model.updateMatrixWorld(true);
    const ikat = (anak, induk) => { const a = o.get(anak), i = o.get(induk); if (a && i) i.attach(a); };
    ikat('Togol_MCBLampu', 'MCB_Lampu'); ikat('Togol_MCBSoket', 'MCB_Soket');
    ikat('HangusSoket', 'Soket'); ikat('TitikAsap', 'Soket');
    for (const [nama, id, paparan] of D.SASARAN_PAPAN6) {
      const t = o.get(nama);
      if (!t) continue;
      const s = { id, nama: paparan, obj: t };
      pemilih.daftar(t, s, { besar: 1.15, minimum: 0.02 });
      if (!sasaran.has(id) || nama === 'Suis') sasaran.set(id, t);
      skalaAsal.set(t, t.scale.clone());
    }
    togolLampu = o.get('Togol_MCBLampu'); togolSoket = o.get('Togol_MCBSoket');
    if (togolLampu) { onLampu = togolLampu.position.clone(); turunLampu = bawahDalamInduk(model, togolLampu); }
    if (togolSoket) { onSoket = togolSoket.position.clone(); turunSoket = bawahDalamInduk(model, togolSoket); }
    const hangus = o.get('HangusSoket');
    if (hangus) hangus.traverse((x) => { if (x.isMesh) { x.material = x.material.clone(); x.material.transparent = true; x.material.depthWrite = false; } });

    bahanMentolMenyala = bahanMenyala(srgb(1, 0.97, 0.88), srgb(1, 0.86, 0.55), 2.2);
    const mentol = o.get('Mentol');
    if (mentol) mentol.traverse((x) => { if (x.isMesh && x.material.name.startsWith('Mentol_Kaca')) { x.userData.bahanAsal = x.material; mentolKaca.push(x); } });
    const tc = o.get('TitikCahaya');
    if (tc) {
      cahaya = new THREE.PointLight(srgb(1, 0.88, 0.6), 2.4, 0.45, 1.5);
      cahaya.visible = false; tc.add(cahaya);
      halo = binaHalo(model, tc.position.clone());
    }
    const tp = o.get('TitikPercikan');
    if (tp) { kilatPercik = new THREE.PointLight(srgb(1, 0.8, 0.45), 0, 0.25, 1.5); tp.add(kilatPercik); }
    zk = new Zarah(model, { maks: 120 });
    asap = new Zarah(model, { tambah: false, maks: 80 });
    percik = new Zarah(model, { maks: 120 });
    percikBahaya = new Zarah(model, { maks: 80 });

    tetapkanWayarLonggar(false);
    tetapkanHangus(false);
    tetapkanTogol(togolLampu, onLampu, turunLampu, true, true);
    tetapkanTogol(togolSoket, onSoket, turunSoket, true, true);
    kemaskiniLampu();
    xray = new XRay(model, ['Wayar_BekalanL', 'Wayar_LampuN', 'Wayar_SoketN', 'Wayar_SoketE']);
  }

  return {
    tamat() {
      m.henti(); kelipan++;
      sentuh.lepas();
      if (tempat) tempat.buang();
      hud.buang();
      panelP.hidden = true;
      butangXRay.textContent = 'X-RAY'; butangXRay.classList.remove('hidup');
      el.classList.remove('dikesan');
    },
  };
}

