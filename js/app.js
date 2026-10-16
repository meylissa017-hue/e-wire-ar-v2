// E-WIRE AR versi web — penghala skrin dan antara muka.
// Versi Android (Unity) ialah produk utama; versi ini wujud supaya iPhone boleh bermain terus
// dalam pelayar. Kandungan dan aliran skrin sengaja disamakan dengan versi Android.
import * as D from './data.js';
import * as S from './simpan.js';
import * as K from './kesan.js';
import * as AR from './ar.js';
import { level1, level2, level3, level4, level5 } from './level.js';
import { PamerSolar, PamerLitar } from './pamer.js';
import { level6 } from './level6.js';
import { level7 } from './level7.js';
import { level8 } from './level8.js';
import { level9 } from './level9.js';
import { kampung } from './kampung.js';
import * as Suara from './suara.js';
import { sediakanSijil } from './sijil.js';

const $ = (id) => document.getElementById(id);
const param = new URLSearchParams(location.search);
// ?pratonton memaksa paparan 3D tanpa kamera (ujian di komputer, atau telefon tanpa kamera).
const PAKSA_PRATONTON = param.has('pratonton');

const SKRIN = {
  menu: { id: 's-menu' },
  pilih: { id: 's-pilih', mula: binaPilihLevel },
  level1: { id: 's-level1', ar: true, mula: level1 },
  level2: { id: 's-level2', mula: level2 },
  level3: { id: 's-level3', mula: level3 },
  level4: { id: 's-level4', mula: level4 },
  level5: { id: 's-level5', ar: true, mula: level5 },
  level6: { id: 's-level6', ar: true, mula: level6 },
  level7: { id: 's-level7', ar: true, mula: level7 },
  level8: { id: 's-level8', ar: true, mula: level8 },
  level9: { id: 's-level9', ar: true, mula: level9 },
  kampung: { id: 's-kampung', ar: true, mula: kampung },
  solar: { id: 's-pamer', ar: true, mula: (ctx) => mulaPamer(ctx, 'solar') },
  litar: { id: 's-pamer', ar: true, mula: (ctx) => mulaPamer(ctx, 'litar') },
  keputusan: { id: 's-keputusan', mula: binaKeputusan },
};

let aktif = null;        // { nama, pengawal }
let giliran = 0;         // menolak hasil pemuatan skrin yang sudah ditinggalkan

async function pergi(nama) {
  const takrif = SKRIN[nama];
  if (!takrif) return;
  const saya = ++giliran;

  if (aktif && aktif.pengawal && aktif.pengawal.tamat) aktif.pengawal.tamat();
  aktif = null;
  await AR.hentikan();
  AR.pulihkanCahaya();
  Suara.henti();
  $('panel-tamat').hidden = true;

  document.querySelectorAll('#ui .skrin').forEach((s) => s.classList.remove('aktif', 'dikesan'));
  const el = $(takrif.id);
  el.classList.add('aktif');
  kemasXP();

  const ctx = { el, pergi, panelTamat, hidupAR: (p) => hidupAR(p, saya) };
  let pengawal = null;
  if (takrif.mula) {
    try { pengawal = await takrif.mula(ctx); }
    catch (e) { console.error(e); notis('Ralat memuatkan skrin: ' + (e && e.message ? e.message : e)); }
  }
  $('memuat').hidden = true;
  if (saya !== giliran) { if (pengawal && pengawal.tamat) pengawal.tamat(); return; }
  aktif = { nama, pengawal };
}

/** Hidupkan kamera AR; jika gagal, jatuh balik ke paparan 3D tanpa kamera supaya pelajar masih boleh belajar. */
async function hidupAR(pengawal, saya) {
  $('memuat').hidden = false;
  try {
    if (PAKSA_PRATONTON) await AR.mulakan(pengawal, { tanpaKamera: true });
    else {
      try { await AR.mulakan(pengawal); }
      catch (e) {
        console.warn('Kamera gagal:', e);
        if (saya !== giliran) return;
        notis(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'Kamera tidak dapat dibuka. Benarkan akses kamera, kemudian cuba semula. Memaparkan model 3D tanpa kamera.'
          : 'Kamera memerlukan sambungan HTTPS. Memaparkan model 3D tanpa kamera.', 6000);
        await AR.mulakan(pengawal, { tanpaKamera: true });
      }
    }
  } finally { $('memuat').hidden = true; }
}

