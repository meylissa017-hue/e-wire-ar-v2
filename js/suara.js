// Narasi suara Bahasa Melayu (PencakapBM.cs) melalui Web Speech API pelayar — tiada fail audio.
// Bahasa ms-MY; jika tiada suara Melayu, cuba id-ID (bunyi hampir sama); jika tiada, senyap.
// Boleh dimatikan dalam TETAPAN (localStorage "ewire-ar-suara").
const KUNCI = 'ewire-ar-suara';
let suara = null;

export function aktif() {
  try { return localStorage.getItem(KUNCI) !== '0'; } catch (e) { return true; }
}
export function tetapkanAktif(on) {
  try { localStorage.setItem(KUNCI, on ? '1' : '0'); } catch (e) { /* abaikan */ }
  if (!on) henti();
}

function pilihSuara() {
  if (!('speechSynthesis' in window)) return null;
  const semua = speechSynthesis.getVoices();
  return semua.find((v) => /^ms/i.test(v.lang)) || semua.find((v) => /^id/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => { suara = pilihSuara(); };
  suara = pilihSuara();
}

/** Tukar singkatan teknikal kepada sebutan yang betul untuk enjin suara. */
export function sebutan(t) {
  return t.replace(/MΩ/g, ' mega ohm').replace(/Ω/g, ' ohm').replace(/—/g, ',').replace(/->|→/g, ' ke ')
    .replace(/(\d+)\s*A\b/g, '$1 ampere')
    .replace(/(\d+(?:\.\d+)?)\s*V\b/g, '$1 volt')
    .replace(/\bV~/g, 'voltan A C')
    .replace(/\bMCB\b/g, 'M C B').replace(/\bRCCB\b/g, 'R C C B').replace(/\bRCBO\b/g, 'R C B O').replace(/\bRCD\b/g, 'R C D')
    .replace(/\bTV\b/g, 'T V').replace(/\bDB\b/g, 'D B')
    .replace(/\(([LNE])\)/g, '')
    .replace(/mm²/g, ' milimeter persegi');
}

export function cakap(teks) {
  if (!aktif() || !teks || !('speechSynthesis' in window)) return;
  if (!suara) suara = pilihSuara();
  if (!suara) return;   // tiada suara Melayu/Indonesia — senyap tanpa ralat
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(sebutan(teks));
  u.voice = suara; u.lang = suara.lang; u.rate = 1;
  speechSynthesis.speak(u);
}

export function henti() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
