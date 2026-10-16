// Panel bawah ("bottom sheet") Level 6-9 dan Kampung — setara HUDBawah.cs versi Android:
//   penjejak cip (kelabu = belum, biru berdenyut = semasa, hijau = siap) + garis kemajuan,
//   banner arahan berlencana (dibaca oleh suara BM), kotak TAHUKAH ANDA? / GEJALA,
//   notifikasi timbul, dan meter kelajuan (Level 7).
import * as K from './kesan.js';
import { cakap } from './suara.js';

export const WARNA = {
  neon: '#00D4FF', emas: '#FFD700', betul: '#00FF88', salah: '#FF3355',
  merahKuar: '#FF5959', kelabuKuar: '#BFBFCC',
};
export const KEADAAN = { Terkunci: 0, Semasa: 1, Siap: 2 };

export class HUD {
  /**
   * @param skrin   elemen <section> skrin
   * @param opsyen  { cip: bilangan cip, tajukKotak, warnaKotak, meter }
   */
  constructor(skrin, { cip = 5, tajukKotak = 'TAHUKAH ANDA?', warnaKotak = WARNA.emas, meter = false } = {}) {
    this.skrin = skrin;
    skrin.querySelectorAll('.hud-panel, .hud-toast').forEach((e) => e.remove());
    const p = document.createElement('div');
    p.className = 'hud-panel';
    p.innerHTML = `
      <div class="hud-penjejak"><div class="hud-garis"><i></i></div><div class="hud-cip"></div></div>
      ${meter ? '<div class="hud-meter" hidden><b>KELAJUAN 0</b><span><i></i><i></i><i></i><i></i><i></i></span></div>' : ''}
      <div class="hud-banner"><span class="hud-lencana">IMBAS</span><p class="hud-arahan"></p></div>
      <div class="hud-fakta" style="--warna:${warnaKotak}"><b>${tajukKotak}</b><p></p></div>`;
    skrin.appendChild(p);
    const t = document.createElement('div');
    t.className = 'hud-toast';
    skrin.appendChild(t);
    this.panel = p; this.elToast = t;
    this.elPenjejak = p.querySelector('.hud-penjejak');
    this.elCip = p.querySelector('.hud-cip');
    this.elIsi = p.querySelector('.hud-garis i');
    this.elLencana = p.querySelector('.hud-lencana');
    this.elArahan = p.querySelector('.hud-arahan');
    this.elFakta = p.querySelector('.hud-fakta');
    this.elMeter = p.querySelector('.hud-meter');
    this._arahanTerakhir = '';
    // Tinggi sebenar panel -> --tinggi-hud (notifikasi & butang pilihan diletak di atasnya).
    this._ro = new ResizeObserver(() => skrin.style.setProperty('--tinggi-hud', p.offsetHeight + 'px'));
    this._ro.observe(p);
    this.susunCip(cip);
  }

  susunCip(n) {
    this.elCip.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'cip';
      c.innerHTML = `<span class="cip-no">${i + 1}</span><span class="cip-label"></span>`;
      this.elCip.appendChild(c);
    }
    this.elPenjejak.hidden = n === 0;
    this.garis(0);
  }

  cip(i, keadaan, label) {
    const c = this.elCip.children[i];
    if (!c) return;
    const baruSiap = keadaan === KEADAAN.Siap && !c.classList.contains('siap');
    c.classList.toggle('siap', keadaan === KEADAAN.Siap);
    c.classList.toggle('semasa', keadaan === KEADAAN.Semasa);
    c.querySelector('.cip-label').textContent = label;
    c.querySelector('.cip-no').textContent = keadaan === KEADAAN.Siap ? '★' : String(i + 1);
    if (baruSiap) K.pop(c);
  }

  garis(p) { this.elIsi.style.width = Math.max(0, Math.min(1, p)) * 100 + '%'; }

  arahan(lencana, teks, warna = WARNA.emas) {
    this.elLencana.textContent = lencana;
    this.elLencana.style.background = warna;
    if (teks !== this._arahanTerakhir) cakap(teks);
    this._arahanTerakhir = teks;
    this.elArahan.textContent = teks;
    K.pop(this.elArahan);
  }

  fakta(teks) {
    this.elFakta.querySelector('p').textContent = teks;
    this.elFakta.classList.remove('nampak');
    void this.elFakta.offsetWidth;
    this.elFakta.classList.add('nampak');
  }

  toast(teks, warna = WARNA.betul, saat = 2.4) {
    const t = this.elToast;
    t.textContent = teks;
    t.style.setProperty('--warna', warna);
    t.classList.add('nampak');
    K.pop(t);
    clearTimeout(this._t);
    this._t = setTimeout(() => t.classList.remove('nampak'), saat * 1000);
  }

  paparMeter() {
    if (!this.elMeter) return;
    this.elPenjejak.hidden = true;
    this.elMeter.hidden = false;
    K.pop(this.elMeter);
    this.kelajuan(0);
  }

  kelajuan(tahap) {
    if (!this.elMeter) return;
    this.elMeter.querySelector('b').textContent = 'KELAJUAN ' + tahap;
    [...this.elMeter.querySelectorAll('span i')].forEach((b, i) => {
      b.classList.toggle('hidup', i < tahap);
      if (i === tahap - 1) K.pop(b);
    });
  }

  buang() { clearTimeout(this._t); this._ro.disconnect(); this.panel.remove(); this.elToast.remove(); }
}
