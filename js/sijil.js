// Sijil pencapaian digital pada skrin Keputusan (UISijil.cs): pelajar menaip nama; sijil memaparkan
// jumlah XP, bintang, lencana dan tarikh. Dilukis terus pada <canvas> (bukan tangkapan DOM) supaya
// gambar yang disimpan sama tepat pada semua pelayar, termasuk Safari iPhone.
import * as S from './simpan.js';
import { XP_MAKSIMUM } from './data.js';

const KUNCI_NAMA = 'ewire-ar-nama-pelajar';
const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const W = 940, H = 980;
let logo = null;

function namaTersimpan() { try { return localStorage.getItem(KUNCI_NAMA) || ''; } catch (e) { return ''; } }
function simpanNama(n) { try { localStorage.setItem(KUNCI_NAMA, n); } catch (e) { /* abaikan */ } }

function lukis(kanvas, nama) {
  const c = kanvas.getContext('2d');
  const emas = '#c79926', gelap = '#1f1a14';
  c.fillStyle = '#fcf7e6'; c.fillRect(0, 0, W, H);
  c.strokeStyle = emas; c.lineWidth = 8; c.strokeRect(22, 22, W - 44, H - 44);
  c.lineWidth = 3; c.strokeRect(38, 38, W - 76, H - 76);
  if (logo && logo.complete) c.drawImage(logo, W / 2 - 75, 60, 150, 150);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const teks = (t, y, saiz, warna, gaya = 'bold') => { c.font = `${gaya} ${saiz}px Arial, Helvetica, sans-serif`; c.fillStyle = warna; c.fillText(t, W / 2, y); };
  teks('SIJIL PENCAPAIAN', 258, 54, emas);
  teks('Dengan ini disahkan bahawa', 328, 26, gelap, 'italic');
  const n = (nama || '').trim().toUpperCase() || 'NAMA PELAJAR';
  let saiz = 44;
  c.font = `bold ${saiz}px Arial`;
  while (c.measureText(n).width > W - 140 && saiz > 22) { saiz -= 2; c.font = `bold ${saiz}px Arial`; }
  teks(n, 393, saiz, '#0d2659');
  c.fillStyle = emas; c.fillRect(W / 2 - 320, 434, 640, 3);
  teks('telah berjaya menamatkan cabaran', 468, 26, gelap, 'italic');
  teks('E-WIRE AR', 525, 32, gelap);
  teks('PEMASANGAN PENDAWAIAN ELEKTRIK', 565, 32, gelap);
  const b = S.bintang();
  teks(`${S.xpSemasa()} / ${XP_MAKSIMUM} XP     ${'★'.repeat(b)}`, 642, 30, '#996b0d');
  teks(S.lencana(), 690, 30, '#996b0d');
  const d = new Date();
  c.font = '24px Arial'; c.fillStyle = gelap; c.fillText(`${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`, W / 4 + 30, H - 145);
  c.font = 'bold 18px Arial'; c.fillStyle = '#665a4d'; c.fillText('TARIKH', W / 4 + 30, H - 95);
  c.fillStyle = gelap; c.fillRect(W / 2 + 40, H - 120, W / 2 - 100, 3);
  c.font = 'bold 18px Arial'; c.fillStyle = '#665a4d'; c.fillText('PENSYARAH / PENILAI', W * 0.75 - 10, H - 95);
  c.font = 'bold 22px Arial'; c.fillStyle = emas; c.fillText('KOLEJ KEDA', W * 0.75 - 10, H - 150);
}

/** Pasang panel sijil (dipanggil sekali). */
export function sediakanSijil() {
  const panel = document.getElementById('m-sijil');
  const kanvas = panel.querySelector('canvas');
  const medan = panel.querySelector('input');
  kanvas.width = W; kanvas.height = H;
  logo = new Image();
  logo.src = 'img/kolej-keda-logo.png';
  logo.onload = () => lukis(kanvas, medan.value);
  medan.value = namaTersimpan();
  medan.addEventListener('input', () => { simpanNama(medan.value); lukis(kanvas, medan.value); });
  document.getElementById('butang-sijil').addEventListener('click', () => { lukis(kanvas, medan.value); panel.hidden = false; });
  panel.querySelector('.butang-simpan-sijil').addEventListener('click', async () => {
    lukis(kanvas, medan.value);
    const fail = `Sijil-EWIRE-AR-${new Date().toISOString().slice(0, 10)}.png`;
    const blob = await new Promise((r) => kanvas.toBlob(r, 'image/png'));
    const maklum = panel.querySelector('.label-malap');
    // Telefon: kongsi ke Galeri/Foto jika disokong; jika tidak, muat turun fail PNG.
    try {
      const f = new File([blob], fail, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Sijil E-WIRE AR' }); maklum.textContent = 'Sijil dikongsi.'; return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fail;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    maklum.textContent = 'Sijil dimuat turun sebagai gambar PNG.';
  });
}
