// Lapisan AR: kamera + penjejakan imej (MindAR) + kanvas three.js.
//
// MindAR dipilih kerana ia guna getUserMedia + WASM dan JALAN PADA SAFARI iOS. Jangan tukar kepada
// WebXR — Safari iOS tidak menyokongnya, dan iPhone ialah sebab versi web ini wujud.
//
// Penempatan kandungan meniru PenempatanSkrinAR versi Android: kandungan TIDAK dilekatkan terus
// pada penanda. Setiap bingkai ia diletak pada kedudukan penanda, diangkat sedikit ke atas skrin,
// dan diskala supaya menduduki pecahan lebar skrin yang tetap — jadi saiznya sama dan selesa
// tidak kira telefon dekat atau jauh daripada poster.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export { THREE };

const FAIL_PENANDA = 'penanda/penanda.mind';   // indeks 0 = poster, 1 = corak hitam-putih
const TAHAN_SELEPAS_HILANG = 2.5;              // saat kandungan dikekalkan selepas penanda hilang

let mind = null;            // MindARThree (mod kamera)
let renderer = null, scene = null, camera = null;
let pengawal = null;        // skena aktif: { kemaskini(dt), apabilaDikesan?(), apabilaHilang?() }
let modPratonton = false;   // tiada kamera — paparan 3D biasa
let berjalan = false;
const jam = new THREE.Clock();
const pemuat = new GLTFLoader();
const cache = new Map();

/** Keadaan penjejakan semasa, dikongsi dengan semua Penempatan. */
export const jejak = { aktif: false, pernah: false, pos: new THREE.Vector3(0, 0, -3), sejakHilang: 0 };

export const kamera = () => camera;
export const pratonton = () => modPratonton;
export const bekas = () => document.getElementById('ar');

function sediaCahaya() {
  const ambien = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambien);
  const arah = new THREE.DirectionalLight(0xffffff, 2.2);
  arah.position.set(0.6, 1.2, 1.5);
  scene.add(arah);
  const isi = new THREE.DirectionalLight(0x9fdcff, 0.8);
  isi.position.set(-1, 0.3, 0.8);
  scene.add(isi);
  scene.userData.cahaya = { ambien, arah, isi };
}

/**
 * Cahaya skena semasa { ambien, arah, isi } — level boleh menukar keamatan/warna (mis. malam di
 * Level 9 / Kampung). Panggil pulihkanCahaya() apabila keluar supaya skena lain tidak terjejas.
 */
export const cahayaSkena = () => scene && scene.userData.cahaya;
export function pulihkanCahaya() {
  const c = cahayaSkena();
  if (!c) return;
  c.ambien.intensity = 1.5; c.ambien.color.set(0xffffff);
  c.arah.intensity = 2.2; c.arah.color.set(0xffffff); c.arah.position.set(0.6, 1.2, 1.5);
  c.isi.intensity = 0.8; c.isi.color.set(0x9fdcff);
}

async function mulaKamera() {
  const { MindARThree } = await import('mindar-image-three');
  if (!mind) {
    mind = new MindARThree({
      container: bekas(),
      imageTargetSrc: FAIL_PENANDA,
      maxTrack: 1,
      uiLoading: 'no', uiScanning: 'no', uiError: 'no',
      filterMinCF: 0.001, filterBeta: 10,
      warmupTolerance: 6, missTolerance: 10,   // 6 bingkai berturut sebelum dikira dikesan — elak objek muncul tanpa poster
    });
    mind.addAnchor(0);
    mind.addAnchor(1);
    renderer = mind.renderer; scene = mind.scene; camera = mind.camera;
    sediaCahaya();
  }
  // Mod kamera dan mod pratonton masing-masing ada renderer/skena/kamera sendiri.
  renderer = mind.renderer; scene = mind.scene; camera = mind.camera;
  await mind.start();
}

