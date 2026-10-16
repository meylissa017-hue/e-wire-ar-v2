// Lima level permainan. Logik dan teks sepadan dengan Level1_KenaliIA.cs … Level5_WayarkanIA.cs
// dalam versi Android. Setiap fungsi memulangkan { tamat() } untuk membersihkan diri bila keluar.
import { THREE, Penempatan, tengahkan, muatModel, cari } from './ar.js';
import * as D from './data.js';
import { mulakanPercubaan, tambahXP, tandaSelesai } from './simpan.js';
import * as K from './kesan.js';

const WARNA = { betul: '#00FF88', salah: '#FF3355', emas: '#FFD700' };
const $ = (akar, pemilih) => akar.querySelector(pemilih);

// ============================================================ LEVEL 1 — KENALI IA (AR)
export async function level1(ctx) {
  const el = ctx.el;
  const soalan = D.SOALAN_L1;
  let indeks = 0, betul = 0, dijawab = false, baki = D.MASA_SETIAP_SOALAN, hidup = true;
  let tempat = null, model = null, masa = 0, token = 0;
  const pemasa = [];
  const nanti = (fn, ms) => pemasa.push(setTimeout(() => { if (hidup) fn(); }, ms));

  mulakanPercubaan(1);
  const elSoalan = $(el, '.soalan-teks'), elNo = $(el, '.soalan-no'), elMaklum = $(el, '.soalan-maklum');
  const elJawapan = $(el, '.jawapan'), elTimer = $(el, '.timer'), elBintang = $(el, '.hud-bintang');
  const elTitik = $(el, '.titik-kemajuan');
  elTitik.innerHTML = soalan.map(() => '<i></i>').join('');
  elBintang.textContent = `★ 0/${soalan.length}`;

  async function paparModel(nama) {
    const t = ++token;
    const m = await muatModel(nama);
    if (!hidup || t !== token || !tempat) return;   // soalan sudah bertukar semasa memuat
    if (model) tempat.pusing.remove(model);
    model = m;
    const saiz = tengahkan(model, tempat.pusing);
    // Semua komponen dinormalkan kepada saiz skrin yang sama, tidak kira saiz mesh asalnya.
    tempat.lebarModel = Math.max(saiz.x, saiz.y, saiz.z);
    tempat._umur = 0;   // animasi pop masuk untuk setiap soalan
  }

  function muatSoalan() {
    if (indeks >= soalan.length) return tamatLevel();
    dijawab = false;
    baki = D.MASA_SETIAP_SOALAN;
    const s = soalan[indeks];
    elNo.textContent = `CABARAN ${String(indeks + 1).padStart(2, '0')}/${String(soalan.length).padStart(2, '0')}`;
    elSoalan.textContent = s.teks;
    elMaklum.textContent = ''; elMaklum.className = 'soalan-maklum';
    [...elTitik.children].forEach((t, i) => { t.className = i < indeks ? 'siap' : i === indeks ? 'kini' : ''; });
    elJawapan.innerHTML = '';
    s.pilihan.forEach((teks, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'butang-jawapan';
      b.innerHTML = `<span class="huruf">${String.fromCharCode(65 + i)}</span><span>${teks}</span>`;
      b.addEventListener('click', () => pilih(i, b));
      elJawapan.appendChild(b);
    });
    paparModel(s.model);
  }

  // pilihan = -1 bermaksud tamat masa — dianggap salah automatik.
  function pilih(pilihan, butang) {
    if (dijawab || indeks >= soalan.length) return;
    dijawab = true;
    const s = soalan[indeks];
    const ok = pilihan === s.betul;
    [...elJawapan.children].forEach((b) => { b.disabled = true; });
    if (ok) {
      betul++;
      tambahXP(D.XP.L1_SETIAP_SOALAN, 1);
      elMaklum.textContent = `BETUL! +${D.XP.L1_SETIAP_SOALAN} XP — ${s.penjelasan}`;
      elMaklum.classList.add('betul');
      butang.classList.add('betul');
      K.kilat(WARNA.betul); K.bunyiBetul(); K.pop(butang);
      K.popup(`+${D.XP.L1_SETIAP_SOALAN} XP ★`, WARNA.emas);
      elBintang.textContent = `★ ${betul}/${soalan.length}`;
    } else {
      elMaklum.textContent = pilihan < 0 ? 'MASA TAMAT!' : 'CUBA LAGI!';
      elMaklum.classList.add('salah');
      if (butang) { butang.classList.add('salah'); K.goncang(butang); }
      K.kilat(WARNA.salah); K.bunyiSalah();
      K.popup(pilihan < 0 ? 'MASA TAMAT!' : 'CUBA LAGI!', WARNA.salah);
    }
    indeks++;
    nanti(muatSoalan, ok ? 1900 : 2300);
  }

  function tamatLevel() {
    elSoalan.textContent = 'Tahniah! Semua soalan selesai.';
    elJawapan.innerHTML = ''; elTimer.textContent = '';
    [...elTitik.children].forEach((t) => { t.className = 'siap'; });
    tandaSelesai(1);
    K.konfeti(); K.bunyiMenang();
    ctx.panelTamat({
      tajuk: '★ TAHNIAH! ★', subtajuk: 'LEVEL 1 SELESAI',
      bintang: betul >= soalan.length ? 3 : betul >= 3 ? 2 : betul >= 1 ? 1 : 0,
      xp: `+${betul * D.XP.L1_SETIAP_SOALAN} XP`,
      butang: [{ teks: 'TERUSKAN', ke: 'level2', utama: true }, { teks: 'MAIN SEMULA', ke: 'level1' }],
    });
  }

  const pengawal = {
    kemaskini(dt) {
      masa += dt;
      if (!dijawab && indeks < soalan.length) {
        baki -= dt;
        elTimer.textContent = Math.max(0, Math.ceil(baki));
        elTimer.classList.toggle('hampir', baki <= 5);
        if (baki <= 0) pilih(-1, null);
      }
      if (!tempat) return;
      tempat.kemaskini(dt);
      el.classList.toggle('dikesan', tempat.nampak);
      // Putaran meja-pusing + terapung naik-turun.
      tempat.pusing.rotation.set(0.25, masa * 0.7, 0);
      tempat.pusing.position.y = Math.sin(masa * 1.8) * 0.04 * tempat.lebarModel;
    },
  };

  await ctx.hidupAR(pengawal);
  if (!hidup) return { tamat() {} };
  tempat = new Penempatan({ lebarModel: 0.1, lebarSkrin: 0.42, naik: 0 });
  muatSoalan();

  return {
    tamat() {
      hidup = false;
      pemasa.forEach(clearTimeout);
      if (tempat) tempat.buang();
      el.classList.remove('dikesan');
    },
  };
}

