// Mod permainan KAMPUNG ELEKTRIK (KampungPermainan.cs + KampungMisi.cs + KampungLabel.cs).
// Imbas penanda -> diorama kampung 3D muncul. Seret satu jari = pusing, cubit = zum. Enam misi dalam
// SATU skena AR. Hierarki: Penempatan.pusing -> condong -> putar -> fokus (zum + anjakan) -> model.
// Bayang & AO sudah dibakar dalam model (warna bucu + tekstur bayang tanah) — tiada bayang masa nyata.
import { THREE, Penempatan, muatModel, kamera, cahayaSkena, pulihkanCahaya, bekas } from './ar.js';
import * as KD from './kampung-data.js';
import * as S from './simpan.js';
import * as K from './kesan.js';
import { HUD, WARNA, KEADAAN } from './hud.js';
import { Masa, cariSemua, kotakTempatan, pasangSentuh, Zarah, kesanBetul, bungaApi, srgb, tekstur, muatTekstur, sinar, keSkrin, daftarUji } from './alat3d.js';

// nama bahan Blender -> [r, g, b, kelicinan Unity, logam, tekstur, ulang]  (PALET_KAMPUNG)
const PALET = {
  Kampung_Rumput: [0.95, 1.15, 0.70, 0.05, 0, 'rumput.png', 9], Kampung_RumputGelap: [0.72, 0.92, 0.52, 0.05, 0, 'rumput.png', 9],
  Kampung_Tanah: [0.42, 0.30, 0.20, 0.05, 0, 'tanah.png', 10], Kampung_DasarSungai: [0.20, 0.22, 0.20, 0.1, 0, 'tanah.png', 10],
  Kampung_Air: [0.18, 0.46, 0.52, 0.96, 0.15, 'air.png', 4], Kampung_Batu: [0.50, 0.49, 0.46, 0.15, 0, 'tanah.png', 30],
  Kampung_Jalan: [0.24, 0.24, 0.25, 0.12, 0, 'jalan.png', 12], Kampung_GarisJalan: [0.86, 0.86, 0.82, 0.2, 0],
  Kampung_Konkrit: [0.66, 0.65, 0.62, 0.08, 0, 'tanah.png', 25], Kampung_Kayu: [0.52, 0.36, 0.22, 0.12, 0, 'papan.png', 25],
  Kampung_KayuGelap: [0.33, 0.22, 0.13, 0.12, 0, 'papan.png', 25], Kampung_DindingKrim: [0.86, 0.79, 0.63, 0.04, 0, 'plaster.png', 8],
  Kampung_DindingDalam: [0.97, 0.94, 0.86, 0.04, 0, 'plaster.png', 8], Kampung_DindingKuning: [0.88, 0.78, 0.53, 0.04, 0, 'plaster.png', 8],
  Kampung_PapanRumah: [0.68, 0.52, 0.34, 0.08, 0, 'papan.png', 14], Kampung_AtapMerah: [0.58, 0.17, 0.14, 0.15, 0, 'genting.png', 22],
  Kampung_AtapZink: [0.50, 0.55, 0.60, 0.45, 0.45, 'zink.png', 26], Kampung_AtapDewan: [0.20, 0.27, 0.45, 0.3, 0.2, 'zink.png', 26],
  Kampung_Trim: [0.88, 0.88, 0.85, 0.15, 0], Kampung_Tingkap: [0.16, 0.22, 0.28, 0.85, 0], Kampung_Pintu: [0.45, 0.28, 0.15, 0.15, 0, 'papan.png', 30],
  Kampung_Lantai: [0.78, 0.72, 0.62, 0.25, 0, 'plaster.png', 12], Kampung_Bata: [0.62, 0.33, 0.22, 0.05, 0, 'tanah.png', 30],
  Kampung_TiangKonkrit: [0.68, 0.67, 0.64, 0.1, 0, 'tanah.png', 30], Kampung_Logam: [0.62, 0.64, 0.66, 0.5, 0.6],
  Kampung_Transformer: [0.46, 0.52, 0.48, 0.35, 0.3], Kampung_Penebat: [0.48, 0.25, 0.15, 0.6, 0], Kampung_Wayar: [0.06, 0.06, 0.06, 0.3, 0],
  Kampung_KonduitMerah: [0.66, 0.15, 0.11, 0.25, 0], Kampung_Daun: [0.24, 0.46, 0.16, 0.08, 0], Kampung_Daun2: [0.34, 0.58, 0.20, 0.08, 0],
  Kampung_DaunPisang: [0.38, 0.58, 0.20, 0.12, 0], Kampung_Batang: [0.38, 0.27, 0.18, 0.05, 0, 'papan.png', 40],
  Kampung_KacaLampu: [0.86, 0.85, 0.80, 0.6, 0], Kampung_PlastikPutih: [0.86, 0.86, 0.84, 0.35, 0], Kampung_KotakDB: [0.78, 0.79, 0.78, 0.3, 0.1],
  Kampung_Tembaga: [0.80, 0.48, 0.25, 0.6, 0.8], Kampung_Kereta: [0.72, 0.66, 0.52, 0.6, 0.4],
  Kampung_DaunKad: [0.80, 0.92, 0.70, 0.12, 0, 'daun_gugus.png', 1], Kampung_Pelepah: [0.85, 0.95, 0.72, 0.15, 0, 'pelepah.png', 1],
  Kampung_PisangKad: [0.92, 1.0, 0.80, 0.2, 0, 'pisang.png', 1],
  Kampung_BenderaKeda: [1, 1, 1, 0.1, 0, 'bendera_keda.png', 1],   // bendera Kolej KEDA (UV 0..1)
};
const BAHAN_POKOK = new Set(['Kampung_Daun', 'Kampung_Daun2', 'Kampung_DaunPisang', 'Kampung_Batang', 'Kampung_DaunKad', 'Kampung_Pelepah', 'Kampung_PisangKad', 'Kampung_KayuGelap']);
const BAHAN_BENDERA = new Set(['Kampung_BenderaKeda']);
const BAHAN_TANAH = new Set(['Kampung_Rumput', 'Kampung_RumputGelap', 'Kampung_Tanah', 'Kampung_DasarSungai', 'Kampung_Air', 'Kampung_Batu', 'Kampung_Jalan', 'Kampung_GarisJalan']);
const BAHAN_KAD = new Set(['Kampung_DaunKad', 'Kampung_Pelepah', 'Kampung_PisangKad']);

// nama -> [objek kosong fokus, zum, sudut condong, objek arah hadapan]
const FOKUS = {
  kampung: ['Fokus_Kampung', 0.88, 42, null], pencawang: ['Fokus_Pencawang', 2.4, 36, null], rumahA: ['Fokus_RumahA', 2.6, 32, null],
  dindingA: ['Fokus_DindingA', 3.4, 9, 'Normal_DindingA'], rumahB: ['Fokus_RumahB', 3.0, 20, 'Arah_RumahB'],
  kedai: ['Fokus_Kedai', 2.6, 22, null], dewan: ['Fokus_Dewan', 2.5, 22, null], tiang: ['Fokus_Tiang', 2.2, 18, null],
};
const BANGUNAN = ['A', 'B', 'Kedai', 'Dewan', 'Jalan'];
const DEG = Math.PI / 180;
const UBAH_SUDUT = (a, b, k) => a + (((b - a + 540) % 360) - 180) * k;

// ---------------------------------------------------------------- bahan kampung (shader angin + bayang)

let _bahanKampung = null;
function binaBahan(nama, seragam) {
  const p = PALET[nama];
  const kad = BAHAN_KAD.has(nama);
  const m = new THREE.MeshStandardMaterial({ name: nama, vertexColors: true, side: kad ? THREE.DoubleSide : THREE.FrontSide });
  if (p) {
    m.color = srgb(p[0], p[1], p[2]); m.roughness = 1 - p[3]; m.metalness = p[4];
    if (p[5]) {
      // Klon berkongsi sumber imej yang sama (dimuat sekali); hanya ulangan UV berbeza.
      const t = tekstur(p[5], { ulang: true }).clone();
      t.repeat.set(p[6], p[6]);
      // UV glTF bermula di ATAS imej; tekstur berulang lain tidak peduli arah, tetapi logo bendera mesti tegak.
      if (BAHAN_BENDERA.has(nama)) { t.flipY = false; t.needsUpdate = true; }
      m.map = t;
    }
  } else { m.color = srgb(0.7, 0.7, 0.7); m.roughness = 0.85; }
  if (kad) m.alphaTest = 0.45;
  const pokok = BAHAN_POKOK.has(nama), bendera = BAHAN_BENDERA.has(nama), tanah = BAHAN_TANAH.has(nama);
  if (pokok || bendera || tanah) {
    const angin = pokok
      ? { amp: 0.0022, arah: new THREE.Vector3(-0.9, 0, 0.45), fasa: new THREE.Vector3(-9, 0, 7), laju: 1.8 }
      : { amp: 0.0035, arah: new THREE.Vector3(0, 0.15, 1), fasa: new THREE.Vector3(-110, 0, 0), laju: 6 };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uMasa = seragam.masa;
      if (pokok || bendera) {
        sh.uniforms.uAmp = { value: angin.amp }; sh.uniforms.uArah = { value: angin.arah };
        sh.uniforms.uFasa = { value: angin.fasa }; sh.uniforms.uLaju = { value: angin.laju };
        sh.vertexShader = 'attribute float goyang;\nuniform float uMasa, uAmp, uLaju;\nuniform vec3 uArah, uFasa;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\nfloat fz = dot(position, uFasa);\nfloat sz = sin(uMasa * uLaju + fz) + 0.35 * sin(uMasa * uLaju * 2.3 + fz * 1.7);\ntransformed += uArah * (sz * goyang * uAmp);');
      }
      if (tanah) {
        sh.uniforms.petaBayang = { value: tekstur('bayang_tanah.png') };
        sh.vertexShader = 'attribute vec2 uvBayang;\nvarying vec2 vUvBayang;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvUvBayang = uvBayang;');
        sh.fragmentShader = 'uniform sampler2D petaBayang;\nvarying vec2 vUvBayang;\n' + sh.fragmentShader.replace('#include <color_fragment>',
          '#include <color_fragment>\ndiffuseColor.rgb *= texture2D(petaBayang, vUvBayang).r;');
      }
    };
    m.customProgramCacheKey = () => nama;
  }
  return m;
}

