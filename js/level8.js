// Level 8 — UJI DENGAN MULTIMETER (Level8_UjiMultimeter.cs). Papan latihan Level 6 + multimeter 3D.
// Empat ujian: keterusan bumi, rintangan penebat, voltan bekalan, kekutuban. Bagi setiap ujian:
//   1. ketik MCB SOKET untuk mematikan/menghidupkan bekalan mengikut keperluan
//   2. ketik DIAL multimeter sehingga mod yang betul (V~ / Ω / MΩ)
//   3. SERET (atau ketik & ketik) kuar merah dan hitam ke titik ujian yang betul
// Bacaan "bergolek" pada LCD 3D. +100 XP (-5 setiap kesilapan).
import { THREE, Penempatan, tengahkan, muatModel, kamera } from './ar.js';
import * as D from './data.js';
import { tambahXP, tandaSelesai, xpLevel } from './simpan.js';
import * as K from './kesan.js';
import { HUD, WARNA, KEADAAN } from './hud.js';
import { asasLevel, bawahDalamInduk } from './level6.js';
import { pose, cariSemua, Pemilih, pasangSentuh, Zarah, kesanBetul, bungaApi, XRay, XR, srgb, sinar, keSkrin, daftarUji } from './alat3d.js';

const JARAK_TOGOL = 0.011;
const MOD = { OFF: 0, V: 1, Ohm: 2, MOhm: 3 };
const LABEL_MOD = ['Label_OFF', 'Label_VAC', 'Label_Ohm', 'Label_MOhm'];
const namaMod = (m) => ['OFF', 'V~ (voltan AC)', 'Ω (keterusan)', 'MΩ (penebat)'][m];
const simbolMod = (m) => ['', '0.0 V', 'OL Ω', '--- MΩ'][m];
const L = { Bekalan: 0, Dial: 1, KuarMerah: 2, KuarHitam: 3, Siap: 4 };

