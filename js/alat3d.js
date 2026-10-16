// Alat dikongsi Level 6-9 dan Kampung: animasi berasaskan bingkai, sentuhan pada objek 3D,
// zarah ringkas (asap, percikan, kilauan), kesan "betul" dan mod X-Ray arus.
// Setara dengan coroutine, Physics.Raycast + BoxCollider, ParticleSystem dan XRayArus.cs versi Android.
import { THREE, kamera, bekas, pratonton } from './ar.js';

export const lancar = (k) => k * k * (3 - 2 * k);   // Mathf.SmoothStep(0, 1, k)

// ---------------------------------------------------------------- masa & animasi

/**
 * Pengurus masa satu level. Semua animasi dan tunda berjalan dari kemaskini(dt) supaya ia berhenti
 * serta-merta apabila level ditinggalkan (henti()). Fungsi async level menyemak `m.hidup`.
 */
export class Masa {
  constructor() { this.hidup = true; this._tw = new Set(); this.masa = 0; }

  /** fn(k) dipanggil setiap bingkai dengan k 0..1 (linear). Pulangkan Promise. */
  animasi(durasi, fn) {
    return new Promise((selesai) => {
      if (!this.hidup) { selesai(false); return; }
      if (durasi <= 0) { fn && fn(1); selesai(true); return; }
      this._tw.add({ m: 0, d: durasi, fn, selesai });
    });
  }

  tunggu(saat) { return this.animasi(saat, null); }

  /** fn(dt, masa) setiap bingkai sehingga ia memulangkan false atau .henti() dipanggil. */
  setiap(fn) {
    const t = { fn, hidup: true, henti() { this.hidup = false; } };
    this._tw.add(t);
    return t;
  }

  kemaskini(dt) {
    if (!this.hidup) return;
    this.masa += dt;
    for (const t of [...this._tw]) {
      if (t.d === undefined) {                        // setiap()
        if (!t.hidup || t.fn(dt, this.masa) === false) this._tw.delete(t);
        continue;
      }
      t.m += dt;
      const k = Math.min(1, t.m / t.d);
      if (t.fn) t.fn(k);
      if (k >= 1) { this._tw.delete(t); t.selesai(true); }
    }
  }

  henti() {
    this.hidup = false;
    for (const t of this._tw) if (t.selesai) t.selesai(false);
    this._tw.clear();
  }
}

/** Animasi pose tempatan (kedudukan, putaran, skala) — RutinPose Android. */
export function pose(m, obj, { pos, rot, skala }, durasi) {
  const p0 = obj.position.clone(), r0 = obj.quaternion.clone(), s0 = obj.scale.clone();
  return m.animasi(durasi, (k) => {
    const e = lancar(k);
    if (pos) obj.position.lerpVectors(p0, pos, e);
    if (rot) obj.quaternion.slerpQuaternions(r0, rot, e);
    if (skala) obj.scale.lerpVectors(s0, skala, e);
  });
}

/** Denyut skala sekali (maklum balas sentuhan). */
export function denyut(m, obj, durasi = 0.22, lebih = 1.1, asal = obj.scale.clone()) {
  return m.animasi(durasi, (k) => obj.scale.copy(asal).multiplyScalar(1 + (lebih - 1) * Math.sin(k * Math.PI)))
    .then(() => obj.scale.copy(asal));
}

/** Goncang ke kiri-kanan (dalam ruang induk). */
export function goncang(m, obj, amp = 0.003) {
  const asal = obj.position.clone();
  return m.animasi(0.3, (k) => { obj.position.copy(asal); obj.position.x += Math.sin(k * 0.3 * 70) * amp * (1 - k); })
    .then(() => obj.position.copy(asal));
}

// ---------------------------------------------------------------- objek & sempadan

export function cariSemua(akar) {
  const peta = new Map();
  akar.traverse((o) => { if (o.name && !peta.has(o.name)) peta.set(o.name, o); });
  return peta;
}