/** Tukar warna bucu RGBA (AO + berat goyang) kepada RGB + atribut goyang; UV kedua -> uvBayang. */
function sediakanGeometri(g) {
  const c = g.getAttribute('color');
  if (c && c.itemSize === 4) {
    const n = c.count, rgb = new Float32Array(n * 3), w = new Float32Array(n);
    for (let i = 0; i < n; i++) { rgb[i * 3] = c.getX(i); rgb[i * 3 + 1] = c.getY(i); rgb[i * 3 + 2] = c.getZ(i); w[i] = c.getW(i); }
    g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    g.setAttribute('goyang', new THREE.BufferAttribute(w, 1));
  } else if (!g.getAttribute('goyang')) g.setAttribute('goyang', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count), 1));
  if (!g.getAttribute('color')) {
    const n = g.getAttribute('position').count;
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  }
  const u1 = g.getAttribute('uv1');
  if (u1) g.setAttribute('uvBayang', u1);
  else g.setAttribute('uvBayang', new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count * 2).fill(0.5), 2));
}

export async function kampung(ctx) {
  const el = ctx.el;
  const m = new Masa();
  const seragam = { masa: { value: 0 } };
  const hud = new HUD(el, { cip: 6 });
  const elTajuk = el.querySelector('.l-tajuk'), elMisi = el.querySelector('.l-subtajuk'), elFps = el.querySelector('.l-fps');
  const bMisi = el.querySelector('.butang-misi'), bPandangan = el.querySelector('.butang-pandangan');
  const bLabel = el.querySelector('.butang-label'), bHint = el.querySelector('.butang-hint');
  const elPilihan = el.querySelector('.l-pilihan'), butangPilihan = [...elPilihan.querySelectorAll('button')];
  const elPanelMisi = el.querySelector('.k-misi'), elTamat = el.querySelector('.k-tamat');
  const lapisanLabel = el.querySelector('.lapisan-label');
  el.classList.remove('dikesan');
  elTajuk.textContent = 'KAMPUNG ELEKTRIK'; elMisi.textContent = '';
  elPilihan.hidden = true; elPanelMisi.hidden = true; elTamat.hidden = true; bHint.hidden = true;
  hud.arahan('IMBAS', 'Halakan kamera ke poster untuk memaparkan kampung 3D.', WARNA.neon);
  hud.susunCip(0);

  let tempat = null, model = null, o = null, condong = null, putar = null, fokus = null, k = 1;
  const batas = new Map();
  let zk = null, kilau = null, bahanAir = null;
  // pandangan
  let condongS = 42, yawS = 0, zumS = 1, titikS = new THREE.Vector3();
  let condongK = 42, yawK = 0, zumK = 1; const titikK = new THREE.Vector3();
  let condongP = 0, yawP = 0, zumP = 1, zumCubitAsal = 1;
  // input & misi
  let misi = -1, sibuk = true, tokenMisi = 0, kesilapan = 0;
  let ketikFn = null, seretMula = null, seretGerak = null, seretTamat = null, pilihanFn = null;
  let menyeret = false, memutar = false, posMula = null, posSebelum = null, sentuhAktif = false;
  const sementara = [];
  // kuasa
  const kuasa = {}, cahaya = {}; let malam = 0, malamSasaran = 0, tvHidup = true, tvKitar = null;
  const togolAtas = new Map();
  let bahanKacaMenyala, bahanTingkapMenyala, bahanTV, bahanAliran, bahanSorot, bahanWayar;
  let mula = false;

  // ================================================================ objek & sasaran
  const obj = (n) => (o ? o.get(n) : null);
  function kotak(n) {
    if (!batas.has(n)) { const t = obj(n); batas.set(n, t ? kotakTempatan(t) : new THREE.Box3()); }
    return batas.get(n);
  }
  const nampak = (t) => { for (let p = t; p; p = p.parent) if (!p.visible) return false; return true; };
  function pusatDunia(n) {
    const t = obj(n); if (!t) return tempat.akar.getWorldPosition(new THREE.Vector3());
    const b = kotak(n);
    return t.localToWorld(b.isEmpty() ? new THREE.Vector3() : b.getCenter(new THREE.Vector3()));
  }
  const pusatFokus = (n) => fokus.worldToLocal(pusatDunia(n));
  const pusatModel = (n) => model.worldToLocal(pusatDunia(n));

  /** Unjur 8 bucu sempadan ke skrin -> {x0,y0,x1,y1} (piksel), atau null. */
  function segiSkrin(n) {
    const t = obj(n); if (!t || !nampak(t)) return null;
    const b = kotak(n); if (b.isEmpty()) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
      const s = keSkrin(t.localToWorld(c));
      if (s.z > 1) return null;
      x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y); x1 = Math.max(x1, s.x); y1 = Math.max(y1, s.y);
    }
    return { x0, y0, x1, y1 };
  }

  function jarakGarisAliran(x, y) {
    let terbaik = Infinity;
    for (let i = 0; i < 3; i++) {
      const a = obj(`Aliran_${String(i).padStart(2, '0')}`), b = obj(`Aliran_${String(i + 1).padStart(2, '0')}`);
      if (!a || !b) continue;
      const pa = keSkrin(a.getWorldPosition(new THREE.Vector3())), pb = keSkrin(b.getWorldPosition(new THREE.Vector3()));
      const abx = pb.x - pa.x, aby = pb.y - pa.y;
      const t = Math.max(0, Math.min(1, ((x - pa.x) * abx + (y - pa.y) * aby) / Math.max(1, abx * abx + aby * aby)));
      terbaik = Math.min(terbaik, Math.hypot(x - (pa.x + abx * t), y - (pa.y + aby * t)));
    }
    return terbaik;
  }

  /** Sasaran terbaik di bawah jari: dalam segi skrin (yang paling kecil menang), atau paling hampir dalam had. */
  function cariSasaran(x, y, calon, had = 0.05) {
    let terbaik = null, skor = Infinity;
    const hadPx = el.clientHeight * had;
    for (const n of calon) {
      let sk;
      if (n === 'Talian_Agihan') { sk = jarakGarisAliran(x, y); if (sk > hadPx) continue; sk += 1000; }
      else {
        const r = segiSkrin(n); if (!r) continue;
        if (x >= r.x0 - 6 && x <= r.x1 + 6 && y >= r.y0 - 6 && y <= r.y1 + 6) sk = (r.x1 - r.x0) * (r.y1 - r.y0) * 1e-6;
        else {
          const dx = Math.max(r.x0 - x, 0, x - r.x1), dy = Math.max(r.y0 - y, 0, y - r.y1);
          const d = Math.hypot(dx, dy);
          if (d > hadPx) continue;
          sk = 1000 + d;
        }
      }
      if (sk < skor) { skor = sk; terbaik = n; }
    }
    return terbaik;
  }

  // ================================================================ pandangan
  function fokuskan(nama, segera = false) {
    const f = FOKUS[nama]; const t = f && obj(f[0]);
    if (!t) return;
    titikS = fokus.worldToLocal(t.getWorldPosition(new THREE.Vector3()));
    zumS = f[1]; condongS = f[2]; yawS = 0;
    if (f[3] && obj(f[3])) {
      const d = fokus.worldToLocal(obj(f[3]).getWorldPosition(new THREE.Vector3())).sub(titikS);
      if (d.x * d.x + d.z * d.z > 1e-8) yawS = Math.atan2(-d.x, d.z) / DEG;
    }
    condongP = 0; yawP = 0; zumP = 1;
    if (segera) { titikK.copy(titikS); zumK = zumS; condongK = condongS; yawK = yawS; kenakanPandangan(); }
  }
  const setSemulaPandangan = () => { condongP = 0; yawP = 0; zumP = 1; };
  function kenakanPandangan() {
    condong.rotation.x = Math.max(4, Math.min(80, condongK + condongP)) * DEG;
    putar.rotation.y = (yawK + yawP) * DEG;
    const z = zumK * zumP;
    fokus.scale.setScalar(z);
    fokus.position.copy(titikK).multiplyScalar(-z);
  }

  // ================================================================ keadaan kampung
  function tunjuk(n, t) { const x = obj(n); if (x) x.visible = t; }
  function tetapBahan(n, bahan) {
    const t = obj(n); if (!t) return;
    t.traverse((x) => {
      if (!x.isMesh) return;
      if (x.userData.bahanAsal === undefined) x.userData.bahanAsal = x.material;
      x.material = bahan || x.userData.bahanAsal;
    });
  }
  function setSemulaKampung() {
    for (const g of sementara) if (g.parent) g.parent.remove(g);
    sementara.length = 0;
    model.traverse((x) => { if (x.isMesh && x.userData.bahanAsal !== undefined) x.material = x.userData.bahanAsal; });
    for (const [t, p] of togolAtas) t.position.copy(p);
    for (const [n, t] of o) if (n.startsWith('Bahaya_')) t.scale.setScalar(1);
    tunjuk('Suis_B', true); tunjuk('Suis_B_Rosak', false);
    tunjuk('Talian_Servis_B', true); tunjuk('Talian_Servis_B_Putus', false);
    tunjuk('Cerek_A', true); tunjuk('Bahaya_SoketBebanLebih', true);
    for (const b of BANGUNAN) kuasa[b] = true;
    malamSasaran = 0;
    kemaskiniCahayaBangunan();
  }
  const masa = (gelap) => { malamSasaran = gelap ? 1 : 0; };
  function setKuasa(b, on, kesan = false) {
    const lama = !!kuasa[b];
    kuasa[b] = on;
    kemaskiniCahayaBangunan();
    if (on && !lama && kesan) {
      const n = b === 'A' ? 'Kaca_A' : b === 'Jalan' ? 'Kaca_LampuJalan' : 'Tingkap_' + b;
      kesanBetul(zk, pusatModel(n), 1);
      K.bunyiBetul();
    }
  }
  function kemaskiniCahayaBangunan() {
    for (const b of BANGUNAN) {
      const on = !!kuasa[b];
      // Lampu jalan hanya menyala apabila gelap (sel foto).
      const lampuOn = on && (b !== 'Jalan' || malamSasaran > 0.5);
      tetapBahan('Kaca_' + b, lampuOn ? bahanKacaMenyala : null);
      if (b === 'Jalan') tetapBahan('Kaca_LampuJalan', lampuOn ? bahanKacaMenyala : null);
      tetapBahan('Tingkap_' + b, on && malam > 0.15 ? bahanTingkapMenyala : null);
      if (cahaya[b]) cahaya[b].visible = lampuOn && malam > 0.15;
    }
    const tv = !!kuasa.A && tvHidup;
    tetapBahan('SkrinTV_A', tv ? bahanTV : null);
    if (tv && !tvKitar) {
      let baki = 0;
      tvKitar = m.setiap((dt) => {
        baki -= dt; if (baki > 0) return;
        baki = 0.3 + Math.random() * 0.5;
        const c = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
        bahanTV.emissive.copy(c).multiplyScalar(1.3); bahanTV.color.copy(c).multiplyScalar(0.3);
      });
    }
    if (!tv && tvKitar) { tvKitar.henti(); tvKitar = null; }
  }

  function gerakTempatan(t, ke, durasi) {
    const dari = t.position.clone();
    return m.animasi(durasi, (q) => t.position.lerpVectors(dari, ke, q * q * (3 - 2 * q))).then(() => K.bunyiKetik());
  }
  function togol(n, atas) {
    const t = obj(n); const p = t && togolAtas.get(t);
    if (!p) return Promise.resolve();
    return gerakTempatan(t, atas ? p.clone() : p.clone().add(new THREE.Vector3(0, -0.0055 * k, 0)), 0.15);
  }
  function togolSegera(n, atas) {
    const t = obj(n); const p = t && togolAtas.get(t);
    if (p) t.position.copy(atas ? p : p.clone().add(new THREE.Vector3(0, -0.0055 * k, 0)));
  }
  function denyut(n, kali = 2) {
    const t = obj(n); if (!t) return Promise.resolve();
    const asal = t.scale.clone(), d = 0.5 * kali;
    return m.animasi(d, (q) => t.scale.copy(asal).multiplyScalar(1 + 0.12 * Math.sin(q * d * Math.PI * 4))).then(() => t.scale.copy(asal));
  }

  // ================================================================ kesan 3D runtime
  function segmen(a, b, jejari, bahan, induk = fokus) {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 10), bahan);
    g.userData.milikSendiri = true;
    induk.add(g);
    letakSegmen(g, a, b, jejari);
    return g;
  }
  function letakSegmen(t, a, b, jejari) {
    const d = b.clone().sub(a); const pjg = Math.max(d.length(), 1e-5);
    t.position.copy(a).add(b).multiplyScalar(0.5);
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.divideScalar(pjg));
    t.scale.set(jejari * 2, pjg, jejari * 2);
  }

  let penunjuk = null, rutinPenunjuk = null;
  /** Kon bercahaya terapung di atas objek (petunjuk). null = sorok. */
  function tunjukPenunjuk(nama, tempoh = 0) {
    if (rutinPenunjuk) rutinPenunjuk.henti();
    rutinPenunjuk = null;
    if (penunjuk) { fokus.remove(penunjuk); penunjuk = null; }
    if (!nama || !obj(nama)) return;
    penunjuk = new THREE.Group();
    const kon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), bahanSorot);
    kon.scale.set(0.012 * k, 0.02 * k, 0.012 * k);
    const batang = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 8), bahanSorot);
    batang.position.y = 0.018 * k; batang.scale.set(0.003 * k, 0.012 * k, 0.003 * k);
    penunjuk.add(kon, batang);
    fokus.add(penunjuk);
    let t = 0;
    rutinPenunjuk = m.setiap((dt) => {
      t += dt;
      if (!penunjuk || (tempoh > 0 && t > tempoh)) { if (penunjuk) { fokus.remove(penunjuk); penunjuk = null; } return false; }
      const b = kotak(nama), x = obj(nama);
      const atas = fokus.worldToLocal(x.localToWorld(b.isEmpty() ? new THREE.Vector3() : new THREE.Vector3(b.getCenter(new THREE.Vector3()).x, b.max.y, b.getCenter(new THREE.Vector3()).z)));
      penunjuk.position.copy(atas).add(new THREE.Vector3(0, (0.03 + 0.006 * Math.sin(t * 6)) * k, 0));
      penunjuk.scale.setScalar(1 / Math.max(0.5, zumK * zumP));
    });
  }

  // ================================================================ HUD & markah
  const arahan = (l, t, w) => hud.arahan(l, t, w);
  const toast = (t, w, s = 2.6) => hud.toast(t, w, s);
  const fakta = (t) => hud.fakta(t);
  const cip = (i, kd, label) => hud.cip(i, kd, label);
  const susunCip = (n) => hud.susunCip(n);
  function salah(mesej, tolakXP = true) {
    if (tolakXP) kesilapan++;
    toast(mesej + (tolakXP ? '  (-5 XP)' : ''), WARNA.salah, 3.4);
    K.kilat(WARNA.salah); K.bunyiSalah();
  }
  function betul(mesej, posNama) {
    toast(mesej, WARNA.betul, 2.6);
    K.kilat(WARNA.betul, 220); K.bunyiBetul();
    kesanBetul(zk, posNama ? pusatModel(posNama) : new THREE.Vector3(0, 0.05, 0), 1);
  }

  // ---- penantian yang boleh dibatalkan apabila misi dihentikan
  let batalTunggu = [];
  const aktif = (t) => m.hidup && t === tokenMisi;
  function tunggu(saat, t) { return m.tunggu(saat).then(() => aktif(t)); }
  /** Tunggu ketikan pada salah satu calon. `utama` (pilihan) diuji dahulu — sasaran kecil yang
   *  bertindih (togol / kotak DB / sambungan) tidak tersasar kepada objek lain di sebelahnya. */
  function tungguKetik(calon, onLain = null, had = 0.05, utama = null) {
    return new Promise((selesai) => {
      const senarai = [...calon];
      const batal = () => { ketikFn = null; selesai(null); };
      batalTunggu.push(batal);
      ketikFn = (x, y) => {
        const s = (utama && cariSasaran(x, y, utama, had)) || cariSasaran(x, y, senarai, had);
        if (s) { ketikFn = null; batalTunggu = batalTunggu.filter((b) => b !== batal); selesai(s); }
        else if (onLain) onLain(x, y);
      };
    });
  }
  function tungguSyarat(fn) {
    return new Promise((selesai) => {
      const h = m.setiap(() => { if (fn()) { selesai(true); return false; } });
      batalTunggu.push(() => { h.henti(); selesai(false); });
    });
  }

  // ================================================================ panel misi
  function binaPanelMisi() {
    const senarai = elPanelMisi.querySelector('.k-misi-senarai');
    senarai.innerHTML = '';
    for (let i = 0; i < KD.BIL_MISI; i++) {
      const buka = S.kampungDibuka(i), siap = S.kampungSiap(i);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'k-kad' + (siap ? ' siap' : '');
      b.disabled = !buka;
      b.innerHTML = `<span class="k-no">${i === 5 ? '★' : i + 1}</span><span class="k-info"><b>${KD.TAJUK_MISI[i]}</b><small>${KD.RINGKASAN_MISI[i]}</small></span>
        <span class="k-status">${!buka ? 'TERKUNCI' : siap ? `✓ ${S.kampungXP(i)}/${KD.XP_MAKS_KAMPUNG[i]} XP` : `▶ ${KD.XP_MAKS_KAMPUNG[i]} XP`}</span>`;
      b.addEventListener('click', () => { K.bunyiKetik(); mulaMisi(i); });
      senarai.appendChild(b);
    }
    elPanelMisi.querySelector('.k-jumlah').textContent = `${S.kampungJumlah()} / ${S.kampungMaksimum()} XP`;
  }

  function paparPanelMisi() {
    hentiMisi();
    setSemulaKampung();
    modLabel = 'Semua'; labelTerbuka.clear();
    fokuskan('kampung');
    elMisi.textContent = ''; elTajuk.textContent = 'KAMPUNG ELEKTRIK';
    susunCip(0);
    arahan('MISI', 'Pilih misi. Seret skrin untuk pusing kampung, cubit untuk zum.', WARNA.emas);
    binaPanelMisi();
    elPanelMisi.hidden = false;
    K.pop(elPanelMisi);
  }

  function hentiMisi() {
    tokenMisi++;
    for (const b of batalTunggu) b();
    batalTunggu = [];
    ketikFn = null; seretMula = null; seretGerak = null; seretTamat = null; pilihanFn = null;
    batalPegangKabel();
    sorokHint();
    misi = -1; sibuk = false; tvHidup = true;
    tunjukPenunjuk(null);
    elPilihan.hidden = true;
  }

  function mulaMisi(i) {
    if (!S.kampungDibuka(i)) return;
    elPanelMisi.hidden = true;
    hentiMisi();
    setSemulaKampung();
    misi = i;
    modLabel = i === 0 ? 'Terhad' : i === 4 ? 'Tiada' : 'Semua'; labelTerbuka.clear();
    kesilapan = 0;
    elMisi.textContent = i === 5 ? 'MISI AKHIR: ' + KD.TAJUK_MISI[i] : `MISI ${i + 1}: ${KD.TAJUK_MISI[i]}`;
    const t = tokenMisi;
    [misi1, misi2, misi3, misi4, misi5, misi6][i](t).catch((e) => console.error(e));
  }

  async function tamatMisi(ringkasan, t) {
    if (!aktif(t)) return;
    const maks = KD.XP_MAKS_KAMPUNG[misi];
    const xp = Math.max(maks / 2, maks - 5 * kesilapan);
    const n = misi;
    S.kampungRekod(n, xp);
    ketikFn = null; seretMula = null;
    bungaApi(zk, new THREE.Vector3(0, 0.08, 0), 1.5);
    K.kilat(WARNA.emas, 500); K.bunyiMenang();
    toast(`MISI ${n + 1} SELESAI!  +${xp} XP`, WARNA.emas, 3.5);
    arahan('SIAP', ringkasan, WARNA.betul);
    hud.garis(1);
    K.popup(`+${xp} XP`, WARNA.emas);
    if (!(await tunggu(0.8, t))) return;
    K.konfeti();
    if (!(await tunggu(4, t))) return;
    if (n === KD.BIL_MISI - 1) {
      elTamat.querySelector('p').textContent = `KAMPUNG PULIH SEPENUHNYA!\n\nJumlah: ${S.kampungJumlah()} / ${S.kampungMaksimum()} XP`;
      elTamat.hidden = false; K.pop(elTamat.firstElementChild);
      misi = -1;
    } else paparPanelMisi();
  }

  // ================================================================ MISI 1 — aliran tenaga
  let aliranHingga = -1;
  const titikAliran = (i) => { const a = obj(`Aliran_${String(i).padStart(2, '0')}`); return a ? fokus.worldToLocal(a.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(); };

  async function misi1(t) {
    const L = KD.ALIRAN;
    susunCip(L.length);
    L.forEach((x, i) => cip(i, i === 0 ? KEADAAN.Semasa : KEADAAN.Terkunci, x.label));
    setKuasa('A', false); tvHidup = false; kemaskiniCahayaBangunan();
    fokuskan('kampung');
    aliranHingga = -1;
    zarahAliran(t);
    const semua = L.flatMap((x) => x.sasaran);
    for (let s = 0; s < L.length; s++) {
      if (s === 3) fokuskan('rumahA');
      arahan('CARI', `Ketik ${L[s].nama}. Ikut aliran tenaga: pencawang hingga ke beban di rumah.`, WARNA.emas);
      let bilSalah = 0;
      for (;;) {
        const kena = await tungguKetik(semua, () => toast('Tiada komponen bekalan di situ. Cuba lagi.', WARNA.neon, 1.8), 0.04);
        if (!aktif(t)) return;
        if (L[s].sasaran.includes(kena)) break;
        const idx = L.findIndex((x) => x.sasaran.includes(kena));
        if (idx < s) { toast(`${L[idx].label} sudah dikenal pasti. Seterusnya: ${L[s].nama}.`, WARNA.neon); continue; }
        salah(`Belum lagi! Tenaga sampai ke ${L[s].label} sebelum ${L[idx].label}.`);
        if (++bilSalah >= 2) tunjukPenunjuk(L[s].sasaran[0], 3);
      }
      tunjukPenunjuk(null);
      betul(`${L[s].label} — BETUL!`, L[s].sasaran[0]);
      fakta(L[s].fakta);
      cip(s, KEADAAN.Siap, L[s].label);
      labelTerbuka.add(KD.LABEL_MISI1[s]);
      if (s + 1 < L.length) cip(s + 1, KEADAAN.Semasa, L[s + 1].label);
      hud.garis((s + 1) / L.length);
      sibuk = true;
      await alirkanTenaga(aliranHingga, L[s].hingga, t);
      if (!aktif(t)) return;
      aliranHingga = L[s].hingga;
      sibuk = false;
      if (s === L.length - 1) { tvHidup = true; setKuasa('A', true, true); }
      if (!(await tunggu(0.4, t))) return;
    }
    await tamatMisi('Aliran lengkap: Pencawang → Talian Agihan → Meter → DB → Litar Akhir → Beban.', t);
  }

  async function alirkanTenaga(dari, hingga, t) {
    const r = 0.0018 * k;
    if (dari < 0) {
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), bahanAliran);
      bola.position.copy(titikAliran(0)); bola.scale.setScalar(r * 5);
      fokus.add(bola); sementara.push(bola);
      dari = 0;
    }
    for (let i = dari; i < hingga; i++) {
      const a = titikAliran(i), b = titikAliran(i + 1);
      const seg = segmen(a, a.clone().add(new THREE.Vector3(0, 1e-5, 0)), r, bahanAliran); sementara.push(seg);
      const durasi = Math.max(0.15, Math.min(0.6, a.distanceTo(b) / (0.45 * k)));
      await m.animasi(durasi, (q) => letakSegmen(seg, a, a.clone().lerp(b, q), r));
      if (!aktif(t)) return;
      letakSegmen(seg, a, b, r);
    }
  }

  /** Zarah bercahaya bergerak di sepanjang laluan yang sudah menyala (gambaran arus). */
  function zarahAliran(t) {
    const zarah = [];
    for (let i = 0; i < 4; i++) {
      const z = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), bahanSorot);
      z.scale.setScalar(0.006 * k); z.visible = false;
      fokus.add(z); sementara.push(z); zarah.push(z);
    }
    let w = 0;
    m.setiap((dt) => {
      if (!aktif(t) || misi !== 0) return false;
      w += dt;
      const n = aliranHingga;
      zarah.forEach((z, i) => {
        z.visible = n >= 1;
        if (n < 1) return;
        const u = ((w * 1.6 + (i * n) / zarah.length) % n + n) % n;
        const sg = Math.min(n - 1, Math.floor(u));
        z.position.lerpVectors(titikAliran(sg), titikAliran(sg + 1), u - sg);
      });
    });
  }

  // ================================================================ MISI 2 — rumah gelap
  async function misi2(t) {
    masa(true);
    setKuasa('B', false);
    fokuskan('rumahB');
    const punca = Math.floor(Math.random() * 3);   // 0 MCB trip, 1 suis rosak, 2 sambungan putus
    if (punca === 0) togolSegera('Togol_B_MCB', false);
    if (punca === 1) { tunjuk('Suis_B', false); tunjuk('Suis_B_Rosak', true); }
    if (punca === 2) { tunjuk('Talian_Servis_B', false); tunjuk('Talian_Servis_B_Putus', true); }
    const label = ['MCB', 'SUIS', 'SAMBUNGAN', 'NYALA'];
    susunCip(4);
    for (let i = 0; i < 4; i++) cip(i, i < 3 ? KEADAAN.Semasa : KEADAAN.Terkunci, label[i]);
    arahan('PERIKSA', 'Rumah B gelap! Ketik untuk periksa: kotak agihan (MCB), suis lampu dan sambungan talian servis.', WARNA.salah);
    fakta('Cara sistematik: periksa dari yang paling mudah dan selamat — kotak agihan, kemudian suis, kemudian sambungan.');
    if (!(await tunggu(0.6, t))) return;
    const calon = [['DB_B', 'Togol_B_MCB'], ['Suis_B', 'Suis_B_Rosak'], ['Sambungan_B', 'Talian_Servis_B', 'Talian_Servis_B_Putus']];
    const normal = ['MCB dalam kotak agihan berada pada kedudukan ON — normal.', 'Suis lampu berfungsi dengan baik — normal.', 'Sambungan talian servis kemas dan ketat — normal.'];
    const diperiksa = new Set();
    let j;
    for (;;) {
      const kena = await tungguKetik(calon.flat(), () => toast('Ketik kotak agihan, suis atau sambungan talian rumah B.', WARNA.neon, 1.8), 0.06);
      if (!aktif(t)) return;
      j = calon.findIndex((c) => c.includes(kena));
      diperiksa.add(j);
      if (j === punca) break;
      toast(normal[j], WARNA.neon, 2.4);
      denyut(calon[j][0], 1);
      cip(j, KEADAAN.Siap, label[j] + ' OK');
    }
    kesilapan = Math.max(0, diperiksa.size - 2) * 2;
    cip(j, KEADAAN.Semasa, 'PUNCA!');
    if (punca === 0) {
      toast('PUNCA DITEMUI: MCB TRIP!', WARNA.emas, 2.4);
      arahan('BAIKI', 'MCB trip. Ketik kotak agihan sekali lagi untuk set semula MCB (ON).', WARNA.emas);
      fakta('MCB trip kerana beban lebih atau litar pintas. Sebelum set semula, pastikan punca sudah diatasi.');
      if (!(await tungguKetik(calon[0]))) return;
      await togol('Togol_B_MCB', true);
    } else if (punca === 1) {
      toast('PUNCA DITEMUI: SUIS ROSAK (TERBAKAR)!', WARNA.emas, 2.4);
      arahan('BAIKI', 'Suis terbakar. Ketik suis untuk menggantikannya dengan suis baharu.', WARNA.emas);
      fakta('Suis rosak memutuskan litar. MATIKAN bekalan di kotak agihan sebelum menggantikan suis.');
      if (!(await tungguKetik(calon[1]))) return;
      tunjuk('Suis_B_Rosak', false); tunjuk('Suis_B', true);
      denyut('Suis_B', 1);
    } else {
      toast('PUNCA DITEMUI: TALIAN SERVIS TERPUTUS!', WARNA.emas, 2.4);
      arahan('LAPOR', 'JANGAN sentuh talian terputus! Ketik sambungan untuk melaporkan kepada pembekal elektrik.', WARNA.salah);
      fakta('Talian servis terputus sangat berbahaya. Jauhkan diri dan laporkan kepada pembekal — juruteknik bertauliah akan menyambung semula.');
      if (!(await tungguKetik(calon[2]))) return;
      toast('Laporan dihantar — juruteknik menyambung semula talian.', WARNA.neon, 2.2);
      if (!(await tunggu(1.2, t))) return;
      tunjuk('Talian_Servis_B_Putus', false); tunjuk('Talian_Servis_B', true);
    }
    if (!aktif(t)) return;
    cip(j, KEADAAN.Siap, label[j]); cip(3, KEADAAN.Siap, label[3]);
    setKuasa('B', true, true);
    betul('RUMAH B MENYALA SEMULA!', 'Tingkap_B');
    if (!(await tunggu(1.2, t))) return;
    await tamatMisi('Punca dikenal pasti dengan pemeriksaan tersusun dan dibaiki dengan selamat.', t);
  }

  // ================================================================ MISI 3 — wiring (seret kabel antara terminal)
  const sambungan = new Set();
  let peringkat = 1, terminalMula = null, terminalSasaran = null, pegangKabel = false, posMulaKabel = null;
  let pratonton = null, hujungLicin = new THREE.Vector3(), hujungAda = false;
  const kunci = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const HAD_MULA = 0.06, HAD_MAGNET = 0.09;

  const bilSiapLampu = () => {
    let n = 0;
    if ([...sambungan].some((x) => x.includes('T_DB_L1') && x.includes('T_Suis_'))) n++;
    if ([...sambungan].some((x) => x.includes('T_Lampu_L') && x.includes('T_Suis_'))) n++;
    if (sambungan.has(kunci('T_DB_N', 'T_Lampu_N'))) n++;
    if (sambungan.has(kunci('T_DB_E', 'T_Lampu_E'))) n++;
    return n;
  };
  const bilSiapSoket = () => [kunci('T_DB_L2', 'T_Soket_L'), kunci('T_DB_N', 'T_Soket_N'), kunci('T_DB_E', 'T_Soket_E')].filter((x) => sambungan.has(x)).length;

  async function misi3(t) {
    sambungan.clear(); peringkat = 1;
    setKuasa('A', false); tvHidup = false; kemaskiniCahayaBangunan();
    fokuskan('dindingA');
    const label = ['L1→SUIS', 'SUIS→LAMPU', 'N LAMPU', 'E LAMPU', 'UJI LAMPU', 'SOKET'];
    susunCip(6);
    for (let i = 0; i < 6; i++) cip(i, i < 4 ? KEADAAN.Semasa : KEADAAN.Terkunci, label[i]);
    arahan('LAMPU', 'Seret kabel dari terminal ke terminal (atau ketik terminal pertama, kemudian ketik terminal kedua). Litar lampu: L1 → Suis → Lampu (L), N → Lampu N, E → Lampu E.', WARNA.emas);
    fakta('Warna kabel di Malaysia: COKLAT = Hidup (L), BIRU = Neutral (N), HIJAU-KUNING = Bumi (E).');
    seretMula = mulaSeretKabel; seretGerak = gerakSeretKabel; seretTamat = tamatSeretKabel;
    if (!(await tungguSyarat(() => bilSiapLampu() >= 4)) || !aktif(t)) return;
    seretMula = null;
    cip(4, KEADAAN.Semasa, label[4]);
    arahan('UJI', 'Litar lampu lengkap! Ketik SUIS di dinding untuk menguji lampu.', WARNA.betul);
    if (!(await tungguKetik(['Suis_A'], () => toast('Ketik suis lampu (antara DB dan lampu).', WARNA.neon, 1.8), 0.06))) return;
    setKuasa('A', true, true);
    betul('LAMPU MENYALA! Litar lampu betul.', 'Kaca_A');
    fakta('Suis memutuskan wayar HIDUP (L). Bila suis OFF, lampu langsung tiada voltan — selamat untuk tukar mentol.');
    cip(4, KEADAAN.Siap, label[4]);
    if (!(await tunggu(1.2, t))) return;
    peringkat = 2;
    cip(5, KEADAAN.Semasa, 'SOKET 0/3');
    arahan('SOKET', 'Sekarang litar soket (MCB 20A): L2 → Soket L, N → Soket N, E → Soket E.', WARNA.emas);
    seretMula = mulaSeretKabel;
    if (!(await tungguSyarat(() => { cip(5, KEADAAN.Semasa, `SOKET ${bilSiapSoket()}/3`); return bilSiapSoket() >= 3; })) || !aktif(t)) return;
    seretMula = null;
    cip(5, KEADAAN.Siap, 'SOKET 3/3');
    tvHidup = true; kemaskiniCahayaBangunan();
    betul('SOKET BERFUNGSI — TV hidup!', 'SkrinTV_A');
    fakta('Soket mesti ada wayar Bumi (E): jika berlaku kebocoran, arus mengalir ke bumi dan RCCB trip — pengguna selamat.');
    if (!(await tunggu(1.5, t))) return;
    fokuskan('rumahA');
    await tamatMisi('Litar lampu dan litar soket disambung dengan betul mengikut warna kabel.', t);
  }

  function normalDinding() {
    const n = obj('Normal_DindingA'), f = obj('Fokus_DindingA');
    if (n && f) return fokus.worldToLocal(n.getWorldPosition(new THREE.Vector3())).sub(fokus.worldToLocal(f.getWorldPosition(new THREE.Vector3()))).normalize();
    return new THREE.Vector3(0, 0, 1);
  }
  const bahanKabel = (j) => bahanWayar[j] || bahanWayar.L;

  /** Titik lengkung kabel kendur dari a ke b (ruang fokus), sedikit terkeluar dari dinding. */
  function titikKabel(a, b, bil = 10) {
    const n = normalDinding(), hasil = [];
    a = a.clone().addScaledVector(n, 0.003 * k); b = b.clone().addScaledVector(n, 0.003 * k);
    const jarak = a.distanceTo(b);
    for (let i = 0; i <= bil; i++) {
      const q = i / bil, bentuk = 4 * q * (1 - q);
      hasil.push(a.clone().lerp(b, q).add(new THREE.Vector3(0, -bentuk * jarak * 0.18, 0)).addScaledVector(n, bentuk * 0.004 * k));
    }
    return hasil;
  }

  function binaKabel(titik, bahan, lama = null) {
    const lengkung = new THREE.CatmullRomCurve3(titik);
    const g = new THREE.TubeGeometry(lengkung, titik.length * 2, 0.0011 * k, 6, false);
    if (lama) { lama.geometry.dispose(); lama.geometry = g; lama.material = bahan; return lama; }
    const mesh = new THREE.Mesh(g, bahan);
    mesh.userData.milikSendiri = true;
    fokus.add(mesh);
    return mesh;
  }

  function batalPegangKabel() {
    hujungAda = false;
    if (pratonton) { fokus.remove(pratonton); pratonton.geometry.dispose(); pratonton = null; }
    terminalMula = null; terminalSasaran = null; pegangKabel = false;
  }

  function mulaSeretKabel(x, y) {
    if (pegangKabel) {
      const a = terminalMula;
      const kena = cariSasaran(x, y, KD.TERMINAL, HAD_MULA);
      if (kena === a) { batalPegangKabel(); toast('Kabel dilepaskan.', WARNA.neon, 1.2); return false; }
      const b = kena || cariSasaran(x, y, KD.TERMINAL.filter((z) => z !== a), HAD_MAGNET);
      if (!b) return false;   // ketik tempat kosong: kabel kekal dipegang (boleh putar kampung)
      batalPegangKabel();
      nilaiSambungan(a, b);
      return false;
    }
    const tm = cariSasaran(x, y, KD.TERMINAL, HAD_MULA);
    if (!tm) return false;
    terminalMula = tm; terminalSasaran = null; posMulaKabel = { x, y }; hujungAda = false;
    if (pratonton) { fokus.remove(pratonton); pratonton = null; }
    toast(KD.namaTerminal(tm), WARNA.neon, 1.4);
    denyut(tm, 0.6);
    gerakSeretKabel(x, y);
    return true;
  }

  function gerakSeretKabel(x, y) {
    if (!terminalMula) return;
    const jauh = Math.hypot(x - posMulaKabel.x, y - posMulaKabel.y) > el.clientHeight * 0.03;
    const sasaran = jauh ? cariSasaran(x, y, KD.TERMINAL.filter((z) => z !== terminalMula), HAD_MAGNET) : null;
    if (sasaran && sasaran !== terminalSasaran) toast('→ ' + KD.namaTerminal(sasaran), WARNA.emas, 0.9);
    terminalSasaran = sasaran;
    let hujung;
    if (sasaran) hujung = pusatFokus(sasaran);   // magnet: hujung kabel melekat pada terminal
    else {
      const n = normalDinding().transformDirection(fokus.matrixWorld);
      const satah = new THREE.Plane().setFromNormalAndCoplanarPoint(n, pusatDunia(terminalMula));
      const h = new THREE.Vector3();
      if (!sinar(x, y).intersectPlane(satah, h)) return;
      hujung = fokus.worldToLocal(h);
    }
    // Hujung kabel mengekori jari secara licin, lebih laju apabila melekat pada terminal.
    if (!hujungAda) { hujungLicin.copy(pusatFokus(terminalMula)); hujungAda = true; }
    hujungLicin.lerp(hujung, 1 - Math.exp(-(sasaran ? 22 : 14) * (1 / 30)));
    pratonton = binaKabel(titikKabel(pusatFokus(terminalMula), hujungLicin, 18), bahanKabel(KD.jenisTerminal(terminalMula)), pratonton);
  }

  function tamatSeretKabel(x, y) {
    const a = terminalMula;
    if (!a || x < -1000) { batalPegangKabel(); return; }
    if (Math.hypot(x - posMulaKabel.x, y - posMulaKabel.y) < el.clientHeight * 0.03) {
      // ketik sahaja (tanpa seret): pegang kabel, tunggu ketikan terminal kedua
      pegangKabel = true;
      toast(KD.namaTerminal(a) + ' dipilih — ketik terminal kedua.', WARNA.emas, 2);
      return;
    }
    const b = terminalSasaran || cariSasaran(x, y, KD.TERMINAL.filter((z) => z !== a), HAD_MAGNET);
    batalPegangKabel();
    if (!b) { toast('Lepaskan kabel dekat terminal lain.', WARNA.neon, 1.6); return; }
    nilaiSambungan(a, b);
  }

  const ada = (a, b, x) => a === x || b === x;
  const suisDari = (a, b) => (a.startsWith('T_Suis_') ? a : b.startsWith('T_Suis_') ? b : null);
  const peranti = (x) => (x.startsWith('T_DB') ? 'DB' : x.startsWith('T_Suis') ? 'Suis' : x.startsWith('T_Lampu') ? 'Lampu' : 'Soket');

  function penerangan(a, b) {
    const ja = KD.jenisTerminal(a), jb = KD.jenisTerminal(b);
    const s = suisDari(a, b);
    if (s) {
      const lain = s === a ? b : a;
      if (lain.startsWith('T_Suis_')) return 'Menyambung dua terminal suis bersama akan memintas suis — lampu tidak boleh dimatikan!';
      if (KD.jenisTerminal(lain) === 'N') return 'Suis mesti memutuskan wayar HIDUP (L), bukan Neutral — jika tidak, lampu masih bertenaga walaupun suis OFF.';
      if (KD.jenisTerminal(lain) === 'E') return 'Wayar Bumi (E) tidak boleh melalui suis — ia terus ke terminal bumi peranti.';
      if (lain === 'T_DB_L2') return 'Litar lampu menggunakan MCB 6A (L1). L2 (MCB 20A) adalah untuk litar soket.';
      if (lain.startsWith('T_Soket')) return 'Soket tidak disambung melalui suis lampu — soket mempunyai suisnya sendiri.';
    }
    if (peranti(a) === peranti(b)) return 'Menyambung dua terminal pada peranti yang sama menyebabkan LITAR PINTAS!';
    if (ada(a, b, 'T_DB_L1') && ada(a, b, 'T_Lampu_L')) return 'Wayar L dari MCB mesti melalui SUIS dahulu: L1 → Suis → Lampu.';
    if (ada(a, b, 'T_DB_L1') && (a.startsWith('T_Soket') || b.startsWith('T_Soket'))) return 'Soket perlu litar sendiri dari MCB 20A (L2) — MCB 6A akan trip.';
    if (ada(a, b, 'T_DB_L2') && (a.startsWith('T_Lampu') || b.startsWith('T_Lampu'))) return 'L2 (MCB 20A) untuk soket. Lampu disambung dari L1 melalui suis.';
    if ((peranti(a) === 'Lampu' && peranti(b) === 'Soket') || (peranti(a) === 'Soket' && peranti(b) === 'Lampu')) return 'Sambung setiap peranti terus ke DB, bukan dari lampu ke soket.';
    if (ja !== jb) return `Padankan konduktor: ${ja} mesti ke ${ja}, bukan ke ${jb}. Salah sambung boleh menyebabkan renjatan atau litar pintas.`;
    return 'Sambungan itu tidak betul. Ikut rajah: L → Suis → Lampu, N → N, E → E.';
  }

  function nilaiSambungan(a, b) {
    const kk = kunci(a, b);
    if (sambungan.has(kk)) { toast('Kabel ini sudah disambung.', WARNA.neon, 1.6); return; }
    const s = suisDari(a, b);
    const lampu = kk === kunci('T_DB_N', 'T_Lampu_N') || kk === kunci('T_DB_E', 'T_Lampu_E') || (ada(a, b, 'T_DB_L1') && s) || (ada(a, b, 'T_Lampu_L') && s);
    const soket = kk === kunci('T_DB_L2', 'T_Soket_L') || kk === kunci('T_DB_N', 'T_Soket_N') || kk === kunci('T_DB_E', 'T_Soket_E');
    if (lampu && s) {
      // Satu terminal suis untuk L masuk (dari DB), satu lagi untuk L keluar (ke lampu).
      const hujung = ada(a, b, 'T_DB_L1') ? 'T_DB_L1' : 'T_Lampu_L';
      if ([...sambungan].some((x) => x.split('|').includes(hujung) && x.includes('T_Suis_'))) { toast('Kabel ini sudah disambung ke suis.', WARNA.neon, 1.6); return; }
      if ([...sambungan].some((x) => x.split('|').includes(s))) { salah('Terminal suis ini sudah digunakan — sambung ke terminal suis yang satu lagi.', false); return; }
    }
    if (soket && peringkat === 1) { toast('Siapkan litar LAMPU dahulu, kemudian litar soket.', WARNA.neon, 2); return; }
    if (lampu && peringkat === 2) { toast('Litar lampu sudah lengkap.', WARNA.neon, 1.6); return; }
    if (!lampu && !soket) { salah(penerangan(a, b)); return; }
    sambungan.add(kk);
    const j = KD.jenisTerminal(a) === 'L' || KD.jenisTerminal(b) === 'L' ? 'L' : KD.jenisTerminal(a);
    sementara.push(binaKabel(titikKabel(pusatFokus(a), pusatFokus(b)), bahanKabel(j)));
    K.bunyiBetul();
    kesanBetul(zk, pusatModel(b), 1);
    toast(`BETUL! Kabel ${j === 'N' ? 'BIRU (Neutral)' : j === 'E' ? 'HIJAU-KUNING (Bumi)' : 'COKLAT (Hidup)'} disambung.`, WARNA.betul, 2);
    if (peringkat === 1) {
      const sp = [...sambungan];
      const siap = [sp.some((x) => x.includes('T_DB_L1') && x.includes('T_Suis_')), sp.some((x) => x.includes('T_Lampu_L') && x.includes('T_Suis_')),
        sambungan.has(kunci('T_DB_N', 'T_Lampu_N')), sambungan.has(kunci('T_DB_E', 'T_Lampu_E'))];
      ['L1→SUIS', 'SUIS→LAMPU', 'N LAMPU', 'E LAMPU'].forEach((l, i) => cip(i, siap[i] ? KEADAAN.Siap : KEADAAN.Semasa, l));
      hud.garis(bilSiapLampu() / 9);
    } else hud.garis((5 + bilSiapSoket()) / 9);
  }

  // ================================================================ MISI 4 — pilih perlindungan
  async function misi4(t) {
    const SN = KD.SENARIO;
    susunCip(SN.length);
    SN.forEach((x, i) => cip(i, i === 0 ? KEADAAN.Semasa : KEADAAN.Terkunci, x.label));
    for (let s = 0; s < SN.length; s++) {
      const sc = SN[s];
      fokuskan(sc.fokus);
      arahan('PILIH', sc.soalan, WARNA.emas);
      elPilihan.hidden = false; K.pop(elPilihan);
      butangPilihan.forEach((b, i) => { b.hidden = i >= sc.pilihan.length; b.disabled = false; b.textContent = sc.pilihan[i] || ''; });
      for (;;) {
        const dipilih = await new Promise((selesai) => { pilihanFn = selesai; batalTunggu.push(() => selesai(-1)); });
        if (!aktif(t) || dipilih < 0) return;
        if (dipilih === sc.betul) break;
        butangPilihan[dipilih].disabled = true;
        salah(sc.penerangan[dipilih]);
        fakta(sc.penerangan[dipilih]);
      }
      pilihanFn = null;
      elPilihan.hidden = true;
      betul(`${sc.pilihan[sc.betul]} — BETUL!`);
      fakta(sc.penerangan[sc.betul]);
      cip(s, KEADAAN.Siap, sc.label);
      if (s + 1 < SN.length) cip(s + 1, KEADAAN.Semasa, SN[s + 1].label);
      hud.garis((s + 1) / SN.length);
      if (!(await tunggu(3.2, t))) return;
    }
    fokuskan('kampung');
    await tamatMisi('MCB melindungi kabel, RCD melindungi nyawa, RCBO melindungi kedua-duanya.', t);
  }
  butangPilihan.forEach((b, i) => { b.onclick = () => { K.bunyiKetik(); if (pilihanFn) pilihanFn(i); }; });

  // ================================================================ MISI 5 — cari bahaya (+ HINT A/B/C)
  let hintDipakai = 0, bakiHint = null, hintDijawab = null, rutinCahaya = null;
  const bahanHint = [];          // { mesh, asal }
  const tagHint = [];            // { el, objek }

  async function misi5(t) {
    const B = KD.BAHAYA;
    fokuskan('kampung');
    susunCip(B.length);
    B.forEach((_, i) => cip(i, KEADAAN.Semasa, '?'));
    arahan('CARI', `Ada ${B.length} bahaya elektrik tersembunyi di kampung ini. Zum dan pusing kampung, kemudian ketik setiap bahaya! Buntu? Tekan HINT.`, WARNA.salah);
    const baki = B.map((x) => x.objek);
    let jumpa = 0, terlepas = 0;
    hintDipakai = 0; bakiHint = baki; bHint.hidden = false;
    while (baki.length) {
      const kena = await new Promise((selesai) => {
        hintDijawab = selesai;
        batalTunggu.push(() => selesai(null));
        ketikFn = (x, y) => {
          const s = cariSasaran(x, y, baki, 0.025);
          if (s) { selesai(s); return; }
          terlepas++;
          toast(terlepas % 3 === 0 ? 'Susah? Tekan butang HINT di sebelah kanan.' : 'Kawasan itu selamat. Teruskan mencari!', terlepas % 3 === 0 ? WARNA.emas : WARNA.neon, 1.8);
        };
      });
      ketikFn = null; hintDijawab = null;
      if (!aktif(t) || !kena) return;
      tutupSoalanHint();
      baki.splice(baki.indexOf(kena), 1);
      if (baki.length) arahan('CARI', `Baki ${baki.length} bahaya lagi. Teruskan mencari — buntu? Tekan HINT.`, WARNA.salah);
      const bh = B.find((x) => x.objek === kena);
      tunjukPenunjuk(null);
      betul(`BAHAYA DITEMUI: ${bh.label}!`, kena);
      fakta(bh.penerangan);
      denyut(kena, 2);
      cip(jumpa, KEADAAN.Siap, bh.label);
      jumpa++;
      hud.garis(jumpa / B.length);
      if (!(await tunggu(0.6, t))) return;
    }
    kesilapan = Math.floor(terlepas / 4) + hintDipakai;   // setiap HINT kurangkan 5 XP
    sorokHint();
    fokuskan('kampung');
    if (!(await tunggu(2.5, t))) return;
    await tamatMisi('Semua bahaya dikesan! Laporkan bahaya elektrik — jangan cuba baiki sendiri.', t);
  }

  function sorokHint() { hintDijawab = null; tutupSoalanHint(); bHint.hidden = true; bakiHint = null; }

  bHint.onclick = () => {
    K.bunyiKetik();
    if (!bakiHint || !bakiHint.length || sibuk) return;
    const n = bakiHint[hintDipakai % bakiHint.length];
    hintDipakai++;
    tutupSoalanHint();
    // dua objek selamat paling hampir dengan bahaya (berjarak antara satu sama lain)
    const pb = pusatFokus(n);
    const pilih = [];
    for (const c of KD.PENGACAU_SELAMAT.filter((x) => obj(x) && nampak(obj(x))).sort((a, b) => pusatFokus(a).distanceTo(pb) - pusatFokus(b).distanceTo(pb))) {
      const pc = pusatFokus(c);
      if (pc.distanceTo(pb) < 0.02 * k || pilih.some((x) => pusatFokus(x).distanceTo(pc) < 0.02 * k)) continue;
      pilih.push(c);
      if (pilih.length === 2) break;
    }
    pilih.push(n);
    const objek = pilih.sort(() => Math.random() - 0.5);
    const betulI = objek.indexOf(n);
    // kamera zum supaya ketiga-tiga objek kelihatan
    const tengah = new THREE.Vector3(); for (const x of objek) tengah.add(pusatFokus(x)); tengah.divideScalar(objek.length);
    const jejari = Math.max(...objek.map((x) => pusatFokus(x).distanceTo(tengah))) / k;
    titikS = tengah; zumS = Math.max(1.2, Math.min(3, 0.88 / (2.6 * Math.max(0.02, jejari)))); condongS = 32;
    condongP = 0; zumP = 1;
    // cahaya berdenyut + tanda A/B/C pada setiap objek
    const huruf = ['A', 'B', 'C'];
    objek.forEach((x, i) => {
      const e = document.createElement('div');
      e.className = 'k-tag'; e.textContent = huruf[i];
      lapisanLabel.appendChild(e);
      tagHint.push({ el: e, objek: x });
      obj(x).traverse((q) => { if (q.isMesh) { const asal = q.material; q.material = asal.clone(); bahanHint.push({ mesh: q, asal, salinan: q.material, warna: asal.color.clone() }); } });
    });
    let w = 0;
    rutinCahaya = m.setiap((dt) => {
      w += dt;
      const s = 0.5 - 0.5 * Math.cos(w * Math.PI * 1.4);   // denyut perlahan & lembut
      for (const b of bahanHint) b.salinan.color.copy(b.warna).lerp(b.warna.clone().multiply(new THREE.Color(1.9, 1.5, 0.55)), s);
    });
    toast('HINT (-5 XP): satu daripada objek bercahaya ini BAHAYA.', WARNA.emas, 2.4);
    arahan('HINT', 'Tiga objek sedang bercahaya. Yang mana satu BAHAYA? Pilih A, B atau C (atau ketik terus objek itu).', WARNA.emas);
    elPilihan.hidden = false; K.pop(elPilihan);
    butangPilihan.forEach((b, i) => { b.hidden = i >= objek.length; b.disabled = false; b.textContent = i < objek.length ? `OBJEK ${huruf[i]}` : ''; });
    pilihanFn = (i) => {
      if (i < 0 || i >= objek.length) return;
      if (i === betulI) { toast('BETUL!', WARNA.betul, 1.2); if (hintDijawab) hintDijawab(n); }
      else { butangPilihan[i].disabled = true; toast(`Objek ${huruf[i]} selamat. Cuba lagi!`, WARNA.salah, 1.8); }
    };
  };

  function tutupSoalanHint() {
    if (rutinCahaya) rutinCahaya.henti();
    rutinCahaya = null;
    for (const b of bahanHint) { b.mesh.material = b.asal; b.salinan.dispose(); }
    bahanHint.length = 0;
    for (const tg of tagHint) tg.el.remove();
    tagHint.length = 0;
    if (misi === 4 && pilihanFn) { pilihanFn = null; elPilihan.hidden = true; }
  }

  // ================================================================ MISI 6 — pulihkan kampung
  async function misi6(t) {
    const G = KD.GANGGUAN;
    masa(true);
    for (const g of G) setKuasa(g.kunci, false);
    togolSegera('Togol_A_RCCB', false);
    togolSegera('Togol_Kedai', false);
    fokuskan('kampung');
    susunCip(G.length + 1);
    cip(0, KEADAAN.Semasa, 'PENCAWANG');
    G.forEach((g, i) => cip(i + 1, KEADAAN.Terkunci, g.label));
    K.kilat(WARNA.salah, 500);
    arahan('TERSUSUN', 'Gangguan serentak! Periksa secara TERSUSUN — mulakan dari punca bekalan: ketik PENCAWANG.', WARNA.salah);
    fakta('Pemeriksaan tersusun: mula dari punca bekalan (hulu) ke arah pengguna (hilir), satu demi satu.');
    const pemilih = G.flatMap((g) => g.pemilih);
    for (;;) {
      const kena = await tungguKetik([...pemilih, 'Pencawang', 'PagarPencawang'], null, 0.04);
      if (!aktif(t)) return;
      if (kena === 'Pencawang' || kena === 'PagarPencawang') break;
      salah('Mula dari punca bekalan dahulu — periksa PENCAWANG.');
    }
    fokuskan('pencawang');
    betul('Pencawang NORMAL — bekalan sampai ke kampung. Masalah di pepasangan pengguna.', 'Pencawang');
    cip(0, KEADAAN.Siap, 'PENCAWANG');
    if (!(await tunggu(2.2, t))) return;
    const baki = [...G];
    while (baki.length) {
      fokuskan('kampung');
      arahan('PILIH', 'Ketik bangunan yang gelap untuk diperiksa: ' + baki.map((x) => x.label).join(', ') + '.', WARNA.emas);
      const kena = await tungguKetik(baki.flatMap((g) => g.pemilih), () => toast('Ketik bangunan yang masih gelap.', WARNA.neon, 1.6), 0.03);
      if (!aktif(t)) return;
      const g = baki.find((x) => x.pemilih.includes(kena));
      const ig = G.findIndex((x) => x.kunci === g.kunci);
      cip(ig + 1, KEADAAN.Semasa, g.label);
      fokuskan(g.fokus);
      arahan(g.label.length > 8 ? 'BAIKI' : g.label, g.gejala, WARNA.salah);
      if (!(await tunggu(0.5, t))) return;
      const semuaSasaran = [...new Set(g.langkah.flatMap((l) => l.sasaran))];
      for (let j = 0; j < g.langkah.length; j++) {
        for (;;) {
          const x = await tungguKetik(semuaSasaran, () => toast('Periksa komponen yang berkaitan dengan gangguan ini.', WARNA.neon, 1.6), 0.045, g.langkah[j].sasaran);
          if (!aktif(t)) return;
          if (g.langkah[j].sasaran.includes(x)) break;
          const lain = g.langkah.findIndex((l) => l.sasaran.includes(x));
          if (lain > j) { salah(g.langkah[lain].salahUrutan); await kesanSalahUrutan(g.kunci, lain); }
        }
        await kesanLangkah(g.kunci, j);
        if (!aktif(t)) return;
        betul(g.langkah[j].berjaya, g.langkah[j].sasaran[0]);
        if (!(await tunggu(1.1, t))) return;
      }
      setKuasa(g.kunci, true, true);
      cip(ig + 1, KEADAAN.Siap, g.label);
      baki.splice(baki.indexOf(g), 1);
      hud.garis((G.length - baki.length + 1) / (G.length + 1));
      if (!(await tunggu(1.6, t))) return;
    }
    fokuskan('kampung');
    arahan('PULIH', 'Seluruh kampung menyala semula!', WARNA.betul);
    if (!(await tunggu(1.2, t))) return;
    await tamatMisi('Seluruh kampung pulih — pemeriksaan tersusun, selamat dan teliti!', t);
  }

  async function kesanLangkah(kc, j) {
    switch (kc + j) {
      case 'A0': tunjuk('Cerek_A', false); break;
      case 'A1': await togol('Togol_A_RCCB', true); break;
      case 'Kedai0': tunjuk('Bahaya_SoketBebanLebih', false); break;
      case 'Kedai1': await togol('Togol_Kedai', true); break;
      case 'Dewan0': await togol('Togol_Dewan', false); break;
      case 'Dewan1': await denyut('Sambungan_Dewan', 1.5); break;
      case 'Dewan2': await togol('Togol_Dewan', true); break;
      case 'Jalan0': await denyut('KotakFius_Tiang', 1.5); break;
      default: break;
    }
  }
  /** Langkah dibuat terlalu awal: peranti perlindungan trip semula. */
  async function kesanSalahUrutan(kc, lain) {
    const tg = kc === 'A' ? 'Togol_A_RCCB' : kc === 'Kedai' ? 'Togol_Kedai' : null;
    if (tg && lain === 1) { await togol(tg, true); await m.tunggu(0.25); await togol(tg, false); }
  }

  // ================================================================ label terapung
  let labelHidup = true, modLabel = 'Semua';
  const labelTerbuka = new Set();
  const label = KD.SENARAI_LABEL.map(([kunciL, teks, objek, objek2, kecil]) => {
    const kotakEl = document.createElement('div'); kotakEl.className = 'k-label' + (kecil ? ' kecil' : ''); kotakEl.textContent = teks;
    const garis = document.createElement('i'); garis.className = 'k-garis';
    const titik = document.createElement('b'); titik.className = 'k-titik';
    lapisanLabel.append(garis, titik, kotakEl);
    return { kunci: kunciL, objek, objek2, kecil, kotakEl, garis, titik, pos: { x: 0, y: 0 } };
  });
  const kemasButangLabel = () => { bLabel.textContent = labelHidup ? 'LABEL: ON' : 'LABEL: OFF'; };
  bLabel.onclick = () => { K.bunyiKetik(); labelHidup = !labelHidup; kemasButangLabel(); };
  kemasButangLabel();

  function titikLabel(l) {
    if (l.objek2 && obj(l.objek) && obj(l.objek2)) return obj(l.objek).getWorldPosition(new THREE.Vector3()).add(obj(l.objek2).getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    const t = obj(l.objek); if (!t) return null;
    const b = kotak(l.objek);
    if (b.isEmpty()) return t.getWorldPosition(new THREE.Vector3());
    const c = b.getCenter(new THREE.Vector3());
    c.y += (b.max.y - c.y) * (l.kecil ? 1 : 0.8);
    return t.localToWorld(c);
  }

  function kemaskiniLabel(dt = 1 / 60) {
    const zum = zumK * zumP;
    const kampungNampak = tempat && tempat.nampak;
    const aktifL = [];
    for (const l of label) {
      const t = obj(l.objek);
      let boleh = kampungNampak && t && nampak(t) && labelHidup && modLabel !== 'Tiada' && (modLabel === 'Semua' || labelTerbuka.has(l.kunci))
        && (!l.kecil || zum >= 1.8) && (l.kecil || zum < 2.2) && (elPanelMisi.hidden || !l.kecil);   // zum dekat: label komponen sahaja
      let s = null;
      if (boleh) { const p = titikLabel(l); s = p && keSkrin(p); boleh = !!s && s.z < 1 && s.x > -50 && s.x < el.clientWidth + 50 && s.y > 0 && s.y < el.clientHeight; }
      if (!boleh) { l.kotakEl.style.display = l.garis.style.display = l.titik.style.display = 'none'; l.licin = null; continue; }
      l.tx = s.x; l.ty = s.y;
      l.pos = { x: s.x, y: s.y - (l.kecil ? 28 : 36) };
      l.w = l.kotakEl.offsetWidth || 90; l.h = l.kotakEl.offsetHeight || 22;
      aktifL.push(l);
    }
    // Elak label bertindih: tolak ke atas label yang bertembung (diisih dari bawah).
    // Histeresis: pasangan yang sudah ditolak kekal ditolak sehingga jaraknya jelas melebihi had,
    // supaya label tidak melompat-lompat bila dua label hampir-hampir bertindih.
    aktifL.sort((a, b) => b.pos.y - a.pos.y);
    for (const l of aktifL) { l.tolakLama = l.tolak || new Set(); l.tolak = new Set(); }
    for (let i = 0; i < aktifL.length; i++) for (let j = 0; j < i; j++) {
      const a = aktifL[i], b = aktifL[j];
      const lebih = a.tolakLama.has(b.kunci) ? 10 : 0;
      const lebar = (a.w + b.w) / 2 + 4 + lebih, tinggi = (a.h + b.h) / 2 + 3;
      if (Math.abs(a.pos.x - b.pos.x) < lebar && Math.abs(a.pos.y - b.pos.y) < tinggi + lebih) { a.pos.y = b.pos.y - tinggi; a.tolak.add(b.kunci); }
    }
    // Kotak label dilicinkan (titik kekal tepat pada objek): tolakan "elak bertindih" yang bertukar
    // antara dua kedudukan, dan gangguan kecil penjejakan, tidak lagi kelihatan sebagai getaran.
    const a = 1 - Math.pow(0.0001, dt);
    for (const l of aktifL) {
      if (!l.licin) l.licin = { ...l.pos };
      else { l.licin.x += (l.pos.x - l.licin.x) * a; l.licin.y += (l.pos.y - l.licin.y) * a; }
      l.pos = { x: Math.round(l.licin.x * 2) / 2, y: Math.round(l.licin.y * 2) / 2 };
      l.kotakEl.style.display = l.garis.style.display = l.titik.style.display = '';
      l.kotakEl.style.transform = `translate(${l.pos.x - l.w / 2}px, ${l.pos.y - l.h / 2}px)`;
      l.titik.style.transform = `translate(${l.tx - 3.5}px, ${l.ty - 3.5}px)`;
      const bx = l.pos.x, by = l.pos.y + l.h / 2, dx = bx - l.tx, dy = by - l.ty;
      l.garis.style.width = Math.hypot(dx, dy) + 'px';
      l.garis.style.transform = `translate(${l.tx}px, ${l.ty}px) rotate(${Math.atan2(dy, dx)}rad)`;
    }
    // tanda HINT A/B/C
    for (const tg of tagHint) {
      const t = obj(tg.objek), b = kotak(tg.objek);
      const c = b.isEmpty() ? new THREE.Vector3() : b.getCenter(new THREE.Vector3()); if (!b.isEmpty()) c.y = b.max.y;
      const s = keSkrin(t.localToWorld(c));
      const ok = kampungNampak && s.z < 1;
      tg.el.style.display = ok ? '' : 'none';
      if (ok) tg.el.style.transform = `translate(${s.x - 21}px, ${s.y - 52 - 4 * Math.sin(m.masa * 4)}px)`;
    }
  }

  // ================================================================ butang
  bMisi.onclick = () => {
    K.bunyiKetik();
    if (!model || !mula) return;
    // Ketika tiada misi berjalan, butang MISI menutup/membuka panel supaya kampung boleh dilihat penuh.
    if (misi < 0 && !elPanelMisi.hidden) { elPanelMisi.hidden = true; arahan('KAMPUNG', 'Tekan MISI untuk memilih misi.', WARNA.emas); }
    else paparPanelMisi();
  };
  bPandangan.onclick = () => { K.bunyiKetik(); setSemulaPandangan(); };
  el.querySelector('.k-tamat-misi').onclick = () => { K.bunyiKetik(); elTamat.hidden = true; paparPanelMisi(); };

  // ================================================================ input
  const sentuh = pasangSentuh({
    turun(x, y) {
      sentuhAktif = !!model && mula; posMula = { x, y }; posSebelum = { x, y }; memutar = false; menyeret = false;
      if (sentuhAktif && !sibuk && seretMula && seretMula(x, y)) menyeret = true;
    },
    gerak(x, y) {
      if (!sentuhAktif) return;
      if (menyeret) { if (seretGerak) seretGerak(x, y); }
      else {
        if (!memutar && Math.hypot(x - posMula.x, y - posMula.y) > el.clientHeight * 0.02) memutar = true;
        if (memutar) {
          yawP += (x - posSebelum.x) * 180 / el.clientWidth;
          condongP = Math.max(-40, Math.min(40, condongP + (y - posSebelum.y) * 60 / el.clientHeight));
        }
      }
      posSebelum = { x, y };
    },
    naik(x, y) {
      if (!sentuhAktif) return;
      sentuhAktif = false;
      if (menyeret) { menyeret = false; if (seretTamat) seretTamat(x, y); return; }
      if (memutar || sibuk) return;
      if (ketikFn) ketikFn(x, y);
    },
    batal() { if (menyeret) { menyeret = false; if (seretTamat) seretTamat(-9999, -9999); } sentuhAktif = false; },
    cubitMula() { zumCubitAsal = zumP; sentuhAktif = false; },
    cubit(nisbah) { zumP = Math.max(0.6, Math.min(3.2, zumCubitAsal * nisbah)); },
    roda(d) { zumP = Math.max(0.6, Math.min(3.2, zumP * (1 - Math.sign(d) * 0.1))); },
  });

  // ================================================================ gelung
  let fpsMasa = 0, fpsBingkai = 0;
  const gelapMalam = new THREE.Color(0.10, 0.12, 0.22);
  const pengawal = {
    kemaskini(dt) {
      fpsMasa += dt; fpsBingkai++;
      if (fpsMasa >= 0.5) {
        const fps = fpsBingkai / fpsMasa; fpsMasa = 0; fpsBingkai = 0;
        elFps.textContent = `FPS ${fps.toFixed(0)}`;
        elFps.style.color = fps >= 26 ? '#9f9' : fps >= 18 ? WARNA.emas : WARNA.salah;
      }
      m.kemaskini(dt);
      seragam.masa.value = m.masa;
      if (!tempat) return;
      tempat.kemaskini(dt);
      el.classList.toggle('dikesan', tempat.nampak);
      if (tempat.nampak && !mula) {
        mula = true; sibuk = false;
        K.bunyiBetul();
        arahan('KAMPUNG', 'Seret untuk pusing, cubit untuk zum. Pilih satu misi untuk bermula!', WARNA.emas);
        paparPanelMisi();
      }
      const q = 1 - Math.exp(-dt * 4.5);
      titikK.lerp(titikS, q);
      zumK += (zumS - zumK) * q; condongK += (condongS - condongK) * q; yawK = UBAH_SUDUT(yawK, yawS, q);
      kenakanPandangan();
      if (bahanAir && bahanAir.map) bahanAir.map.offset.set(m.masa * 0.08, Math.sin(m.masa * 1.1) * 0.03);   // air sungai mengalir laju
      const s = tempat.akar.scale.x * zumK * zumP;
      for (const b of BANGUNAN) if (cahaya[b]) cahaya[b].distance = (b === 'Jalan' ? 0.32 : 0.16) * s * k;
      if (Math.abs(malam - malamSasaran) > 1e-3) {
        malam += Math.sign(malamSasaran - malam) * Math.min(Math.abs(malamSasaran - malam), dt / 1.6);
        const c = cahayaSkena();
        if (c) {
          c.arah.intensity = cahayaAsal.arah * (1 - 0.8 * malam); c.isi.intensity = cahayaAsal.isi * (1 - 0.8 * malam);
          c.ambien.intensity = cahayaAsal.ambien * (1 - 0.55 * malam);
          c.ambien.color.copy(cahayaAsal.warnaAmbien).lerp(gelapMalam.clone().multiplyScalar(3), malam);
        }
        kemaskiniCahayaBangunan();
      }
      kemaskiniLabel(dt);
      zk.kemaskini(dt); kilau.kemaskini(dt);
    },
  };

  await ctx.hidupAR(pengawal);
  // Cahaya petang keemasan seperti gambar rujukan.
  const c0 = cahayaSkena();
  const cahayaAsal = { ambien: 1.05, arah: 2.4, isi: 0.55, warnaAmbien: srgb(0.85, 0.85, 0.95) };
  if (c0) {
    c0.ambien.intensity = cahayaAsal.ambien; c0.ambien.color.copy(cahayaAsal.warnaAmbien);
    c0.arah.intensity = cahayaAsal.arah; c0.arah.color.copy(srgb(1, 0.9, 0.74)); c0.arah.position.set(-0.7, 1.2, 0.9);
    c0.isi.intensity = cahayaAsal.isi; c0.isi.color.copy(srgb(0.75, 0.85, 1));
  }
  // Tekstur dimuat sepenuhnya dahulu: bahan mengklonnya dengan ulangan UV berbeza.
  const failTekstur = [...new Set(Object.values(PALET).map((p) => p[5]).filter(Boolean))];
  [model] = await Promise.all([muatModel('Kampung'), ...failTekstur.map((f) => muatTekstur(f, { ulang: true })), muatTekstur('bayang_tanah.png')]);
  if (!m.hidup) return { tamat() {} };
  o = cariSemua(model);
  sediakan();

  function sediakan() {
    // bahan
    _bahanKampung = new Map();
    model.traverse((x) => {
      if (!x.isMesh) return;
      sediakanGeometri(x.geometry);
      const nama = x.material.name;
      if (!_bahanKampung.has(nama)) _bahanKampung.set(nama, binaBahan(nama, seragam));
      x.material = _bahanKampung.get(nama);
    });
    bahanAir = _bahanKampung.get('Kampung_Air') || null;
    bahanKacaMenyala = new THREE.MeshStandardMaterial({ color: srgb(1, 0.97, 0.88), emissive: srgb(1, 0.86, 0.55), emissiveIntensity: 2.2 });
    bahanTingkapMenyala = new THREE.MeshStandardMaterial({ color: srgb(1, 0.85, 0.55), emissive: srgb(1, 0.72, 0.38), emissiveIntensity: 1.1 });
    bahanTV = new THREE.MeshStandardMaterial({ color: srgb(0.1, 0.15, 0.3), emissive: srgb(0.3, 0.5, 1) });
    bahanAliran = new THREE.MeshStandardMaterial({ color: srgb(1, 0.85, 0.2), emissive: srgb(1, 0.75, 0.1), emissiveIntensity: 2.2 });
    bahanSorot = new THREE.MeshStandardMaterial({ color: srgb(1, 0.9, 0.3), emissive: srgb(1, 0.85, 0.2), emissiveIntensity: 2.5 });
    bahanWayar = {
      L: new THREE.MeshStandardMaterial({ color: srgb(0.45, 0.24, 0.10), emissive: srgb(0.12, 0.06, 0.02) }),
      N: new THREE.MeshStandardMaterial({ color: srgb(0.10, 0.28, 0.75), emissive: srgb(0.02, 0.06, 0.18) }),
      E: new THREE.MeshStandardMaterial({ color: srgb(0.45, 0.70, 0.12), emissive: srgb(0.10, 0.16, 0.02) }),
    };
    // hierarki pandangan
    condong = new THREE.Group(); putar = new THREE.Group(); fokus = new THREE.Group();
    condong.add(putar); putar.add(fokus); fokus.add(model);
    tempat = new Penempatan({ lebarModel: 1, lebarSkrin: 0.98, naik: 0.12, pusatSkrin: true, muat: { skrin: document.getElementById('s-kampung'), atas: '.bar-atas, .l-tajuk, .l-subtajuk', bawah: '.hud-panel, .l-pilihan, .k-misi', kanan: '.l-butang-sisi', isi: 0.95 } });
    tempat.pusing.add(condong);
    model.updateMatrixWorld(true);
    const tapak = kotak('Tapak');
    k = tapak.isEmpty() ? 1 : tapak.getSize(new THREE.Vector3()).x;
    tempat.lebarModel = k;
    for (const n of ['Togol_A_RCCB', 'Togol_A_MCB1', 'Togol_A_MCB2', 'Togol_B_MCB', 'Togol_Kedai', 'Togol_Dewan']) { const t = obj(n); if (t) togolAtas.set(t, t.position.clone()); }
    for (const b of BANGUNAN) {
      const titik = obj('TitikCahaya_' + b);
      if (!titik) continue;
      const l = new THREE.PointLight(srgb(1, 0.8, 0.5), b === 'Jalan' ? 2.6 : 2, 0.16, 1.5);
      l.visible = false; titik.add(l); cahaya[b] = l;
    }
    zk = new Zarah(model);
    kilau = new Zarah(model, { maks: 120 });
    const sg = kotak('Sungai');
    if (!sg.isEmpty()) {
      const saiz = sg.getSize(new THREE.Vector3()), p = sg.getCenter(new THREE.Vector3());
      p.y = sg.max.y + 0.0015 * k;
      // Kilauan cahaya kecil yang berkelip di permukaan sungai.
      kilau.berterusan(70, { pos: p, kotak: new THREE.Vector3(saiz.x * 0.98, 0.0005, saiz.z * 0.9), arah: new THREE.Vector3(1, 0, 0), sebar: 0, laju: 0.03 * k,
        hayat: [0.4, 1], saiz: [0.004 * k, 0.009 * k], warna: srgb(1, 1, 0.95), alfa: 0.9, pudarMasuk: 0.3 });
    }
    setSemulaKampung();
    fokuskan('kampung', true);
    daftarUji(tempat.akar);
    if (window.__uji) { window.__uji.segi = segiSkrin; window.__uji.cari = (x, y, calon) => cariSasaran(x, y, calon, 0.045); }
  }

  return {
    tamat() {
      hentiMisi();
      m.henti();
      sentuh.lepas();
      pulihkanCahaya();
      if (tempat) tempat.buang();
      hud.buang();
      lapisanLabel.innerHTML = '';
      elPilihan.hidden = true; elPanelMisi.hidden = true; elTamat.hidden = true; bHint.hidden = true;
      el.classList.remove('dikesan');
    },
  };
}