let pra = null;   // { renderer, scene, camera } untuk mod pratonton
function mulaPratonton() {
  modPratonton = true;
  if (!pra) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, 1, 0.05, 100);
    pra = { renderer, scene, camera };
    sediaCahaya();
    window.addEventListener('resize', saizPratonton);
  }
  ({ renderer, scene, camera } = pra);
  bekas().appendChild(renderer.domElement);
  saizPratonton();
}
function saizPratonton() {
  if (!modPratonton || !renderer) return;
  const el = bekas();
  renderer.setSize(el.clientWidth, el.clientHeight);
  camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
  camera.updateProjectionMatrix();
}

/**
 * Mulakan AR untuk satu skena. Memulangkan 'kamera' atau 'pratonton'.
 * `tanpaKamera` memaksa mod pratonton (dipakai bila kamera ditolak atau tidak wujud).
 */
export async function mulakan(pengawalSkena, { tanpaKamera = false } = {}) {
  await hentikan();
  pengawal = pengawalSkena;
  jejak.aktif = false; jejak.pernah = false; jejak.sejakHilang = 0;
  document.body.classList.add('ar-hidup');

  if (tanpaKamera) mulaPratonton();
  else {
    modPratonton = false;
    await mulaKamera();   // melontar ralat jika kamera ditolak — pemanggil menawarkan pratonton
  }
  document.body.classList.toggle('pratonton', modPratonton);

  berjalan = true;
  jam.getDelta();
  renderer.setAnimationLoop(gelung);
  return modPratonton ? 'pratonton' : 'kamera';
}

export async function hentikan() {
  berjalan = false;
  pengawal = null;
  if (renderer) renderer.setAnimationLoop(null);
  if (mind && !modPratonton) {
    try { mind.stop(); } catch (e) { /* video mungkin belum bermula */ }
  }
  if (modPratonton && renderer && renderer.domElement.parentNode) renderer.domElement.remove();
  document.body.classList.remove('ar-hidup', 'pratonton');
}