/** Kotak sempadan semua mesh di bawah `obj`, dalam ruang tempatan `obj` sendiri. */
export function kotakTempatan(obj) {
  obj.updateMatrixWorld(true);
  const songsang = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  const kotak = new THREE.Box3(), k = new THREE.Box3(), mat = new THREE.Matrix4();
  obj.traverse((o) => {
    if (!o.isMesh || o.userData.proksi || o.userData.bukanSempadan) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    mat.multiplyMatrices(songsang, o.matrixWorld);
    k.copy(o.geometry.boundingBox).applyMatrix4(mat);
    kotak.union(k);
  });
  return kotak;
}

/** Pusat kotak sempadan `obj` dalam ruang `ruang` (lalai: dunia). */
export function pusatDalam(obj, ruang = null) {
  const kotak = kotakTempatan(obj);
  const p = kotak.isEmpty() ? new THREE.Vector3() : kotak.getCenter(new THREE.Vector3());
  obj.localToWorld(p);
  return ruang ? ruang.worldToLocal(p) : p;
}

/** Arah dunia `arahDunia` dalam ruang tempatan induk `obj` (untuk menggerakkan togol "ke bawah"). */
export function arahTempatan(obj, arahDunia) {
  const induk = obj.parent;
  induk.updateMatrixWorld(true);
  const q = induk.getWorldQuaternion(new THREE.Quaternion()).invert();
  const s = induk.getWorldScale(new THREE.Vector3());
  return arahDunia.clone().applyQuaternion(q).divide(s);
}

/** Salin `obj` sebagai "hantu" hologram (bahan lut sinar), disembunyikan pada mulanya. */
export function binaHantu(obj, bahan) {
  const h = obj.clone(true);
  h.name = 'Hantu_' + obj.name;
  h.traverse((o) => { if (o.isMesh) { o.material = bahan; o.userData.hantu = true; } });
  h.visible = false;
  obj.parent.add(h);
  h.position.copy(obj.position); h.quaternion.copy(obj.quaternion); h.scale.copy(obj.scale);
  return h;
}

// ---------------------------------------------------------------- sentuhan pada objek 3D

const _ray = new THREE.Raycaster();
const _v2 = new THREE.Vector2();

/** Koordinat piksel bekas AR -> NDC. */
function keNdc(x, y) {
  const el = bekas();
  _v2.set((x / el.clientWidth) * 2 - 1, -(y / el.clientHeight) * 2 + 1);
  return _v2;
}

/**
 * Sasaran sentuh: setiap objek didaftar dengan kotak proksi halimunan (seperti BoxCollider yang
 * dibesarkan dalam EWireARBuilder). kena() mencuba titik ketikan dan gelang kecil di sekelilingnya
 * supaya komponen kecil tetap mudah disentuh dengan jari.
 */
export class Pemilih {
  constructor() { this.proksi = []; }

  daftar(obj, data, { besar = 1.15, minimum = 0.02, kotak = null } = {}) {
    const k = kotak || kotakTempatan(obj);
    if (k.isEmpty()) return null;
    // minimum dalam meter model (objek glTF berskala 1 berbanding model, seperti dalam Blender)
    const saiz = k.getSize(new THREE.Vector3()).multiplyScalar(besar);
    saiz.set(Math.max(saiz.x, minimum), Math.max(saiz.y, minimum), Math.max(saiz.z, minimum));
    const m = new THREE.Mesh(new THREE.BoxGeometry(saiz.x, saiz.y, saiz.z), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.copy(k.getCenter(new THREE.Vector3()));
    m.userData.proksi = true; m.userData.data = data; m.userData.milikSendiri = true;
    obj.add(m);
    this.proksi.push(m);
    return m;
  }

  /** Pulangkan { data, titik } bagi proksi terdekat di bawah jari, atau null. */
  kena(x, y, { jejari = 0.018, tapis = null } = {}) {
    const el = bekas();
    const r = el.clientHeight * jejari;
    const senarai = this.proksi.filter((p) => p.parent && nampakDiDunia(p) && (!tapis || tapis(p.userData.data)));
    for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
      _ray.setFromCamera(keNdc(x + dx, y + dy), kamera());
      const h = _ray.intersectObjects(senarai, false);
      if (h.length) return { data: h[0].object.userData.data, titik: h[0].point.clone() };
    }
    return null;
  }
}

function nampakDiDunia(o) {
  for (let p = o.parent; p; p = p.parent) if (!p.visible) return false;
  return true;
}

