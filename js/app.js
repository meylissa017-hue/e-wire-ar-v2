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
  menu: { id: 's-menu', mula: binaMenu },
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

/**
 * Hidupkan kamera AR. Objek 3D hanya muncul selepas poster diimbas; jika kamera gagal, pelajar
 * MEMILIH (cuba lagi / lihat 3D tanpa kamera / menu) — tiada lagi paparan 3D senyap tanpa imbasan.
 */
async function hidupAR(pengawal, saya) {
  $('memuat').hidden = false;
  try {
    if (PAKSA_PRATONTON) { await AR.mulakan(pengawal, { tanpaKamera: true }); return; }
    for (;;) {
      try { await AR.mulakan(pengawal); return; }
      catch (e) {
        console.warn('Kamera gagal:', e);
        if (saya !== giliran) return;
        $('memuat').hidden = true;
        const pilihan = await tanyaKamera(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'Akses kamera ditolak atau kamera sedang digunakan oleh aplikasi lain.'
          : 'Kamera memerlukan sambungan HTTPS.');
        if (saya !== giliran) return;
        if (pilihan === 'menu') { pergi('menu'); return; }
        $('memuat').hidden = false;
        if (pilihan === 'pratonton') { await AR.mulakan(pengawal, { tanpaKamera: true }); return; }
      }
    }
  } finally { $('memuat').hidden = true; }
}

function tanyaKamera(sebab) {
  const m = $('m-kamera');
  m.querySelector('.kamera-sebab').textContent = sebab;
  m.hidden = false;
  return new Promise((selesai) => {
    m.onclick = (e) => {
      const b = e.target.closest('[data-pilih]');
      if (!b) return;
      m.hidden = true; m.onclick = null;
      selesai(b.dataset.pilih);
    };
  });
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

const bilSelesai = () => { let s = 0; for (let n = 1; n <= D.JUMLAH_LEVEL; n++) if (S.levelSelesai(n)) s++; return s; };
const teksBintang = (b) => `${'★'.repeat(b)}<span class="bintang-malap">${'★'.repeat(3 - b)}</span>`;

/** Kad statistik Menu Utama (UIMenuUtama.KemaskiniStatistik). */
function binaMenu() {
  const xp = S.xpSemasa();
  $('stat-bintang').innerHTML = teksBintang(S.bintang());
  $('stat-lencana').textContent = S.lencana();
  $('stat-xp').textContent = `${xp} / ${D.XP_MAKSIMUM} XP`;
  $('stat-level').textContent = `${bilSelesai()} / ${D.JUMLAH_LEVEL} LEVEL SELESAI`;
  $('stat-bar').style.width = Math.min(100, (xp / D.XP_MAKSIMUM) * 100) + '%';
}

/** Grid 3 x 3 Pilih Level (UIPilihLevel + KadLevel); Level 6-9 (objek 3D) bertema emas. */
function binaPilihLevel() {
  const xp = S.xpSemasa(), selesai = bilSelesai();
  $('pilih-xp').textContent = `★ ${xp} / ${D.XP_MAKSIMUM} XP`;
  $('pilih-selesai').textContent = `${selesai} / ${D.JUMLAH_LEVEL} SELESAI`;
  $('pilih-bar').style.width = Math.min(100, (xp / D.XP_MAKSIMUM) * 100) + '%';
  const bekas = $('senarai-level');
  bekas.innerHTML = '';
  for (let n = 1; n <= D.JUMLAH_LEVEL; n++) {
    const dibuka = S.levelDibuka(n), siap = S.levelSelesai(n);
    const dapat = S.xpLevel(n), maks = D.xpMaksimumLevel(n);
    // Bintang markah: penuh = 3, >= 60% = 2, ada markah = 1.
    const b = maks <= 0 || dapat <= 0 ? 0 : dapat >= maks ? 3 : dapat * 10 >= maks * 6 ? 2 : 1;
    const k = document.createElement('button');
    k.type = 'button';
    k.className = 'kad-level potong' + (n >= 6 ? ' tiga-d' : '') + (dibuka ? '' : ' terkunci') + (siap ? ' selesai' : '')
      + (n === S.levelSeterusnya() && !siap ? ' seterusnya' : '');
    k.innerHTML = `
      <span class="kad-jalur"></span>${n >= 6 ? '<span class="lencana-3d">3D</span>' : ''}
      <span class="kad-label">LEVEL</span>
      <span class="kad-no">${String(n).padStart(2, '0')}</span>
      <span class="kad-tajuk">${D.TAJUK_LEVEL[n]}</span>
      <span class="kad-bintang">${dibuka ? teksBintang(b) : ''}</span>
      <span class="kad-xp">${dibuka ? `${dapat}/${maks} XP` : ''}</span>
      <span class="kad-status">${!dibuka ? 'TERKUNCI' : siap ? '✓ SIAP' : '▶ MAIN'}</span>`;
    k.addEventListener('click', () => { if (dibuka) { K.bunyiKetik(); pergi('level' + n); } else K.goncang(k); });
    bekas.appendChild(k);
  }
  // SAMBUNG: level pertama yang dibuka tetapi belum selesai; jika semua selesai, main semula Level 1.
  let sasaran = 1;
  for (let n = 1; n <= D.JUMLAH_LEVEL; n++) if (S.levelDibuka(n) && !S.levelSelesai(n)) { sasaran = n; break; }
  const sambung = $('butang-sambung');
  sambung.innerHTML = selesai === D.JUMLAH_LEVEL ? '▶&nbsp; MAIN SEMULA LEVEL 1' : `▶&nbsp; SAMBUNG LEVEL ${sasaran}`;
  sambung.onclick = () => { K.bunyiKetik(); pergi('level' + sasaran); };
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

  S.apabilaXPBerubah(() => { kemasXP(); binaMenu(); });
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