export async function level8(ctx) {
  const { el, m } = asasLevel(ctx, 8);
  const hud = new HUD(el, { cip: D.UJIAN_L8.length });
  const elTajuk = el.querySelector('.l-tajuk');
  const butangXRay = el.querySelector('.butang-xray');
  elTajuk.textContent = 'UJI DENGAN MULTIMETER';
  hud.arahan('IMBAS', 'Halakan kamera ke poster untuk memaparkan papan & multimeter 3D.', WARNA.neon);

  let tempat = null, model = null, o = null, xray = null, zk = null;
  let dial = null, dialAsal = null, paksiDial = new THREE.Vector3(0, 0, 1), sudutDial = [0, 0, 0, 0], togol = null, togolOn = null, turun = null;
  let kuarM = null, kuarH = null, rehatM = null, rehatH = null, jekM = null, jekH = null, poseM = null, poseH = null;
  let kabelM = null, kabelH = null, lcd = null;
  const titik = new Map(), penanda = new Map();
  const pemilih = new Pemilih();
  const bahanPenanda = new THREE.MeshBasicMaterial({ color: srgb(0, 0.83, 1), transparent: true, opacity: 0.6, depthWrite: false });
  const bahanPenandaAktif = new THREE.MeshBasicMaterial({ color: srgb(0.3, 1, 0.6), transparent: true, opacity: 0.9, depthWrite: false });

  let mod = MOD.OFF, mcbOn = true, posM = null, posH = null, indeks = -1, kesilapan = 0, kesilapanUjian = 0;
  let sibuk = true, selesai = false, mula = false;
  let calon = null, diseret = null, dipilih = null, denyutPilih = null, titikHover = null, posMula = null;

  const ujian = () => (indeks >= 0 && indeks < D.UJIAN_L8.length ? D.UJIAN_L8[indeks] : null);
  const langkahSemasa = () => {
    const u = ujian(); if (!u) return L.Siap;
    if (mcbOn !== u.bekalanHidup) return L.Bekalan;
    if (mod !== u.mod) return L.Dial;
    if (posM !== u.titikMerah) return L.KuarMerah;
    if (posH !== u.titikHitam) return L.KuarHitam;
    return L.Siap;
  };

  function kemaskiniCip() {
    D.UJIAN_L8.forEach((u, i) => hud.cip(i, i < indeks ? KEADAAN.Siap : i === indeks ? KEADAAN.Semasa : KEADAAN.Terkunci, u.label));
  }
  kemaskiniCip();

  function paparLangkah() {
    const u = ujian(); if (!u) return;
    const pesan = ' (seret, atau ketik kuar kemudian ketik titik)';
    switch (langkahSemasa()) {
      case L.Bekalan:
        hud.arahan('MCB', u.bekalanHidup ? 'Hidupkan bekalan: ketik MCB SOKET pada papan.' : 'KESELAMATAN: matikan bekalan dahulu — ketik MCB SOKET.', u.bekalanHidup ? WARNA.emas : WARNA.salah);
        break;
      case L.Dial: hud.arahan('DIAL', `Ketik DIAL multimeter sehingga mod ${namaMod(u.mod)}.`, WARNA.neon); break;
      case L.KuarMerah: hud.arahan('KUAR', u.arahanMerah + pesan, WARNA.merahKuar); break;
      case L.KuarHitam: hud.arahan('KUAR', u.arahanHitam + pesan, WARNA.kelabuKuar); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- LCD (teks pada kanvas)
  function binaLCD() {
    const t = o.get('TitikLCD');
    if (!t) return null;
    const kanvas = document.createElement('canvas'); kanvas.width = 256; kanvas.height = 96;
    const tex = new THREE.CanvasTexture(kanvas); tex.colorSpace = THREE.SRGBColorSpace;
    const satah = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.0225), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    satah.position.copy(t.position).add(new THREE.Vector3(0, 0, 0.0008));
    satah.userData.milikSendiri = true; satah.userData.bukanSempadan = true; satah.renderOrder = 4;
    model.add(satah);
    return { kanvas, tex, tetap(teks) {
      const c = kanvas.getContext('2d');
      c.clearRect(0, 0, 256, 96);
      c.fillStyle = '#121712'; c.font = 'bold 64px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(teks, 128, 52);
      tex.needsUpdate = true;
    } };
  }
  const tetapkanLCD = (teks) => { if (lcd) lcd.tetap(teks); };

  // ---------------------------------------------------------------- kabel kuar
  function binaKabel(warna) {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: warna, roughness: 0.6 }));
    mesh.userData.milikSendiri = true; mesh.userData.bukanSempadan = true;
    model.add(mesh);
    return mesh;
  }
  function kemaskiniKabel(mesh, jek, kuar) {
    if (!mesh || !jek || !kuar) return;
    const a = jek.position.clone();
    const b = model.worldToLocal(kuar.localToWorld(new THREE.Vector3(0, 0.118, 0)));
    const lendut = Math.max(0.03, a.distanceTo(b) * 0.35);
    const c = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, -lendut, 0.02));
    const lengkung = new THREE.QuadraticBezierCurve3(a, c, b);
    mesh.geometry.dispose();
    mesh.geometry = new THREE.TubeGeometry(lengkung, 16, 0.0016, 6, false);
  }

  // ---------------------------------------------------------------- dial & MCB
  function tetapkanMod(md) {
    mod = md;
    // Putar pada paksi muka meter (Z model, ke arah kamera) yang diungkap dalam ruang tempatan dial.
    if (dial) dial.quaternion.copy(dialAsal).multiply(new THREE.Quaternion().setFromAxisAngle(paksiDial, sudutDial[md]));
    tetapkanLCD(simbolMod(md));
  }

  function ketikDial() {
    if (sibuk || selesai) return;
    tetapkanMod((mod + 1) % 4);
    K.bunyiKetik();
    const u = ujian();
    if (u && langkahSemasa() !== L.Dial && mod === u.mod) hud.toast('Mod ' + namaMod(mod) + ' dipilih!', WARNA.betul, 1.6);
    paparLangkah();
  }

  function tetapkanTogol(on, segera) {
    if (!togol) return Promise.resolve();
    const ke = on ? togolOn.clone() : togolOn.clone().addScaledVector(turun, JARAK_TOGOL);
    if (segera) { togol.position.copy(ke); return Promise.resolve(); }
    return pose(m, togol, { pos: ke }, 0.18).then(() => K.bunyiKetik());
  }

  async function ketikMCB() {
    if (sibuk || selesai) return;
    sibuk = true;
    const on = !mcbOn, u = ujian();
    if (on && (posM || posH) && u && !u.bekalanHidup) {
      hud.toast('BAHAYA! Jangan hidupkan bekalan semasa ujian keterusan/penebat.', WARNA.salah, 3);
      sibuk = false; return;
    }
    mcbOn = on;
    await tetapkanTogol(on, false);
    hud.toast(on ? 'Bekalan soket DIHIDUPKAN' : 'Bekalan soket DIMATIKAN', on ? WARNA.emas : WARNA.neon, 1.6);
    sibuk = false;
    paparLangkah();
  }

  // ---------------------------------------------------------------- X-RAY (tiada beban: L hanya BERTENAGA)
  function kemaskiniXRay() {
    xray.tetapkan('Wayar_BekalanL', XR.Bertenaga);
    xray.tetapkan('Wayar_LampuL', XR.Bertenaga);
    xray.tetapkan('WayarKetat', XR.Mati);
    xray.tetapkan('Wayar_LampuN', XR.Mati);
    xray.tetapkan('Wayar_SoketL', mcbOn ? XR.Bertenaga : XR.Mati);
    xray.tetapkan('Wayar_SoketN', XR.Mati);
    xray.tetapkan('Wayar_SoketE', XR.Mati);
  }
  butangXRay.onclick = () => {
    if (!xray) { hud.toast('Imbas poster dahulu untuk memaparkan papan.', WARNA.neon); return; }
    const on = !xray.aktif;
    xray.tetapkanAktif(on);
    butangXRay.textContent = on ? 'X-RAY: ON' : 'X-RAY';
    butangXRay.classList.toggle('hidup', on);
    K.kilat('#4d99ff', on ? 350 : 150);
    if (on) hud.toast('X-RAY: OREN = Hidup (L), BIRU = Neutral (N), HIJAU = Bumi (E). Titik bergerak = ARUS mengalir.', WARNA.neon, 5);
  };

  // ---------------------------------------------------------------- aliran ujian
  async function mulaUjian(tunda, i) {
    sibuk = true;
    await m.tunggu(tunda);
    if (!m.hidup) return;
    indeks = i; kesilapanUjian = 0;
    const u = ujian();
    elTajuk.textContent = u.tajuk; K.pop(elTajuk);
    kemaskiniCip();
    hud.toast(u.tajuk, WARNA.emas, 2);
    sibuk = false;
    paparLangkah();
  }

  // ---------------------------------------------------------------- input: seret, atau ketik & ketik
  function kuarDibenarkan() {
    const lk = langkahSemasa();
    if (lk !== L.Bekalan && lk !== L.Dial) return true;
    const u = ujian();
    if (lk === L.Bekalan && !u.bekalanHidup) { hud.toast('BAHAYA! Matikan bekalan sebelum menguji keterusan / penebat.', WARNA.salah, 3); K.kilat(WARNA.salah); }
    else hud.toast('Ikut langkah dahulu: ' + (lk === L.Dial ? 'tetapkan DIAL.' : 'ketik MCB SOKET.'), WARNA.neon);
    return false;
  }

  function paparPenanda(tunjuk) {
    for (const p of penanda.values()) { p.visible = tunjuk; p.material = bahanPenanda; }
    if (!tunjuk) titikHover = null;
  }

  function titikTerdekat(x, y, nisbah) {
    let terbaik = null, had = el.clientHeight * nisbah;
    for (const [k, t] of titik) {
      const s = keSkrin(t.getWorldPosition(new THREE.Vector3()));
      const j = Math.hypot(s.x - x, s.y - y);
      if (s.z < 1 && j < had) { had = j; terbaik = k; }
    }
    return terbaik;
  }

  function mulaSentuh(x, y) {
    posMula = { x, y }; calon = null;
    if (sibuk || selesai || !model) return;
    const h = pemilih.kena(x, y, { jejari: 0.02 });
    if (h && (h.data.obj === kuarM || h.data.obj === kuarH)) calon = h.data.obj;
  }

  function seret(x, y) {
    if (!diseret) {
      if (!calon || Math.hypot(x - posMula.x, y - posMula.y) < el.clientHeight * 0.025) return;
      if (!kuarDibenarkan()) { calon = null; return; }
      batalPilih();
      diseret = calon; calon = null;
      if (diseret === kuarM) posM = null; else posH = null;
      diseret.quaternion.copy(diseret === kuarM ? poseM : poseH);   // dipegang condong
      paparPenanda(true);
      tetapkanLCD(simbolMod(mod));
    }
    // Satah 7 cm (skala model) di hadapan papan; hujung kuar timbul di atas jari supaya tidak terlindung.
    const s = tempat.akar.scale.x;
    const depan = kamera().getWorldDirection(new THREE.Vector3());
    const titikSatah = tempat.akar.getWorldPosition(new THREE.Vector3()).addScaledVector(depan, -0.07 * s);
    const satah = new THREE.Plane().setFromNormalAndCoplanarPoint(depan.clone().negate(), titikSatah);
    const hit = new THREE.Vector3();
    if (sinar(x, y - el.clientHeight * 0.07).intersectPlane(satah, hit)) diseret.position.copy(diseret.parent.worldToLocal(hit));
    const sk = keSkrin(diseret.getWorldPosition(new THREE.Vector3()));
    const baru = titikTerdekat(sk.x, sk.y, 0.06);
    if (baru !== titikHover) {
      if (titikHover) penanda.get(titikHover).material = bahanPenanda;
      titikHover = baru;
      if (baru) { penanda.get(baru).material = bahanPenandaAktif; K.bunyiKetik(); }
    }
  }

  function tamatSentuh(x, y, ketik) {
    if (diseret) {
      const kuar = diseret; diseret = null;
      const t = titikHover;
      paparPenanda(false);
      nilai(kuar, t);
      return;
    }
    if (!ketik) return;
    // Kuar sudah dipilih dan ketikan jatuh pada titik ujian: utamakan titik itu walaupun kuar lain
    // (yang sudah terpasang) kelihatan bertindih di atasnya.
    if (dipilih && calon !== dipilih) {
      const t = titikTerdekat(x, y, 0.07);
      if (t) { const kuar = dipilih; calon = null; batalPilih(); if (kuar === kuarM) posM = null; else posH = null; nilai(kuar, t); return; }
    }
    if (calon) {
      const k = calon; calon = null;
      if (dipilih === k) { batalPilih(); return; }
      if (!kuarDibenarkan()) return;
      pilih(k);
      return;
    }
    if (dipilih) {
      const t = titikTerdekat(x, y, 0.07);
      const kuar = dipilih;
      if (!t) {
        if (!ketikObjekLain(x, y)) hud.toast('Ketik bulatan biru pada lubang soket / skru bar.', WARNA.neon, 1.8);
        return;
      }
      batalPilih();
      if (kuar === kuarM) posM = null; else posH = null;
      nilai(kuar, t);
      return;
    }
    ketikObjekLain(x, y);
  }

  function ketikObjekLain(x, y) {
    if (sibuk || selesai) return false;
    const h = pemilih.kena(x, y, { jejari: 0.02 });
    if (!h) return false;
    if (h.data.id === 'dial') { ketikDial(); return true; }
    if (h.data.id === 'mcbSoket') { ketikMCB(); return true; }
    return false;
  }

  function pilih(k) {
    batalPilih();
    dipilih = k;
    paparPenanda(true);
    denyutPilih = m.setiap((dt, t) => { k.scale.setScalar(1.12 + 0.1 * Math.sin(t * 9)); });
    hud.toast(`KUAR ${k === kuarM ? 'MERAH' : 'HITAM'} dipilih — ketik titik ujian pada papan.`, k === kuarM ? WARNA.merahKuar : WARNA.kelabuKuar, 2.2);
    K.bunyiKetik();
  }

  function batalPilih() {
    if (denyutPilih) denyutPilih.henti();
    denyutPilih = null;
    if (dipilih) dipilih.scale.setScalar(1);
    dipilih = null;
    paparPenanda(false);
  }

  function nilai(kuar, t) {
    const merah = kuar === kuarM, u = ujian();
    const sasaran = merah ? u.titikMerah : u.titikHitam;
    if (!t) { kembaliRehat(kuar); return; }
    if (t !== sasaran) {
      kesilapan++; kesilapanUjian++;
      hud.toast(`Bukan titik itu! ${merah ? u.arahanMerah : u.arahanHitam}  (-5 XP)`, WARNA.salah, 3.2);
      K.kilat(WARNA.salah); K.bunyiSalah();
      kembaliRehat(kuar);
      return;
    }
    letak(kuar, t, merah);
  }

  async function letak(kuar, t, merah) {
    sibuk = true;
    const p = kuar.parent.worldToLocal(titik.get(t).getWorldPosition(new THREE.Vector3()));
    await pose(m, kuar, { pos: p, rot: merah ? poseM : poseH }, 0.18);
    if (!m.hidup) return;
    if (merah) posM = t; else posH = t;
    K.bunyiKetik(); K.kilat(WARNA.betul, 150);
    if (langkahSemasa() === L.Siap) await bacaanDanSeterusnya();
    else { paparLangkah(); sibuk = false; }
  }

  function kembaliRehat(kuar) {
    const rehat = kuar === kuarM ? rehatM : rehatH;
    return rehat ? pose(m, kuar, { pos: rehat.position.clone(), rot: rehat.quaternion.clone() }, 0.25) : Promise.resolve();
  }

  async function bacaanDanSeterusnya() {
    const u = ujian();
    for (let i = 0; i < 10; i++) {
      tetapkanLCD(u.mod === MOD.V ? `${(Math.random() * 240).toFixed(1)} V` : u.mod === MOD.Ohm ? `${(Math.random() * 3).toFixed(2)} Ω` : `${100 + Math.floor(Math.random() * 899)} MΩ`);
      await m.tunggu(0.07);
    }
    if (!m.hidup) return;
    tetapkanLCD(u.bacaan);
    K.bunyiBetul();
    const t = o.get('TitikLCD');
    kesanBetul(zk, t ? t.position.clone() : new THREE.Vector3());
    K.kilat(WARNA.betul, 250);
    const xp = Math.max(13, 25 - 5 * kesilapanUjian);
    tambahXP(xp, 8);
    hud.toast(`BACAAN: ${u.bacaan}  —  LULUS!  +${xp} XP`, WARNA.betul, 3);
    hud.fakta(u.fakta);
    hud.arahan('LULUS', `${u.tajuk}: bacaan ${u.bacaan}.`, WARNA.betul);
    hud.garis((indeks + 1) / D.UJIAN_L8.length);
    await m.tunggu(3.2);
    await kembaliRehat(kuarM);
    await kembaliRehat(kuarH);
    if (!m.hidup) return;
    posM = posH = null;
    if (indeks + 1 < D.UJIAN_L8.length) await mulaUjian(0.2, indeks + 1);
    else await tamat();
  }

  async function tamat() {
    selesai = true; indeks = D.UJIAN_L8.length;
    kemaskiniCip();
    tandaSelesai(8);
    elTajuk.textContent = 'SEMUA UJIAN LULUS!';
    tetapkanLCD('PASS');
    const t = o.get('TitikLCD');
    bungaApi(zk, t ? t.position.clone() : new THREE.Vector3());
    K.kilat(WARNA.emas, 500); K.bunyiMenang();
    hud.toast('TAHNIAH! PEMASANGAN SELAMAT DITENAGAKAN!', WARNA.emas, 4);
    hud.arahan('SIAP', kesilapan === 0 ? 'Sempurna — semua ujian tanpa kesilapan!' : `Semua ujian lulus (${kesilapan} kesilapan).`, WARNA.betul);
    await m.tunggu(0.8);
    K.konfeti(); K.popup(`+${xpLevel(8)} XP`, WARNA.emas);
    await m.tunggu(2.5);
    if (!m.hidup) return;
    ctx.panelTamat({ tajuk: '★ SEMUA UJIAN LULUS! ★', subtajuk: 'LEVEL 8 SELESAI', bintang: kesilapan === 0 ? 3 : kesilapan <= 3 ? 2 : 1, xp: `+${xpLevel(8)} XP`,
      butang: [{ teks: 'TERUSKAN: LEVEL 9 ➡', ke: 'level9', utama: true }, { teks: 'MENU UTAMA', ke: 'menu' }] });
  }

  // ---------------------------------------------------------------- AR
  const sentuh = pasangSentuh({ turun: mulaSentuh, gerak: seret, naik: tamatSentuh,
    batal: () => { if (diseret) { const k = diseret; diseret = null; paparPenanda(false); kembaliRehat(k); } } });
  const pengawal = {
    kemaskini(dt) {
      m.kemaskini(dt);
      if (!tempat) return;
      tempat.kemaskini(dt);
      el.classList.toggle('dikesan', tempat.nampak);
      if (tempat.nampak && !mula) { mula = true; mulaUjian(0.6, 0); }
      kemaskiniKabel(kabelM, jekM, kuarM);
      kemaskiniKabel(kabelH, jekH, kuarH);
      if (xray && xray.aktif) { kemaskiniXRay(); xray.kemaskini(m.masa); }
      zk.kemaskini(dt);
    },
  };
  await ctx.hidupAR(pengawal);
  model = await muatModel('PapanUjian');
  if (!m.hidup) return { tamat() {} };
  o = cariSemua(model);
  tempat = new Penempatan({ lebarModel: 1, lebarSkrin: 0.8, naik: 0.12, muat: { skrin: document.getElementById('s-level8'), atas: '.bar-atas, .l-tajuk, .l-subtajuk', bawah: '.hud-panel, .l-pilihan, .k-misi' } });
  tempat.pusing.rotation.x = 0.05;
  model.updateMatrixWorld(true);
  sediakan();
  const saiz = tengahkan(model, tempat.pusing);
  tempat.lebarModel = saiz.x;
  daftarUji(tempat.akar);

  function sediakan() {
    const ikat = (a, i) => { const ta = o.get(a), ti = o.get(i); if (ta && ti) ti.attach(ta); };
    ikat('Togol_MCBLampu', 'MCB_Lampu'); ikat('Togol_MCBSoket', 'MCB_Soket');
    for (const [nama, id, paparan] of D.SASARAN_PAPAN6) {
      const t = o.get(nama);
      if (t) pemilih.daftar(t, { id, nama: paparan, obj: t }, { besar: 1.15, minimum: 0.02 });
    }
    dial = o.get('DialMeter');
    if (dial) {
      dialAsal = dial.quaternion.clone();
      paksiDial = new THREE.Vector3(0, 0, 1).applyQuaternion(dialAsal.clone().invert()).normalize();
      pemilih.daftar(dial, { id: 'dial', obj: dial }, { besar: 1.2, minimum: 0.05 });
      // Sudut setiap mod diambil daripada kedudukan label pada muka meter (dari atas, ikut jam).
      const pd = dial.position;
      sudutDial = LABEL_MOD.map((n) => {
        const lb = o.get(n);
        if (!lb) return 0;
        const d = lb.position.clone().sub(pd);
        return -Math.atan2(d.x, d.y);
      });
    }
    kuarM = o.get('KuarMerah'); kuarH = o.get('KuarHitam');
    for (const k of [kuarM, kuarH]) if (k) pemilih.daftar(k, { id: 'kuar', obj: k }, { besar: 1.2, minimum: 0.028 });
    rehatM = o.get('Rehat_KuarMerah'); rehatH = o.get('Rehat_KuarHitam');
    jekM = o.get('Jek_Merah'); jekH = o.get('Jek_Hitam');
    const pm = o.get('PoseKuar_Merah'), ph = o.get('PoseKuar_Hitam');
    poseM = pm ? pm.quaternion.clone() : new THREE.Quaternion();
    poseH = ph ? ph.quaternion.clone() : new THREE.Quaternion();
    model.traverse((t) => {
      if (!t.name.startsWith('TitikUji_')) return;
      const k = t.name.slice('TitikUji_'.length);
      titik.set(k, t);
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 14, 10), bahanPenanda);
      bola.userData.milikSendiri = true; bola.userData.bukanSempadan = true; bola.visible = false; bola.renderOrder = 3;
      t.add(bola);
      penanda.set(k, bola);
    });
    togol = o.get('Togol_MCBSoket');
    if (togol) { togolOn = togol.position.clone(); turun = bawahDalamInduk(model, togol); }
    kabelM = binaKabel(srgb(0.75, 0.05, 0.05));
    kabelH = binaKabel(srgb(0.05, 0.05, 0.06));
    lcd = binaLCD();
    zk = new Zarah(model);
    tetapkanTogol(true, true);
    tetapkanMod(MOD.OFF);
    xray = new XRay(model, ['Wayar_BekalanL', 'Wayar_LampuN', 'Wayar_SoketN', 'Wayar_SoketE']);
  }

  return {
    tamat() {
      m.henti();
      sentuh.lepas();
      if (tempat) tempat.buang();
      hud.buang();
      butangXRay.textContent = 'X-RAY'; butangXRay.classList.remove('hidup');
      el.classList.remove('dikesan');
    },
  };
}
