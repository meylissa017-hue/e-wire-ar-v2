// Ujian main-habis: mainkan kesembilan-sembilan level dengan jawapan betul (mod pratonton) dan sahkan
// XP akhir 660 serta skrin Keputusan. Level 6-9 diketik/diseret pada objek 3D sebenar melalui
// window.__uji (cangkuk mod pratonton, alat3d.daftarUji). Guna: node tools/uji-main.mjs [folder-keluaran]
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

const xp = () => page.evaluate(() => document.querySelector('.skrin.aktif .bar-xp span')?.textContent || '');
// ---- bantuan objek 3D (Level 6-9)
const tungguUji = (n) => page.waitForFunction((x) => window.__uji && window.__uji.titik(x), n, { timeout: 20000 });
const titik = (n) => page.evaluate((x) => window.__uji.titik(x), n);
const asal = (n) => page.evaluate((x) => window.__uji.asal(x), n);
const ketik = async (n, ms = 900, fn = titik) => { const p = await fn(n); await page.mouse.click(p.x, p.y); await page.waitForTimeout(ms); };
const seret = async (dari, ke, ms = 900) => {
  const a = await titik(dari), b = await titik(ke);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= 16; i++) { await page.mouse.move(a.x + (b.x - a.x) * i / 16, a.y + (b.y - a.y) * i / 16); await page.waitForTimeout(25); }
  await page.waitForTimeout(150); await page.mouse.up(); await page.waitForTimeout(ms);
};
const levelBaharu = async (n, objek) => { await page.evaluate(() => { window.__uji = null; }); await page.waitForSelector(`#s-level${n}.aktif`); await tungguUji(objek); await page.waitForTimeout(1200); };

const tamat = async (teksButang) => {
  await page.waitForSelector('#panel-tamat:not([hidden])', { timeout: 20000 });
  const tajuk = await page.textContent('#pt-tajuk');
  const mata = await page.textContent('#pt-xp');
  await page.click(`#pt-butang button:has-text("${teksButang}")`);
  return `${tajuk} ${mata}`;
};

await page.goto('http://127.0.0.1:8765/index.html?pratonton');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.click('button[data-ke="level1"]');

// Level 1 — jawapan betul ikut data
const betulL1 = ['MCB', 'Suis Satu Hala', 'Soket Outlet', 'Pemegang Lampu', 'Kotak Agihan'];
for (let i = 0; i < 5; i++) {
  await page.waitForFunction((n) => document.querySelector('#s-level1 .soalan-no')?.textContent.includes(`0${n}/05`), i + 1, { timeout: 15000 });
  await page.locator('#s-level1 .butang-jawapan:not([disabled])', { hasText: new RegExp(`^[A-D]${betulL1[i]}$`) }).click();
}
console.log('L1:', await tamat('TERUSKAN'));

// Level 2 — ketik wayar, kemudian ketik terminal yang sepadan
await page.waitForSelector('#s-level2.aktif');
for (const id of ['L', 'N', 'PE']) {
  await page.click(`#s-level2 .kad-wayar[data-id="${id}"]`);
  await page.click(`#s-level2 .slot[data-id="${id}"]`);
}
console.log('L2:', await tamat('TERUSKAN'));

// Level 3 — satu cubaan salah dahulu, kemudian betul
await page.waitForSelector('#s-level3.aktif');
await page.click('#s-level3 .kad-item:has-text("Soket Outlet")');
await page.click('#s-level3 .butang-semak');
console.log('L3 salah:', await page.textContent('#s-level3 .maklum'));
await page.click('#s-level3 .kad-item:has-text("Soket Outlet")');
for (const n of ['Pemegang Lampu', 'Suis Satu Hala', 'Kabel']) await page.click(`#s-level3 .kad-item:text-is("${n}")`);
await page.click('#s-level3 .butang-semak');
console.log('L3:', await tamat('TERUSKAN'));

// Level 4 — satu cubaan salah, kemudian urutan betul
await page.waitForSelector('#s-level4.aktif');
await page.click('#s-level4 .kad-langkah[data-urutan="3"]');
await page.click('#s-level4 .slot[data-indeks="0"]');
console.log('L4 salah:', await page.textContent('#s-level4 .maklum'));
for (const u of ['0', '1', '2', '3']) {
  await page.click(`#s-level4 .kolam-kad .kad-langkah[data-urutan="${u}"]`);
  await page.click(`#s-level4 .slot[data-indeks="${u}"]`);
}
console.log('L4:', await tamat('TERUSKAN'));

// Level 5 — satu sambungan salah (terminal mesti kekal boleh diketik), kemudian betul
await page.waitForSelector('#s-level5.aktif');
await page.waitForTimeout(2500);
await page.click('#s-level5 .kad-wayar[data-id="L"]');
await page.click('#s-level5 .slot[data-id="N"]');
console.log('L5 salah:', await page.textContent('#s-level5 .maklum'));
for (const id of ['L', 'N', 'PE']) {
  await page.click(`#s-level5 .kad-wayar[data-id="${id}"]`);
  await page.click(`#s-level5 .slot[data-id="${id}"]`);
}
await page.waitForTimeout(1200);
await page.screenshot({ path: join(keluar, 'main-level5-menyala.png') });
console.log('L5:', await tamat('TERUSKAN: LEVEL 6'));