function notis(teks, ms = 4000) {
  const n = $('notis');
  n.textContent = teks; n.hidden = false;
  clearTimeout(notis._t);
  notis._t = setTimeout(() => { n.hidden = true; }, ms);
}

// ---------------------------------------------------------------- bar XP

function kemasXP() {
  const xp = S.xpSemasa();
  document.querySelectorAll('.bar-xp').forEach((b) => {
    b.querySelector('i').style.width = Math.min(100, (xp / D.AMBANG_LEGENDA) * 100) + '%';
    b.querySelector('span').textContent = `XP: ${xp}/${D.AMBANG_LEGENDA}`;
  });
}

// ---------------------------------------------------------------- pilih level

function binaPilihLevel() {
  const bekas = $('senarai-level');
  bekas.innerHTML = '';
  for (let n = 1; n <= D.JUMLAH_LEVEL; n++) {
    const dibuka = S.levelDibuka(n);
    const k = document.createElement('button');
    k.type = 'button';
    k.className = 'kad-level' + (dibuka ? '' : ' terkunci') + (S.levelSelesai(n) ? ' selesai' : '')
      + (n === S.levelSeterusnya() && !S.levelSelesai(n) ? ' seterusnya' : '');
    k.innerHTML = `
      <span class="level-no">${dibuka ? n : '🔒'}</span>
      <span class="level-info"><b>${D.TAJUK_LEVEL[n]}</b><small>${D.HURAIAN_LEVEL[n]}</small></span>
      <span class="level-xp">★ ${S.xpLevel(n)}/${D.xpMaksimumLevel(n)} XP</span>`;
    k.addEventListener('click', () => { if (dibuka) { K.bunyiKetik(); pergi('level' + n); } else K.goncang(k); });
    bekas.appendChild(k);
  }
}

// ---------------------------------------------------------------- solar / litar

async function mulaPamer(ctx, jenis) {
  const ui = {
    bekas: ctx.el, pin: $('pamer-pin'), legenda: $('pamer-legenda'),
    status: $('pamer-status'), petunjuk: $('pamer-petunjuk'),
  };
  ui.status.textContent = ''; ui.status.classList.remove('amaran'); ui.petunjuk.textContent = '';
  ui.legenda.innerHTML = ''; ui.pin.innerHTML = '';
  $('pamer-tajuk').textContent = jenis === 'solar' ? 'SISTEM TENAGA SOLAR' : 'MEMBINA LITAR ELEKTRIK';
  $('pamer-aliran').textContent = jenis === 'solar' ? 'Panel → Pengawal Cas → Bateri → Penyongsang → Beban' : '';

  const pamer = jenis === 'solar' ? new PamerSolar(ui) : new PamerLitar(ui);
  let sedia = false, hidup = true;
  await ctx.hidupAR({ kemaskini(dt) { if (sedia && hidup) pamer.kemaskini(dt); } });
  await pamer.mula();
  sedia = true;
  return { tamat() { hidup = false; pamer.tamat(); } };
}

// ---------------------------------------------------------------- panel tamat & keputusan

function tetapBintang(bekas, bilangan) {
  [...bekas.children].forEach((b, i) => b.classList.toggle('nyala', i < bilangan));
}

function panelTamat({ tajuk, subtajuk = '', bintang = 3, xp = '', butang = [], tunda = 0 }) {
  const saya = giliran;
  setTimeout(() => {
    if (saya !== giliran) return;
    $('pt-tajuk').textContent = tajuk;
    $('pt-subtajuk').textContent = subtajuk;
    $('pt-xp').textContent = xp;
    tetapBintang($('pt-bintang'), bintang);
    const b = $('pt-butang');
    b.innerHTML = '';
    butang.forEach((x) => {
      const el = document.createElement('button');
      el.className = 'butang' + (x.utama ? ' utama' : '');
      el.textContent = x.teks;
      el.addEventListener('click', () => pergi(x.ke));
      b.appendChild(el);
    });
    $('panel-tamat').hidden = false;
    K.pop($('panel-tamat').firstElementChild);
    kemasXP();
  }, tunda);
}