/** Sinar dari titik skrin. */
export function sinar(x, y) {
  _ray.setFromCamera(keNdc(x, y), kamera());
  return _ray.ray;
}

/** Titik dunia -> piksel bekas AR ({x, y, z}); z > 1 = di belakang kamera. */
export function keSkrin(titikDunia) {
  const el = bekas();
  const v = titikDunia.clone().project(kamera());
  return { x: (v.x * 0.5 + 0.5) * el.clientWidth, y: (-v.y * 0.5 + 0.5) * el.clientHeight, z: v.z };
}

/**
 * Sentuhan satu jari pada lapisan AR: { turun(x,y), gerak(x,y), naik(x,y, ketik) }.
 * Dua jari = cubit (cubit(nisbah) jika diberi). Memulangkan { lepas() }.
 */
export function pasangSentuh(p) {
  const el = document.getElementById('sentuh-ar');
  const jari = new Map();
  let utama = null, mula = null, jarakMula = 0, mencubit = false;
  const kedudukan = (e) => { const r = bekas().getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const jarak = () => { const [a, b] = [...jari.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

  const turun = (e) => {
    const k = kedudukan(e);
    jari.set(e.pointerId, k);
    if (jari.size === 2) {
      mencubit = true; jarakMula = jarak();
      if (utama !== null && p.batal) p.batal();
      utama = null;
      if (p.cubitMula) p.cubitMula();
      return;
    }
    if (jari.size > 2) return;
    utama = e.pointerId; mula = k; mencubit = false;
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
    if (p.turun) p.turun(k.x, k.y);
  };
  const gerak = (e) => {
    if (!jari.has(e.pointerId)) return;
    const k = kedudukan(e);
    jari.set(e.pointerId, k);
    if (mencubit && jari.size === 2) { if (p.cubit && jarakMula > 0) p.cubit(jarak() / jarakMula); return; }
    if (e.pointerId === utama && p.gerak) p.gerak(k.x, k.y);
  };
  const naik = (e) => {
    if (!jari.has(e.pointerId)) return;
    const k = kedudukan(e);
    jari.delete(e.pointerId);
    if (jari.size === 0) mencubit = false;
    if (e.pointerId !== utama) return;
    utama = null;
    const ketik = mula && Math.hypot(k.x - mula.x, k.y - mula.y) < bekas().clientHeight * 0.03;
    if (p.naik) p.naik(k.x, k.y, ketik);
  };
  el.addEventListener('pointerdown', turun);
  el.addEventListener('pointermove', gerak);
  el.addEventListener('pointerup', naik);
  el.addEventListener('pointercancel', naik);
  el.classList.add('aktif');
  // Tikus (komputer): roda = zum
  const roda = (e) => { if (p.roda) { e.preventDefault(); p.roda(e.deltaY); } };
  el.addEventListener('wheel', roda, { passive: false });
  return {
    lepas() {
      el.removeEventListener('pointerdown', turun);
      el.removeEventListener('pointermove', gerak);
      el.removeEventListener('pointerup', naik);
      el.removeEventListener('pointercancel', naik);
      el.removeEventListener('wheel', roda);
      el.classList.remove('aktif');
    },
  };
}

// ---------------------------------------------------------------- tekstur & bahan

const _pemuatTeks = new THREE.TextureLoader();
const _teks = new Map();
export function tekstur(nama, { ulang = false, srgb = true } = {}) {
  const kunci = nama + (ulang ? ':u' : '') + (srgb ? ':s' : '');
  if (!_teks.has(kunci)) {
    const t = _pemuatTeks.load(`models/tekstur/${nama}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    if (ulang) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    _teks.set(kunci, t);
  }
  return _teks.get(kunci);
}

/** Seperti tekstur(), tetapi menunggu sehingga imej siap dimuat (sebelum diklon). */
const _janji = new Map();
export function muatTekstur(nama, opsyen = {}) {
  const t = tekstur(nama, opsyen);
  if (t.image) return Promise.resolve(t);
  if (!_janji.has(t)) {
    _janji.set(t, new Promise((selesai) => {
      const semak = () => (t.image ? selesai(t) : setTimeout(semak, 30));
      semak();
    }));
  }
  return _janji.get(t);
}

/** Warna seperti Unity (nilai sRGB 0..1). */
export const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

/** Bahan hologram (hantu) seperti Kipas_Hantu / Kipas_HantuAktif. */
export function bahanHantu(aktif) {
  return new THREE.MeshBasicMaterial({
    color: aktif ? srgb(0.3, 1, 0.6) : srgb(0, 0.83, 1), transparent: true, opacity: aktif ? 0.55 : 0.3,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

/** Bahan bercahaya (emisi) — mentol menyala, LED, skrin TV. */
export function bahanMenyala(warna, emisi, kuat = 1) {
  return new THREE.MeshStandardMaterial({ color: warna, emissive: emisi, emissiveIntensity: kuat, roughness: 0.4 });
}

/** Ganti bahan semua mesh di bawah `obj` (null = pulihkan bahan asal). */
export function tukarBahan(obj, bahan) {
  obj.traverse((o) => {
    if (!o.isMesh || o.userData.proksi || o.userData.hantu) return;
    if (o.userData.bahanAsal === undefined) o.userData.bahanAsal = o.material;
    o.material = bahan || o.userData.bahanAsal;
  });
}

// ---------------------------------------------------------------- zarah

/**
 * Sistem zarah ringkas berasaskan Sprite. Zarah hidup dalam ruang tempatan `induk` supaya ia
 * mengikut skala & kedudukan model (seperti simulationSpace Local + scalingMode Hierarchy).
 */
export class Zarah {
  constructor(induk, { peta = 'zarah_lembut.png', tambah = true, maks = 120 } = {}) {
    this.induk = induk;
    this.kolam = [];
    this.bahanAsas = new THREE.SpriteMaterial({
      map: tekstur(peta), transparent: true, depthWrite: false,
      blending: tambah ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.maks = maks;
    this.pemancar = null;      // { kadar, opsyen } pancaran berterusan
    this._baki = 0;
  }

  pancar(n, o) {
    for (let i = 0; i < n; i++) {
      let z = this.kolam.find((x) => !x.hidup);
      if (!z) {
        if (this.kolam.length >= this.maks) return;
        const s = new THREE.Sprite(this.bahanAsas.clone());
        s.userData.milikSendiri = true;
        s.renderOrder = 5;
        this.induk.add(s);
        z = { s, hidup: false };
        this.kolam.push(z);
      }
      const rawak = (a) => (Array.isArray(a) ? a[0] + Math.random() * (a[1] - a[0]) : a);
      const arah = o.arah ? o.arah.clone() : new THREE.Vector3();
      const sebar = o.sebar ?? 1;
      const d = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(sebar);
      const v = arah.add(d).normalize().multiplyScalar(rawak(o.laju ?? 0));
      const pos = (o.pos || new THREE.Vector3()).clone();
      if (o.kotak) pos.add(new THREE.Vector3((Math.random() - 0.5) * o.kotak.x, (Math.random() - 0.5) * o.kotak.y, (Math.random() - 0.5) * o.kotak.z));
      Object.assign(z, {
        hidup: true, umur: 0, hayat: rawak(o.hayat ?? 1), pos, v,
        saiz: rawak(o.saiz ?? 0.01), membesar: o.membesar ?? 1, warna: new THREE.Color(o.warna ?? 0xffffff),
        warnaAkhir: o.warnaAkhir ? new THREE.Color(o.warnaAkhir) : null, alfa: o.alfa ?? 1,
        graviti: o.graviti ?? 0, redam: o.redam ?? 0, pudarMasuk: o.pudarMasuk ?? 0, hanyut: o.hanyut || null,
      });
      z.s.visible = true;
      z.s.material.rotation = Math.random() * Math.PI * 2;
    }
  }

  /** Pancaran berterusan (asap, kabus, kilauan): kadar zarah sesaat. null = henti. */
  berterusan(kadar, opsyen) { this.pemancar = kadar ? { kadar, opsyen } : null; }

  kosongkan() { for (const z of this.kolam) { z.hidup = false; z.s.visible = false; } }

  kemaskini(dt) {
    if (this.pemancar) {
      this._baki += this.pemancar.kadar * dt;
      const n = Math.floor(this._baki);
      if (n > 0) { this._baki -= n; this.pancar(n, this.pemancar.opsyen); }
    }
    for (const z of this.kolam) {
      if (!z.hidup) continue;
      z.umur += dt;
      const k = z.umur / z.hayat;
      if (k >= 1) { z.hidup = false; z.s.visible = false; continue; }
      if (z.redam) z.v.multiplyScalar(Math.max(0, 1 - z.redam * dt));
      z.v.y -= z.graviti * dt;
      if (z.hanyut) z.v.add(z.hanyut.clone().multiplyScalar(dt));
      z.pos.addScaledVector(z.v, dt);
      z.s.position.copy(z.pos);
      z.s.scale.setScalar(z.saiz * (1 + (z.membesar - 1) * k));
      const c = z.warnaAkhir ? z.warna.clone().lerp(z.warnaAkhir, k) : z.warna;
      z.s.material.color.copy(c);
      const masuk = z.pudarMasuk > 0 ? Math.min(1, k / z.pudarMasuk) : 1;
      z.s.material.opacity = z.alfa * masuk * (1 - k);
    }
  }

  buang() { for (const z of this.kolam) { this.induk.remove(z.s); z.s.material.dispose(); } this.kolam = []; }
}

/** Kesan "betul" (PenghasilKesan.KesanBetul): letupan zarah hijau-emas kecil di `pos` (ruang induk). */
export function kesanBetul(zarah, pos, skala = 1) {
  zarah.pancar(18, { pos, laju: [0.05 * skala, 0.14 * skala], hayat: [0.35, 0.7], saiz: [0.008 * skala, 0.016 * skala], warna: 0x66ffaa, warnaAkhir: 0xffd700, redam: 3 });
}

/** Bunga api (PenghasilKesan.BungaApi): letupan besar berwarna. */
export function bungaApi(zarah, pos, skala = 1) {
  for (const w of [0x00d4ff, 0xffd700, 0x00ff88, 0xff3355]) {
    zarah.pancar(14, { pos, laju: [0.12 * skala, 0.3 * skala], hayat: [0.6, 1.2], saiz: [0.01 * skala, 0.02 * skala], warna: 0xffffff, warnaAkhir: w, graviti: 0.15 * skala, redam: 1.5 });
  }
}

// ---------------------------------------------------------------- X-RAY

export const XR = { Mati: 0, Bertenaga: 1, Mengalir: 2, Berkelip: 3, Panas: 4 };
const WARNA_XR = { L: srgb(1, 0.55, 0.1), N: srgb(0.2, 0.55, 1), E: srgb(0.2, 1, 0.35), panas: srgb(1, 0.12, 0.05) };

/**
 * Mod X-Ray (XRayArus.cs): garis bercahaya di atas setiap wayar (oren L, biru N, hijau E) dan
 * titik cahaya bergerak sepanjang wayar yang membawa arus. Laluan daripada kosong
 * "Laluan_<Wayar>_NN" dalam model.
 */
export class XRay {
  constructor(model, balikN = []) {
    this.aktif = false;
    this.wayar = new Map();
    this.kumpulan = new THREE.Group();
    this.kumpulan.visible = false;
    model.add(this.kumpulan);
    model.updateMatrixWorld(true);
    const kumpul = new Map();
    model.traverse((o) => {
      const m = /^Laluan_(.+)_(\d+)$/.exec(o.name);
      if (!m) return;
      if (!kumpul.has(m[1])) kumpul.set(m[1], []);
      kumpul.get(m[1]).push({ i: Number(m[2]), p: model.worldToLocal(o.getWorldPosition(new THREE.Vector3())) });
    });
    const peta = tekstur('zarah_lembut.png');
    for (const [nama, titik] of kumpul) {
      titik.sort((a, b) => a.i - b.i);
      const pts = titik.map((t) => t.p);
      if (pts.length < 2) continue;
      const jenis = nama.endsWith('N') ? 'N' : nama.endsWith('E') ? 'E' : 'L';
      const lengkung = new THREE.CurvePath();
      for (let i = 1; i < pts.length; i++) lengkung.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
      const bahan = new THREE.MeshBasicMaterial({ color: WARNA_XR[jenis].clone(), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
      const tiub = new THREE.Mesh(new THREE.TubeGeometry(lengkung, Math.max(8, pts.length * 4), 0.0035, 6, false), bahan);
      tiub.renderOrder = 10; tiub.userData.milikSendiri = true; tiub.userData.bukanSempadan = true;
      this.kumpulan.add(tiub);
      const kum = [0];
      for (let i = 1; i < pts.length; i++) kum.push(kum[i - 1] + pts[i].distanceTo(pts[i - 1]));
      const zarah = [];
      for (let z = 0; z < 6; z++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: peta, color: WARNA_XR[jenis].clone().lerp(new THREE.Color(1, 1, 1), 0.35), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true }));
        s.scale.setScalar(0.016); s.renderOrder = 11; s.userData.milikSendiri = true;
        this.kumpulan.add(s); zarah.push(s);
      }
      this.wayar.set(nama, { jenis, pts, kum, tiub, bahan, zarah, keadaan: XR.Mati, songsang: balikN.includes(nama) });
    }
  }

  tetapkan(nama, keadaan) { const w = this.wayar.get(nama); if (w) w.keadaan = keadaan; }

  tetapkanAktif(on) { this.aktif = on; this.kumpulan.visible = on; }

  kemaskini(masa) {
    if (!this.aktif) return;
    for (const w of this.wayar.values()) {
      let alfa, lebar;
      switch (w.keadaan) {
        case XR.Mati: alfa = 0.12; lebar = 0.5; break;
        case XR.Bertenaga: alfa = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(masa * 4)); lebar = 0.85; break;
        case XR.Berkelip: alfa = Math.random() < 0.5 ? 0.9 : 0.1; lebar = 1; break;
        case XR.Panas: alfa = 0.7 + 0.3 * Math.sin(masa * 12); lebar = 1.6; break;
        default: alfa = 0.75; lebar = 1;
      }
      w.bahan.opacity = alfa;
      w.bahan.color.copy(w.keadaan === XR.Panas ? WARNA_XR.panas : WARNA_XR[w.jenis]);
      w.tiub.scale.setScalar(1);   // lebar dibayangkan melalui keamatan (tiub statik)
      w.tiub.material.opacity = alfa * Math.min(1, lebar);
      const alir = w.keadaan === XR.Mengalir || w.keadaan === XR.Panas || (w.keadaan === XR.Berkelip && alfa > 0.5);
      const jumlah = w.kum[w.kum.length - 1];
      const laju = w.keadaan === XR.Panas ? 0.9 : 0.45;
      w.zarah.forEach((s, z) => {
        s.visible = alir;
        if (!alir) return;
        let t = ((masa * laju + z / w.zarah.length) % 1 + 1) % 1;
        if (w.songsang) t = 1 - t;
        s.position.copy(titikPada(w, t * jumlah));
      });
    }
  }
}

function titikPada(w, jarak) {
  const k = w.kum;
  for (let i = 1; i < k.length; i++) {
    if (jarak <= k[i]) {
      const seg = k[i] - k[i - 1];
      return new THREE.Vector3().lerpVectors(w.pts[i - 1], w.pts[i], seg > 1e-6 ? (jarak - k[i - 1]) / seg : 0);
    }
  }
  return w.pts[k.length - 1].clone();
}

// ---------------------------------------------------------------- cangkuk ujian automatik

/**
 * Mod pratonton sahaja: dedahkan kedudukan skrin objek bernama kepada skrip ujian (tools/uji-main.mjs)
 * supaya ujian boleh mengetik/menyeret objek 3D sebenar. Tiada kesan dalam mod kamera.
 */
export function daftarUji(akar) {
  if (!pratonton()) return;
  const peta = { get: (n) => akar.getObjectByName(n) };
  const keXY = (v) => { const s = keSkrin(v); return { x: s.x, y: s.y }; };
  window.__uji = {
    titik: (n) => { const t = peta.get(n); if (!t) return null; const k = kotakTempatan(t); return keXY(t.localToWorld(k.isEmpty() ? new THREE.Vector3() : k.getCenter(new THREE.Vector3()))); },
    asal: (n) => { const t = peta.get(n); return t ? keXY(t.getWorldPosition(new THREE.Vector3())) : null; },
  };
}