// ============================================================ seret & lepas (Level 2 & 4)
/**
 * Jadikan `kad` boleh diseret ke salah satu `slot`. Ketik (tanpa seret) juga disokong: ketik kad
 * untuk memilih, kemudian ketik slot — lebih mudah pada skrin kecil.
 * `cuba(kad, slot)` memulangkan true jika kad diterima (dan mengendalikan penempatannya).
 */
function seretLepas(bekas, kad, slotSemua, cuba) {
  let dipilih = null;
  const pilih = (k) => {
    if (dipilih) dipilih.classList.remove('dipilih');
    dipilih = k;
    if (k) k.classList.add('dipilih');
  };

  kad.forEach((k) => {
    let mula = null, gerak = false;
    k.addEventListener('pointerdown', (e) => {
      if (k.classList.contains('terkunci')) return;
      mula = { x: e.clientX, y: e.clientY }; gerak = false;
      k.setPointerCapture(e.pointerId);
    });
    k.addEventListener('pointermove', (e) => {
      if (!mula) return;
      const dx = e.clientX - mula.x, dy = e.clientY - mula.y;
      if (!gerak && Math.hypot(dx, dy) < 8) return;
      gerak = true;
      k.classList.add('diseret');
      k.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
    });
    const lepas = (e) => {
      if (!mula) return;
      mula = null;
      k.classList.remove('diseret');
      k.style.transform = '';
      if (!gerak) { pilih(dipilih === k ? null : k); K.bunyiKetik(); return; }
      // Cari slot di bawah jari. Kad disembunyikan daripada ujian-kena supaya ia tidak menutup slot.
      k.style.pointerEvents = 'none';
      const bawah = document.elementFromPoint(e.clientX, e.clientY);
      k.style.pointerEvents = '';
      const slot = bawah && bawah.closest('.slot');
      if (slot && slotSemua.includes(slot)) { pilih(null); cuba(k, slot); }
    };
    k.addEventListener('pointerup', lepas);
    k.addEventListener('pointercancel', lepas);
  });

  slotSemua.forEach((s) => s.addEventListener('click', () => {
    if (!dipilih) return;
    const k = dipilih;
    pilih(null);
    cuba(k, s);
  }));
}

