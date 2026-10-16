// Ujian main-habis mod KAMPUNG 3D (mod pratonton): mainkan keenam-enam misi dengan jawapan betul
// melalui window.__uji (kedudukan skrin objek 3D) dan sahkan jumlah XP kampung 600/600.
// Guna: node tools/uji-kampung.mjs [folder-keluaran]
import { chromium } from 'playwright';
import { join } from 'path';
import { mkdirSync } from 'fs';

const keluar = process.argv[2] || join(process.cwd(), 'uji-keluaran');
mkdirSync(keluar, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const ralat = [];
page.on('pageerror', (e) => ralat.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') ralat.push(m.text()); });

const titik = (n) => page.evaluate((x) => window.__uji.titik(x), n);
const asal = (n) => page.evaluate((x) => window.__uji.asal(x), n);
const ketikXY = async (p, ms) => { await page.mouse.click(p.x, p.y); await page.waitForTimeout(ms); };
const ketik = (n, ms = 1200, f = titik) => f(n).then((p) => ketikXY(p, ms));
/** Titik dalam segi skrin `n` yang benar-benar dipilih oleh cariSasaran (bukan objek lain yang bertindih). */
const titikTepat = (n, calon) => page.evaluate(([x, c]) => {
  const r = window.__uji.segi(x);
  for (let j = 1; j < 10; j++) for (let i = 1; i < 10; i++) {
    const px = r.x0 + (r.x1 - r.x0) * i / 10, py = r.y0 + (r.y1 - r.y0) * j / 10;
    if (window.__uji.cari(px, py, c) === x) return { x: px, y: py };
  }
  return window.__uji.titik(x);
}, [n, calon]);
const arahan = () => page.textContent('#s-kampung .hud-arahan');
const misi = async (i) => {
  await page.waitForSelector('#s-kampung .k-misi:not([hidden])', { timeout: 30000 });
  await page.click(`#s-kampung .k-kad:nth-child(${i + 1})`);
  await page.waitForTimeout(1800);   // fokus kamera beranimasi
};
const selesai = async (n) => {
  await page.waitForSelector('#s-kampung .k-misi:not([hidden]), #s-kampung .k-tamat:not([hidden])', { timeout: 30000 });
  console.log(`Misi ${n}:`, await page.textContent('#s-kampung .k-jumlah'));
};

await page.goto('http://127.0.0.1:8765/index.html?pratonton');
await page.evaluate(() => localStorage.clear());
await page.goto('http://127.0.0.1:8765/index.html?pratonton&skrin=kampung');
await page.waitForFunction(() => window.__uji && window.__uji.titik('Pencawang'), null, { timeout: 30000 });

// MISI 1 — aliran tenaga
await misi(0);
for (const n of ['Pencawang', 'Tiang_1']) await ketik(n, 1600);
const a1 = await asal('Aliran_01'), a2 = await asal('Aliran_02');
await ketikXY({ x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 }, 2600);   // Talian_Agihan diuji mengikut garisan
for (const n of ['Meter_A', 'DB_A', 'Lampu_A']) await ketik(n, 2800);
await page.screenshot({ path: join(keluar, 'kampung-misi1.png') });
await selesai(1);

// MISI 2 — rumah gelap (punca rawak): periksa DB, suis, sambungan sehingga punca ditemui, kemudian baiki
await misi(1);
await page.waitForTimeout(600);
for (const n of ['DB_B', 'Suis_B', 'Sambungan_B']) {
  await ketik(n, 1200);
  const t = await arahan();
  if (/BAIKI|LAPOR/.test(await page.textContent('#s-kampung .hud-lencana'))) {
    const baiki = n === 'Suis_B' ? 'Suis_B_Rosak' : n;
    await ketik(baiki, 2600);
    break;
  }
  void t;
}
await selesai(2);

// MISI 3 — wiring: ketik terminal pertama, kemudian terminal kedua; uji suis; litar soket
await misi(2);
for (const [a, b] of [['T_DB_L1', 'T_Suis_1'], ['T_Suis_2', 'T_Lampu_L'], ['T_DB_N', 'T_Lampu_N'], ['T_DB_E', 'T_Lampu_E']]) { await ketik(a, 500); await ketik(b, 900); }
await ketik('Suis_A', 2000);
for (const [a, b] of [['T_DB_L2', 'T_Soket_L'], ['T_DB_N', 'T_Soket_N'], ['T_DB_E', 'T_Soket_E']]) { await ketik(a, 500); await ketik(b, 900); }
await page.screenshot({ path: join(keluar, 'kampung-misi3.png') });
await selesai(3);

// MISI 4 — pilih perlindungan (jawapan betul: 0, 1, 2, 2)
await misi(3);
for (const b of [0, 1, 2, 2]) {
  await page.waitForSelector('#s-kampung .l-pilihan:not([hidden])', { timeout: 10000 });
  await page.click(`#s-kampung .l-pilihan button:nth-child(${b + 1})`);
  await page.waitForTimeout(3600);
}
await selesai(4);

// MISI 5 — cari bahaya: empat diketik terus, yang terakhir melalui HINT (soalan A/B/C)
await misi(4);
const bahaya = ['Bahaya_KabelTerdedah', 'Bahaya_SoketBebanLebih', 'Bahaya_PerkakasAir', 'Bahaya_SambunganTakSelamat'];
for (const n of bahaya) await ketik(n, 1300);
await page.click('#s-kampung .butang-hint');
await page.waitForTimeout(1800);
await page.screenshot({ path: join(keluar, 'kampung-hint.png') });
// cari butang yang betul dengan mencuba (yang salah dimatikan)
for (let i = 0; i < 3; i++) {
  const buka = await page.$$('#s-kampung .l-pilihan:not([hidden]) button:not([disabled]):not([hidden])');
  if (!buka.length) break;
  await buka[0].click();
  await page.waitForTimeout(900);
}
await selesai(5);

// MISI 6 — pulihkan kampung: pencawang, kemudian setiap bangunan mengikut langkah
await misi(5);
await ketik('Pencawang', 3000);
const langkah = { RumahA: ['Cerek_A', 'DB_A'], Kedai: ['Bahaya_SoketBebanLebih', 'DB_Kedai'], Dewan: ['DB_Dewan', 'Sambungan_Dewan', 'DB_Dewan'], LampuJalan: ['KotakFius_Tiang'] };
for (const [bangunan, senarai] of Object.entries(langkah)) {
  await page.waitForTimeout(600);
  await ketik(bangunan, 2400);
  for (const n of senarai) { await ketikXY(await titikTepat(n, senarai), 2300); console.log('  ', n, '|', await page.textContent('#s-kampung .hud-toast')); }
  await page.waitForTimeout(2200);
}
await page.screenshot({ path: join(keluar, 'kampung-misi6.png') });
await page.waitForSelector('#s-kampung .k-tamat:not([hidden])', { timeout: 30000 });
console.log('Misi 6:', (await page.textContent('#s-kampung .k-tamat p')).replace(/\s+/g, ' '));
console.log('Ralat:', ralat.length ? ralat : 'tiada');
await browser.close();