function gelung() {
  if (!berjalan) return;
  const dt = Math.min(jam.getDelta(), 0.1);
  const tadi = jejak.aktif;

  if (modPratonton) {
    jejak.aktif = true;
    jejak.pos.set(0, 0.1, -3);
  } else {
    let nampak = null;
    for (const a of mind.anchors) if (a.group.visible) { nampak = a; break; }
    jejak.aktif = !!nampak;
    if (nampak) jejak.pos.setFromMatrixPosition(nampak.group.matrix);
  }
  if (jejak.aktif) { jejak.pernah = true; jejak.sejakHilang = 0; } else jejak.sejakHilang += dt;

  if (pengawal) {
    if (jejak.aktif && !tadi && pengawal.apabilaDikesan) pengawal.apabilaDikesan();
    if (!jejak.aktif && tadi && pengawal.apabilaHilang) pengawal.apabilaHilang();
    pengawal.kemaskini(dt);
  }
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- model

export async function muatModel(nama) {
  if (!cache.has(nama)) cache.set(nama, pemuat.loadAsync(`models/${nama}.glb`).then((g) => g.scene));
  const asal = await cache.get(nama);
  return asal.clone(true);
}

export function cari(akar, nama) {
  let jumpa = null;
  akar.traverse((o) => { if (!jumpa && o.name === nama) jumpa = o; });
  return jumpa;
}

/**
 * Pusat kotak sempadan `objek` dalam ruang tempatan `model` (akar glTF).
 * Panggil SEBELUM model dimasukkan ke dalam Penempatan, semasa akarnya masih tanpa transformasi.
 */
export function pusat(objek, model) {
  model.updateMatrixWorld(true);
  const kotak = new THREE.Box3().setFromObject(objek);
  return model.worldToLocal(kotak.getCenter(new THREE.Vector3()));
}

/**
 * Klon bahan bernama `namaBahan` pada mesh di bawah `objek` supaya warnanya boleh diubah tanpa
 * menjejaskan komponen lain yang berkongsi bahan sama. Memulangkan bahan klon (atau null).
 */
export function bahanSendiri(objek, namaBahan) {
  let klon = null;
  if (!objek) return null;
  objek.traverse((o) => {
    if (o.isMesh && o.material && o.material.name === namaBahan) {
      if (!klon) klon = o.material.clone();
      o.material = klon;
    }
  });
  return klon;
}

/** Koordinat Blender (Z ke atas) -> three.js (Y ke atas), seperti eksport glTF. */
export const dariBlender = (x, y, z) => new THREE.Vector3(x, z, -y);

// ---------------------------------------------------------------- penempatan

/**
 * Meletak satu kumpulan kandungan pada skrin berpandukan penanda.
 *   akar   — diletak & diskala setiap bingkai (jangan ubah position/scale-nya di tempat lain)
 *   pusing — anak akar; pemanggil bebas memutarnya
 * `lebarModel` ialah lebar kandungan dalam unit model; `lebarSkrin` pecahan lebar skrin yang
 * patut didudukinya; `naik` pecahan tinggi skrin ia diangkat di atas pusat penanda.
 */
export class Penempatan {
  constructor({ lebarModel, lebarSkrin = 0.6, naik = 0.1, tinggiMaks = 0, pusatSkrin = false, muat = null }) {
    this.akar = new THREE.Group();
    this.pusing = new THREE.Group();
    this.akar.add(this.pusing);
    this.akar.visible = false;
    this.lebarModel = lebarModel;
    this.lebarSkrin = lebarSkrin;
    this.naik = naik;
    this.tinggiMaks = tinggiMaks;   // { tinggiModel, pecahan } — had tinggi skrin (pilihan)
    this.pusatSkrin = pusatSkrin;   // kandungan di tengah skrin walaupun poster tidak di tengah (Kampung)
    // muat = { skrin, atas, bawah, kanan?, isi } — muatkan ke ruang skrin bebas (Level 6–9, Kampung)
    this.muat = muat ? { isi: 0.88, ...muat } : null;
    this._sejakRuang = 0;
    this.zum = 1;
    this._umur = 0;
    this._sasar = new THREE.Vector3();
    this._mula = true;
    scene.add(this.akar);
  }

  /** Nampak = sedang dijejak, atau baru sahaja hilang (ditahan supaya tidak berkelip). */
  get nampak() { return this.akar.visible; }

  kemaskini(dt) {
    const patutNampak = jejak.aktif || (jejak.pernah && jejak.sejakHilang < TAHAN_SELEPAS_HILANG);
    if (!patutNampak) { this.akar.visible = false; this._mula = true; this._umur = 0; return; }
    this.akar.visible = true;
    this._umur += dt;

    const e = camera.projectionMatrix.elements;
    const jarak = Math.max(0.001, -jejak.pos.z);
    const lebarDunia = (2 * jarak) / e[0];     // lebar skrin (unit dunia) pada jarak penanda
    const tinggiDunia = (2 * jarak) / e[5];

    this._sasar.copy(jejak.pos);
    if (this.pusatSkrin) this._sasar.set(0, 0, jejak.pos.z);   // kamera di asalan: x = y = 0 ialah tengah skrin
    let skala = (this.lebarSkrin * lebarDunia) / this.lebarModel;
    if (this.tinggiMaks) skala = Math.min(skala, (this.tinggiMaks.pecahan * tinggiDunia) / this.tinggiMaks.tinggiModel);

    if (this.muat) {
      // Muat kandungan ke dalam ruang skrin yang tidak dilindungi tajuk/HUD/butang (lihat _ruangBebas):
      // kotak kandungan yang nampak ditengahkan pada ruang itu dan diskala supaya muat lebar DAN tinggi.
      if (!this._kotak) this._kotak = this._ukurKandungan();
      this._sejakRuang += dt;
      if (!this._ruang || this._sejakRuang > 0.3) { this._ruang = this._ruangBebas(); this._sejakRuang = 0; }
      const r = this._ruang, k = this._kotak;
      if (r && k) {
        const sx = (r.lebar * lebarDunia) / k.lebar, sy = (r.tinggi * tinggiDunia) / k.tinggi;
        skala = Math.min(sx, sy) * this.muat.isi;
        this._sasar.y += r.naik * tinggiDunia - k.y * skala;
        this._sasar.x += r.anjak * lebarDunia - k.x * skala;
      }
      if (this._skalaLicin === undefined) this._skalaLicin = skala;
      else this._skalaLicin += (skala - this._skalaLicin) * (1 - Math.pow(0.002, dt));   // panel muncul -> mengecil perlahan
      skala = this._skalaLicin;
    } else {
      this._sasar.y += this.naik * tinggiDunia;
    }
    if (this._mula) { this.akar.position.copy(this._sasar); this._mula = false; }
    else this.akar.position.lerp(this._sasar, 1 - Math.pow(0.0005, dt));   // pelicinan ~bebas kadar bingkai

    const pop = Math.min(1, this._umur / 0.4);
    const lengkung = 1 - Math.pow(1 - pop, 3);   // ease-out
    this.akar.scale.setScalar(skala * this.zum * (0.2 + 0.8 * lengkung));
  }

  /**
   * Kotak kandungan yang NAMPAK (mesh tersembunyi, proksi sentuhan & kesan diabaikan) dalam ruang
   * akar pada skala 1: { lebar, tinggi, x, y } — x/y ialah pusat kotak (pandangan kamera, Y ke atas).
   */
  _ukurKandungan() {
    const kotak = new THREE.Box3(), sementara = new THREE.Box3();
    const songsang = new THREE.Matrix4();
    const skalaLama = this.akar.scale.clone(), posLama = this.akar.position.clone();
    this.akar.scale.set(1, 1, 1); this.akar.position.set(0, 0, 0);
    this.akar.updateMatrixWorld(true);
    songsang.copy(this.akar.matrixWorld).invert();
    this.pusing.traverseVisible((o) => {
      if (!o.isMesh || o.userData.proksi || o.userData.bukanSempadan || o.isSprite) return;
      const b = o.material && (Array.isArray(o.material) ? o.material[0] : o.material);
      if (b && b.visible === false) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      sementara.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(songsang);
      kotak.union(sementara);
    });
    this.akar.scale.copy(skalaLama); this.akar.position.copy(posLama);
    this.akar.updateMatrixWorld(true);
    if (kotak.isEmpty()) return null;
    const saiz = kotak.getSize(new THREE.Vector3()), c = kotak.getCenter(new THREE.Vector3());
    return { lebar: Math.max(1e-6, saiz.x), tinggi: Math.max(1e-6, saiz.y), x: c.x, y: c.y };
  }

  /**
   * Ruang skrin bebas: di bawah elemen `muat.atas` dan di atas elemen `muat.bawah` yang sedang
   * kelihatan, dan di kiri elemen `muat.kanan` jika ia menghalang ruang itu. Dalam pecahan skrin:
   * { lebar, tinggi, naik (pusat ruang di atas pusat skrin), anjak (ke kanan) }.
   */
  _ruangBebas() {
    const el = bekas(), skrin = this.muat.skrin;
    if (!el || !skrin) return null;
    const B = el.getBoundingClientRect();
    if (B.width < 10 || B.height < 10) return null;
    const nampak = (n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(n).visibility !== 'hidden' ? r : null; };
    let atas = B.top, bawah = B.bottom, kiri = B.left, kanan = B.right;
    for (const n of skrin.querySelectorAll(this.muat.atas || '')) { const r = nampak(n); if (r && r.bottom < B.top + B.height * 0.5) atas = Math.max(atas, r.bottom); }
    for (const n of skrin.querySelectorAll(this.muat.bawah || '')) { const r = nampak(n); if (r && r.top > B.top + B.height * 0.3) bawah = Math.min(bawah, r.top); }
    if (this.muat.kanan) for (const n of skrin.querySelectorAll(this.muat.kanan)) {
      const r = nampak(n);
      if (r && r.bottom > atas + 20 && r.top < bawah && r.left > B.left + B.width * 0.5) kanan = Math.min(kanan, r.left);
    }
    const jidar = 8;
    atas += jidar; bawah -= jidar; kiri += jidar; kanan -= jidar;
    if (bawah - atas < B.height * 0.2) return null;
    return {
      lebar: (kanan - kiri) / B.width, tinggi: (bawah - atas) / B.height,
      naik: (B.top + B.height / 2 - (atas + bawah) / 2) / B.height,
      anjak: ((kiri + kanan) / 2 - (B.left + B.width / 2)) / B.width,
    };
  }

  /** Kira semula kotak kandungan (selepas model ditukar banyak, cth. bahagian ditambah). */
  ukurSemula() { this._kotak = null; }

  /** Titik dunia -> koordinat piksel dalam bekas AR (untuk pin label). null jika di belakang kamera. */
  keSkrin(titikDunia, keluar) {
    const v = keluar.copy(titikDunia).project(camera);
    if (v.z > 1) return null;
    const el = bekas();
    v.x = (v.x * 0.5 + 0.5) * el.clientWidth;
    v.y = (-v.y * 0.5 + 0.5) * el.clientHeight;
    return v;
  }

  buang() {
    scene.remove(this.akar);
    this.akar.traverse((o) => {
      if (o.isMesh && o.userData.milikSendiri) { o.geometry.dispose(); o.material.dispose(); }
    });
  }
}

/** Letak `model` di dalam `pusing` dengan pusat kotak sempadannya pada asalan. Pulangkan saiznya. */
export function tengahkan(model, pusing) {
  const kotak = new THREE.Box3().setFromObject(model);
  const tengah = kotak.getCenter(new THREE.Vector3());
  model.position.sub(tengah);
  pusing.add(model);
  return kotak.getSize(new THREE.Vector3());
}

// ---------------------------------------------------------------- gerak isyarat (seret + cubit)

/**
 * Seret satu jari = putar; cubit dua jari = zum. Dipasang pada bekas AR.
 * Memulangkan { sudut, zum, sejakSentuh(), lepas() }.
 */
export function gerakIsyarat({ kepekaan = 0.3, zumMin = 0.6, zumMaks = 2.5 } = {}) {
  const el = document.getElementById('sentuh-ar');
  const k = { sudut: 0, zum: 1, _masa: -100 };
  const jari = new Map();
  let jarakMula = 0, zumMula = 1;

  const jarak = () => { const [a, b] = [...jari.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const turun = (e) => {
    jari.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (jari.size === 2) { jarakMula = jarak(); zumMula = k.zum; }
    k._masa = performance.now();
  };
  const gerak = (e) => {
    const j = jari.get(e.pointerId);
    if (!j) return;
    if (jari.size === 1) k.sudut += (e.clientX - j.x) * kepekaan;
    j.x = e.clientX; j.y = e.clientY;
    if (jari.size === 2 && jarakMula > 0) k.zum = Math.min(zumMaks, Math.max(zumMin, zumMula * jarak() / jarakMula));
    k._masa = performance.now();
  };
  const naik = (e) => { jari.delete(e.pointerId); };

  el.addEventListener('pointerdown', turun);
  el.addEventListener('pointermove', gerak);
  el.addEventListener('pointerup', naik);
  el.addEventListener('pointercancel', naik);
  el.classList.add('aktif');

  k.sejakSentuh = () => (performance.now() - k._masa) / 1000;
  k.lepas = () => {
    el.removeEventListener('pointerdown', turun);
    el.removeEventListener('pointermove', gerak);
    el.removeEventListener('pointerup', naik);
    el.removeEventListener('pointercancel', naik);
    el.classList.remove('aktif');
  };
  return k;
}