function sediaLevelDOM(ctx, n) {
  const el = ctx.el;
  mulakanPercubaan(n);
  const maklum = $(el, '.maklum');
  maklum.textContent = ''; maklum.className = 'maklum';
  return { el, maklum };
}

// ============================================================ LEVEL 2 — PADANKAN IA
export function level2(ctx) {
  const { el, maklum } = sediaLevelDOM(ctx, 2);
  const elWayar = $(el, '.kolam-kad'), elSlot = $(el, '.senarai-slot');
  let betul = 0;

  elSlot.innerHTML = '';
  const slot = D.kocok(D.TERMINAL_L2).map((t) => {
    const s = document.createElement('div');
    s.className = 'slot'; s.dataset.id = t.id;
    s.innerHTML = `<span class="slot-label">${t.label}</span><div class="slot-ruang"></div>`;
    elSlot.appendChild(s);
    return s;
  });
  elWayar.innerHTML = '';
  const kad = D.kocok(D.WAYAR_L2).map((w) => {
    const k = document.createElement('div');
    k.className = 'kad kad-wayar'; k.dataset.id = w.id; k.textContent = w.label;
    k.style.background = w.warna;
    elWayar.appendChild(k);
    return k;
  });

  seretLepas(el, kad, slot, (k, s) => {
    if (s.classList.contains('terisi')) return;
    if (k.dataset.id === s.dataset.id) {
      $(s, '.slot-ruang').appendChild(k);
      k.classList.add('terkunci'); s.classList.add('terisi', 'betul');
      betul++;
      maklum.textContent = 'BETUL!'; maklum.className = 'maklum betul';
      K.bunyiBetul(); K.pop(s);
      if (betul >= slot.length) {
        maklum.textContent = `PADANAN SEMPURNA! +${D.XP.L2} XP ★★★`;
        tambahXP(D.XP.L2, 2); tandaSelesai(2);
        K.konfeti(); K.bunyiMenang();
        ctx.panelTamat({ tajuk: '★ PADANAN SEMPURNA! ★', subtajuk: 'LEVEL 2 SELESAI', bintang: 3, xp: `+${D.XP.L2} XP`,
          butang: [{ teks: 'TERUSKAN', ke: 'level3', utama: true }, { teks: 'PILIH LEVEL', ke: 'pilih' }] });
      }
    } else {
      maklum.textContent = 'CUBA LAGI'; maklum.className = 'maklum salah';
      K.bunyiSalah(); K.goncang(k);
    }
  });
  return { tamat() {} };
}

// ============================================================ LEVEL 3 — PILIH IA
export function level3(ctx) {
  const { el, maklum } = sediaLevelDOM(ctx, 3);
  $(el, '.misi-teks').textContent = D.MISI_L3;
  const grid = $(el, '.grid-item');
  grid.innerHTML = '';
  const kad = D.kocok(D.ITEM_L3).map((item) => {
    const k = document.createElement('button');
    k.type = 'button'; k.className = 'kad kad-item'; k.textContent = item.nama;
    k.addEventListener('click', () => { k.classList.remove('betul', 'salah'); k.classList.toggle('dipilih'); K.bunyiKetik(); });
    grid.appendChild(k);
    return { k, item };
  });

  const semak = $(el, '.butang-semak');
  const baru = semak.cloneNode(true);   // buang pendengar lama daripada percubaan sebelumnya
  semak.replaceWith(baru);
  baru.addEventListener('click', () => {
    let semuaBetul = true;
    kad.forEach(({ k, item }) => {
      const dipilih = k.classList.contains('dipilih');
      k.classList.remove('betul', 'salah');
      if (dipilih === item.perlu) { if (item.perlu) k.classList.add('betul'); }
      else { k.classList.add('salah'); K.goncang(k); semuaBetul = false; }
    });
    if (semuaBetul) {
      maklum.textContent = `PEMILIHAN BAHAN LENGKAP! +${D.XP.L3} XP`; maklum.className = 'maklum betul';
      tambahXP(D.XP.L3, 3); tandaSelesai(3);
      K.konfeti(); K.bunyiMenang();
      ctx.panelTamat({ tajuk: '★ PEMILIHAN LENGKAP! ★', subtajuk: 'LEVEL 3 SELESAI', bintang: 3, xp: `+${D.XP.L3} XP`,
        butang: [{ teks: 'TERUSKAN', ke: 'level4', utama: true }, { teks: 'PILIH LEVEL', ke: 'pilih' }] });
    } else {
      maklum.textContent = 'CUBA LAGI! Semak semula pilihan anda.'; maklum.className = 'maklum salah';
      K.bunyiSalah();
    }
  });
  return { tamat() {} };
}