// Level 6 — tiga kes: kenal pasti, kemudian prosedur selamat
await levelBaharu(6, 'MCB_Lampu');
const kesL6 = [['MCB_Lampu', 'MCB_Lampu'], ['Soket', 'MCB_Soket', 'Soket', 'MCB_Soket'], ['Suis', 'MCB_Lampu', 'Suis', 'MCB_Lampu']];
for (const langkah of kesL6) {
  for (const n of langkah) await ketik(n, 1700);
  await page.waitForSelector('#s-level6 .l-panel:not([hidden])', { timeout: 10000 });
  console.log('L6 kes:', await page.textContent('#s-level6 .l-panel h2'), await page.textContent('#s-level6 .xp-baris'));
  await page.click('#s-level6 .l-panel button');
  await page.waitForTimeout(1400);
}
console.log('L6:', await tamat('TERUSKAN: LEVEL 7'));

// Level 7 — seret setiap bahagian ke hologramnya, kemudian ketik pengatur hingga kelajuan 5
await levelBaharu(7, 'RodKanopi');
// Bilah bertindih di atas meja dan mana-mana bilah boleh dipasang pada mana-mana lengan: seret bilah
// yang masih di meja (paling bawah di skrin) ke hologram bilah yang belum berisi.
const bilahSeterusnya = async () => {
  const b = await Promise.all([1, 2, 3].map((i) => titik('Bilah' + i)));
  const h = await Promise.all([1, 2, 3].map((i) => titik('Hantu_Bilah' + i)));
  const diMeja = b.map((p, i) => [p, i]).filter(([p]) => !h.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 6)).sort((x, y) => y[0].y - x[0].y)[0][1];
  const kosong = h.findIndex((q) => !b.some((p) => Math.hypot(p.x - q.x, p.y - q.y) < 6));
  return ['Bilah' + (diMeja + 1), 'Hantu_Bilah' + (kosong + 1)];
};
for (const n of ['RodKanopi', 'Motor']) await seret(n, 'Hantu_' + n);
for (let i = 0; i < 3; i++) { const [a, b] = await bilahSeterusnya(); await seret(a, b); }
for (const n of ['Penutup', 'Pengatur']) await seret(n, 'Hantu_' + n);
for (let i = 0; i < 5; i++) await ketik('Pengatur', 450);
await page.screenshot({ path: join(keluar, 'main-level7-kipas.png') });
console.log('L7:', await tamat('TERUSKAN: LEVEL 8'));

// Level 8 — empat ujian multimeter (MCB, dial, kuar: ketik kuar kemudian ketik titik)
await levelBaharu(8, 'KuarMerah');
await page.waitForTimeout(600);
const ujianL8 = [[1, 2, 'SoketE', 'BarE'], [0, 1, 'SoketL', 'SoketE'], [1, 2, 'SoketL', 'SoketN'], [0, 0, 'SoketN', 'SoketE']];
for (const [mcb, dial, m, h] of ujianL8) {
  for (let i = 0; i < mcb; i++) await ketik('MCB_Soket', 900);
  for (let i = 0; i < dial; i++) await ketik('DialMeter', 400);
  await ketik('KuarMerah', 500); await ketik('TitikUji_' + m, 900, asal);
  await ketik('KuarHitam', 500); await ketik('TitikUji_' + h, 900, asal);
  console.log('L8 ujian:', await page.textContent('#s-level8 .hud-arahan'));
  await page.waitForTimeout(4600);
}
console.log('L8:', await tamat('TERUSKAN: LEVEL 9'));

// Level 9 — ketik komponen kemudian ketik sasaran; suis utama, TEST, set semula RCCB
await levelBaharu(9, 'RCCB');
for (const n of ['RCCB', 'MCB_6', 'MCB_20', 'MCB_32']) { await ketik(n, 500); await ketik('Hantu_' + n, 900); }
for (const n of ['6', '20', '32']) { await ketik('Gegelung_' + n, 500); await ketik('Hantu_Kabel_' + n, 1300, asal); }
await ketik('SuisUtama', 1500);
await ketik('ButangTest_RCCB', 1500);
await ketik('RCCB', 200);
await page.waitForTimeout(6000);
await page.screenshot({ path: join(keluar, 'main-level9-menyala.png') });
console.log('L9:', await tamat('LIHAT KEPUTUSAN'));

await page.waitForSelector('#s-keputusan.aktif');
await page.waitForTimeout(1800);
console.log('Keputusan:', await page.textContent('#kp-xp'), '|', await page.textContent('#kp-lencana'), '|', await page.textContent('#kp-jumlah'));
await page.screenshot({ path: join(keluar, 'main-keputusan.png') });

// Kemajuan kekal selepas muat semula?
await page.goto('http://127.0.0.1:8765/index.html?pratonton&skrin=pilih');
await page.waitForTimeout(600);
console.log('Selepas muat semula:', await xp());
await page.screenshot({ path: join(keluar, 'main-pilih.png') });
console.log('Ralat:', ralat.length ? ralat : 'tiada');
await browser.close();
