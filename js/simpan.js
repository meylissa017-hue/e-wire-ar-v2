// Kemajuan pemain — sepadan dengan PengurusPermainan.cs dalam versi Android:
// markah setiap level ialah percubaan TERBAIK, dan jumlah XP ialah hasil tambahnya (terbitan,
// bukan pembilang berasingan), supaya bar XP tidak boleh bercanggah dengan kad level.
import { JUMLAH_LEVEL, SEMUA_LEVEL_DIBUKA, xpMaksimumLevel } from './data.js';
import { XP_MAKS_KAMPUNG } from './kampung-data.js';

const KUNCI = 'ewire-ar-kemajuan-v1';
const pendengar = new Set();

let keadaan = kosong();
let levelPercubaan = 0;
let xpPercubaan = 0;

function kosong() {
  return { tertinggi: 1, selesai: new Array(JUMLAH_LEVEL + 1).fill(false), xp: new Array(JUMLAH_LEVEL + 1).fill(0) };
}

export function muatkan() {
  // localStorage boleh gagal (mod peribadi Safari, data disekat) — permainan mesti tetap jalan.
  try {
    const mentah = localStorage.getItem(KUNCI);
    if (mentah) keadaan = Object.assign(kosong(), JSON.parse(mentah));
  } catch (e) { keadaan = kosong(); }
}

function simpan() {
  try { localStorage.setItem(KUNCI, JSON.stringify(keadaan)); } catch (e) { /* abaikan */ }
}

export function xpSemasa() {
  let jumlah = 0;
  // Dihadkan kepada maksimum setiap level (seperti PengurusPermainan.XPSemasa).
  for (let i = 1; i <= JUMLAH_LEVEL; i++) jumlah += Math.min(keadaan.xp[i] || 0, xpMaksimumLevel(i));
  return jumlah;
}
export const xpLevel = (n) => Math.min(keadaan.xp[n] || 0, xpMaksimumLevel(n));
export const levelSelesai = (n) => !!keadaan.selesai[n];
export const levelDibuka = (n) => SEMUA_LEVEL_DIBUKA || n <= keadaan.tertinggi;
export const levelSeterusnya = () => keadaan.tertinggi;

/** Dipanggil setiap kali satu level bermula, supaya markah percubaan dikira dari sifar. */
export function mulakanPercubaan(n) { levelPercubaan = n; xpPercubaan = 0; }

export function tambahXP(jumlah, n) {
  if (jumlah <= 0) return;
  if (levelPercubaan !== n) mulakanPercubaan(n);
  xpPercubaan += jumlah;
  keadaan.xp[n] = Math.max(keadaan.xp[n] || 0, xpPercubaan);
  simpan();
  maklum();
}

export function tandaSelesai(n) {
  keadaan.selesai[n] = true;
  if (n === keadaan.tertinggi && keadaan.tertinggi < JUMLAH_LEVEL) keadaan.tertinggi++;
  simpan();
}

export function tetapkanSemula() {
  keadaan = kosong();
  tetapkanSemulaKampung();
  levelPercubaan = 0; xpPercubaan = 0;
  simpan();
  maklum();
}

export function bintang() {
  const xp = xpSemasa();
  // 0-259 XP = 1 bintang, 260-519 = 2, 520+ = 3 (ambang Android selepas Level 6-9 ditambah)
  return xp >= 520 ? 3 : xp >= 260 ? 2 : 1;
}
export function lencana() {
  const b = bintang();
  return b >= 3 ? 'LEGENDA PENDAWAIAN' : b === 2 ? 'PAKAR PENDAWAIAN' : 'PENJELAJAH PENDAWAIAN';
}

export function apabilaXPBerubah(fn) { pendengar.add(fn); }
function maklum() { pendengar.forEach((fn) => fn(xpSemasa())); }

// ---------------------------------------------------------------- Kampung 3D (KemajuanKampung)
// Disimpan BERASINGAN daripada Level 1-9, jadi XP level dan sijil tidak terjejas.
const KUNCI_KAMPUNG = 'ewire-ar-kampung-v1';
let kampung = null;
function muatKampung() {
  if (kampung) return kampung;
  try { kampung = JSON.parse(localStorage.getItem(KUNCI_KAMPUNG)) || null; } catch (e) { kampung = null; }
  if (!kampung) kampung = { xp: [0, 0, 0, 0, 0, 0], siap: [false, false, false, false, false, false] };
  return kampung;
}
export const kampungXP = (i) => Math.min(muatKampung().xp[i] || 0, XP_MAKS_KAMPUNG[i]);
export const kampungSiap = (i) => !!muatKampung().siap[i];
export const kampungDibuka = (i) => SEMUA_LEVEL_DIBUKA || i === 0 || kampungSiap(i - 1);
export const kampungJumlah = () => XP_MAKS_KAMPUNG.reduce((j, _, i) => j + kampungXP(i), 0);
export const kampungMaksimum = () => XP_MAKS_KAMPUNG.reduce((a, b) => a + b, 0);
export function kampungRekod(i, xp) {
  const k = muatKampung();
  k.xp[i] = Math.max(kampungXP(i), Math.min(xp, XP_MAKS_KAMPUNG[i]));
  k.siap[i] = true;
  try { localStorage.setItem(KUNCI_KAMPUNG, JSON.stringify(k)); } catch (e) { /* abaikan */ }
}
function tetapkanSemulaKampung() {
  kampung = null;
  try { localStorage.removeItem(KUNCI_KAMPUNG); } catch (e) { /* abaikan */ }
}