// ============================================================ LEVEL 4 — SUSUN IA
export function level4(ctx) {
  const { el, maklum } = sediaLevelDOM(ctx, 4);
  const elKad = $(el, '.kolam-kad'), elSlot = $(el, '.senarai-slot');
  let betul = 0;

  elSlot.innerHTML = '';
  const slot = D.LANGKAH_L4.map((_, i) => {
    const s = document.createElement('div');
    s.className = 'slot slot-langkah'; s.dataset.indeks = i;
    s.innerHTML = `<span class="slot-nombor">${i + 1}</span><div class="slot-ruang"></div>`;
    elSlot.appendChild(s);
    return s;
  });
  elKad.innerHTML = '';
  const kad = D.kocok(D.LANGKAH_L4).map((l) => {
    const k = document.createElement('div');
    k.className = 'kad kad-langkah'; k.dataset.urutan = l.urutan; k.textContent = `${l.kod}. ${l.teks}`;
    elKad.appendChild(k);
    return k;
  });

  seretLepas(el, kad, slot, (k, s) => {
    if (s.classList.contains('terisi')) return;
    if (k.dataset.urutan === s.dataset.indeks) {
      $(s, '.slot-ruang').appendChild(k);
      k.classList.add('terkunci'); s.classList.add('terisi', 'betul');
      betul++;
      maklum.textContent = `BETUL! Langkah ${Number(s.dataset.indeks) + 1} disahkan.`; maklum.className = 'maklum betul';
      K.bunyiBetul(); K.pop(s);
      if (betul >= slot.length) {
        maklum.textContent = `URUTAN PEMASANGAN LENGKAP! +${D.XP.L4} XP`;
        tambahXP(D.XP.L4, 4); tandaSelesai(4);
        slot.forEach((x, i) => setTimeout(() => K.pop(x), i * 250));
        K.konfeti(); K.bunyiMenang();
        ctx.panelTamat({ tajuk: '★ URUTAN LENGKAP! ★', subtajuk: 'LEVEL 4 SELESAI', bintang: 3, xp: `+${D.XP.L4} XP`,
          butang: [{ teks: 'TERUSKAN', ke: 'level5', utama: true }, { teks: 'PILIH LEVEL', ke: 'pilih' }], tunda: 1100 });
      }
    } else {
      maklum.textContent = 'CUBA LAGI — bukan urutan yang betul.'; maklum.className = 'maklum salah';
      K.bunyiSalah(); K.goncang(k);
    }
  });
  return { tamat() {} };
}