function binaKeputusan() {
  const xp = S.xpSemasa();
  tetapBintang($('kp-bintang'), S.bintang());
  $('kp-lencana').textContent = S.lencana();
  $('kp-rekod').innerHTML = Array.from({ length: D.JUMLAH_LEVEL }, (_, i) => i + 1)
    .map((n) => `<li><span>Level ${n}</span><b>+${S.xpLevel(n)} XP</b></li>`).join('');
  $('kp-jumlah').textContent = `JUMLAH: ${xp} XP`;
  // Kira naik daripada 0 ke jumlah XP.
  const el = $('kp-xp'), mula = performance.now(), saya = giliran;
  const langkah = (kini) => {
    if (saya !== giliran) return;
    const p = Math.min(1, (kini - mula) / 1200);
    el.textContent = Math.round(xp * p) + ' XP';
    if (p < 1) requestAnimationFrame(langkah);
  };
  requestAnimationFrame(langkah);
  K.konfeti(); K.pop(document.querySelector('.kad-keputusan'));
}

// ---------------------------------------------------------------- permulaan

function ikat() {
  document.addEventListener('click', (e) => {
    const ke = e.target.closest('[data-ke]');
    if (ke) { K.bunyiKetik(); pergi(ke.dataset.ke); return; }
    const modal = e.target.closest('[data-modal]');
    if (modal) { K.bunyiKetik(); $(modal.dataset.modal).hidden = false; K.pop($(modal.dataset.modal).firstElementChild); return; }
    const tutup = e.target.closest('[data-tutup]');
    if (tutup) { tutup.closest('.tindih').hidden = true; }
  });

  $('caramain-isi').innerHTML = D.CARA_MAIN.map((t) => `<p>${t}</p>`).join('');

  $('butang-set-semula').addEventListener('click', () => {
    S.tetapkanSemula();
    $('tetapan-maklum').textContent = 'Kemajuan telah diset semula.';
    setTimeout(() => { $('tetapan-maklum').textContent = ''; }, 2500);
  });
  $('kp-semula').addEventListener('click', () => { S.tetapkanSemula(); pergi('level1'); });

  const butangSuara = $('butang-suara');
  const kemasSuara = () => { butangSuara.textContent = 'SUARA ARAHAN: ' + (Suara.aktif() ? 'ON' : 'OFF'); };
  kemasSuara();
  butangSuara.addEventListener('click', () => { Suara.tetapkanAktif(!Suara.aktif()); kemasSuara(); });

  S.apabilaXPBerubah(kemasXP);
  sediakanSijil();

  // Zarah latar menu (hiasan sahaja).
  const zarah = document.querySelector('.latar-zarah');
  for (let i = 0; i < 26; i++) {
    const z = document.createElement('i');
    z.style.left = Math.random() * 100 + '%';
    z.style.top = Math.random() * 100 + '%';
    z.style.animationDelay = -Math.random() * 6 + 's';
    if (i % 3 === 0) z.className = 'emas';
    zarah.appendChild(z);
  }

  // Android ada aplikasi penuh (ARCore lebih mantap, boleh dipakai tanpa internet). Pautan APK
  // hanya dipaparkan jika fail itu memang dihoskan bersama laman, dan diserlahkan pada telefon
  // Android. iPhone tidak boleh memasang APK, jadi pautan itu disembunyikan di sana.
  const iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!iOS) {
    fetch('E-WIRE-AR.apk', { method: 'HEAD' }).then((r) => {
      if (!r.ok) return;
      const a = $('pautan-apk');
      a.hidden = false;
      if (/Android/i.test(navigator.userAgent)) a.classList.add('serlah');
    }).catch(() => {});
  }
}

S.muatkan();
ikat();
pergi(SKRIN[param.get('skrin')] ? param.get('skrin') : 'menu');
