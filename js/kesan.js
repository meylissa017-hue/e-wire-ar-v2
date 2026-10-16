// Kesan ringan: kilat skrin, popup terbang, konfeti, bunyi, pop/goncang.
// Semuanya DOM/CSS/WebAudio — tiada kebergantungan pada kanvas AR.

const lapisan = () => document.getElementById('lapisan-kesan');

export function kilat(warna, tempoh = 350) {
  const el = document.createElement('div');
  el.className = 'kilat';
  el.style.background = warna;
  lapisan().appendChild(el);
  setTimeout(() => el.remove(), tempoh + 50);
}

export function popup(teks, warna = '#FFD700') {
  const el = document.createElement('div');
  el.className = 'popup-terbang';
  el.textContent = teks;
  el.style.color = warna;
  lapisan().appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

export function konfeti(bilangan = 70) {
  const warna = ['#00D4FF', '#FFD700', '#00FF88', '#FF3355', '#E0E0FF'];
  const bekas = lapisan();
  for (let i = 0; i < bilangan; i++) {
    const k = document.createElement('i');
    k.className = 'konfeti';
    k.style.left = Math.random() * 100 + '%';
    k.style.background = warna[i % warna.length];
    k.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    k.style.animationDelay = Math.random() * 0.4 + 's';
    k.style.setProperty('--hanyut', (Math.random() * 2 - 1) * 120 + 'px');
    bekas.appendChild(k);
    setTimeout(() => k.remove(), 3800);
  }
}

export function pop(el) { ulangKelas(el, 'anim-pop'); }
export function goncang(el) { ulangKelas(el, 'anim-goncang'); }
function ulangKelas(el, kelas) {
  if (!el) return;
  el.classList.remove(kelas);
  void el.offsetWidth; // paksa reflow supaya animasi boleh dimainkan semula
  el.classList.add(kelas);
}

// ---- Bunyi (WebAudio) — dicipta pada sentuhan pertama; iOS menyekat audio tanpa gerak isyarat.
let audio = null;
function konteks() {
  if (!audio) {
    const K = window.AudioContext || window.webkitAudioContext;
    if (!K) return null;
    audio = new K();
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}
function nada(frek, mula, tempoh, jenis = 'sine', kuat = 0.12) {
  const a = konteks();
  if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = jenis; o.frequency.value = frek;
  g.gain.setValueAtTime(kuat, a.currentTime + mula);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + mula + tempoh);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + mula);
  o.stop(a.currentTime + mula + tempoh + 0.02);
}
export function bunyiBetul() { nada(660, 0, 0.12); nada(990, 0.1, 0.22); }
export function bunyiSalah() { nada(220, 0, 0.25, 'sawtooth', 0.08); nada(160, 0.12, 0.3, 'sawtooth', 0.08); }
export function bunyiMenang() { [523, 659, 784, 1047].forEach((f, i) => nada(f, i * 0.12, 0.3)); }
export function bunyiKetik() { nada(880, 0, 0.05, 'square', 0.04); }

/** Desiran angin kipas: hingar perang bergelung; tetap(kuat 0..1, pic 0.6..1.3). */
export function bunyiAngin() {
  const a = konteks();
  if (!a) return { tetap() {}, henti() {} };
  const kadar = 22050, data = new Float32Array(kadar);
  let akhir = 0;
  for (let i = 0; i < kadar; i++) { akhir = Math.max(-1, Math.min(1, akhir + (Math.random() * 2 - 1) * 0.04)) * 0.995; data[i] = akhir * 0.8; }
  for (let i = 0; i < 2000; i++) { const t = i / 2000; data[kadar - 2000 + i] = data[kadar - 2000 + i] * (1 - t) + data[i] * t; }
  const buf = a.createBuffer(1, kadar, kadar);
  buf.copyToChannel(data, 0);
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const g = a.createGain(); g.gain.value = 0;
  src.connect(g).connect(a.destination);
  src.start();
  return {
    tetap(kuat, pic) { g.gain.value = kuat; src.playbackRate.value = pic; },
    henti() { try { src.stop(); } catch (e) { /* abaikan */ } },
  };
}