// ============================================================ LEVEL 5 — WAYARKAN IA (AR)
export async function level5(ctx) {
  const { el, maklum } = sediaLevelDOM(ctx, 5);
  const elWayar = $(el, '.kolam-kad'), elTerminal = $(el, '.senarai-slot');
  let hidup = true, tempat = null, masa = 0, padan = 0, lengkap = false, dipilih = null;
  let sinarLampu = null, masaLampu = 0;
  const pemasa = [];
  const nanti = (fn, ms) => pemasa.push(setTimeout(() => { if (hidup) fn(); }, ms));

  const pilih = (k) => {
    if (dipilih) dipilih.classList.remove('dipilih');
    dipilih = k;
    if (k) { k.classList.add('dipilih'); K.pop(k); maklum.textContent = 'Wayar dipilih — ketik terminal sasaran.'; maklum.className = 'maklum'; }
  };

  elTerminal.innerHTML = '';
  const terminal = D.TERMINAL_L5.map((t) => {
    const s = document.createElement('button');
    s.type = 'button'; s.className = 'slot slot-terminal'; s.dataset.id = t.id;
    s.innerHTML = `<span class="slot-label">${t.label}</span>`;
    s.addEventListener('click', () => ketikTerminal(s));
    elTerminal.appendChild(s);
    return s;
  });
  elWayar.innerHTML = '';
  D.kocok(D.WAYAR_L5).forEach((w) => {
    const k = document.createElement('button');
    k.type = 'button'; k.className = 'kad kad-wayar'; k.dataset.id = w.id; k.textContent = w.label;
    k.style.background = w.warna;
    k.addEventListener('click', () => {
      if (k.classList.contains('terkunci') || lengkap) return;
      K.bunyiKetik();
      pilih(dipilih === k ? null : k);
    });
    elWayar.appendChild(k);
  });

  function ketikTerminal(s) {
    if (s.classList.contains('terisi') || lengkap) return;
    if (!dipilih) { maklum.textContent = 'Ketik salah satu wayar dahulu.'; maklum.className = 'maklum'; return; }
    const k = dipilih;
    pilih(null);
    if (k.dataset.id === s.dataset.id) {
      k.classList.add('terkunci'); k.disabled = true;
      s.classList.add('terisi', 'betul');
      s.style.setProperty('--warna-wayar', k.style.background);
      padan++;
      maklum.textContent = 'SAMBUNGAN BETUL!'; maklum.className = 'maklum betul';
      K.kilat(WARNA.betul); K.bunyiBetul(); K.pop(s);
      if (padan >= terminal.length) lengkapkan();
    } else {
      maklum.textContent = 'Sambungan salah!'; maklum.className = 'maklum salah';
      K.kilat(WARNA.salah); K.bunyiSalah(); K.goncang(s);
      // Kilat merah SEMENTARA sahaja — terminal mesti kekal boleh diketik selepas jawapan salah.
      s.classList.add('salah');
      nanti(() => s.classList.remove('salah'), 500);
    }
  }

  // Urutan kesan akhir: lampu menyala dahulu, kemudian mesej tahniah, kemudian panel tamat.
  function lengkapkan() {
    lengkap = true;
    tambahXP(D.XP.L5, 5); tandaSelesai(5);
    if (sinarLampu) sinarLampu.visible = true;
    maklum.textContent = 'LAMPU MENYALA!'; maklum.className = 'maklum betul';
    K.kilat(WARNA.emas, 600); K.bunyiMenang();
    nanti(() => { K.konfeti(); maklum.textContent = 'TAHNIAH! PENDAWAIAN LENGKAP!'; }, 1400);
    nanti(() => K.popup(`+${D.XP.L5} XP ★★★`, WARNA.emas), 1700);
    nanti(() => ctx.panelTamat({ tajuk: '★ PENDAWAIAN LENGKAP! ★', subtajuk: 'LEVEL 5 SELESAI', bintang: 3, xp: `+${D.XP.L5} XP`,
      butang: [{ teks: 'TERUSKAN: LEVEL 6 ➡', ke: 'level6', utama: true }, { teks: 'MENU UTAMA', ke: 'menu' }] }), 2200);
  }

  const pengawal = {
    kemaskini(dt) {
      masa += dt;
      if (!tempat) return;
      tempat.kemaskini(dt);
      el.classList.toggle('dikesan', tempat.nampak);
      // Papan latihan ialah RAJAH — ayunan kecil sahaja supaya pendawaian sentiasa terbaca.
      tempat.pusing.rotation.set(0.12, Math.sin(masa * 0.8) * (14 * Math.PI / 180), 0);
      if (sinarLampu && sinarLampu.visible) {
        masaLampu += dt;
        sinarLampu.scale.setScalar(1 + 0.12 * Math.sin(masaLampu * 6));
      }
    },
  };

  await ctx.hidupAR(pengawal);
  if (!hidup) return { tamat() {} };
  const model = await muatModel('LitarLevel5');
  if (!hidup) return { tamat() {} };
  // Sinar mentol: sfera bercahaya pada penanda TitikMenyala, disembunyikan sehingga litar lengkap.
  const titik = cari(model, 'TitikMenyala');
  sinarLampu = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xffe680, transparent: true, opacity: 0.8, depthWrite: false }),
  );
  sinarLampu.userData.milikSendiri = true;
  if (titik) sinarLampu.position.copy(titik.position);
  sinarLampu.visible = false;
  model.add(sinarLampu);

  tempat = new Penempatan({ lebarModel: 0.37, lebarSkrin: 0.72, naik: 0 });
  tengahkan(model, tempat.pusing);

  return {
    tamat() {
      hidup = false;
      pemasa.forEach(clearTimeout);
      if (tempat) tempat.buang();
      el.classList.remove('dikesan');
    },
  };
}
