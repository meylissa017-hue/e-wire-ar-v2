// Ujian asap: buka setiap skrin dalam mod pratonton (tanpa kamera) pada saiz telefon,
// simpan tangkapan skrin, dan laporkan ralat konsol.
// Guna: (pelayan setempat pada port 8765 di akar projek)  node tools/uji.mjs [folder-keluaran]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const keluar = process.argv[2] || join(process.cwd(), 'uji-keluaran');
mkdirSync(keluar, { recursive: true });
const asas = 'http://127.0.0.1:8765/index.html?pratonton';
const skrin = (process.argv[3] || 'menu,pilih,level1,level2,level3,level4,level5,level6,level7,level8,level9,kampung,solar,litar,keputusan').split(',');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
let ralat = 0;
for (const s of skrin) {
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') { ralat++; console.log(`[${s}] konsol:`, m.text()); } });
  page.on('pageerror', (e) => { ralat++; console.log(`[${s}] ralat:`, e.message); });
  page.on('requestfailed', (r) => { ralat++; console.log(`[${s}] gagal muat:`, r.url()); });
  await page.goto(`${asas}&skrin=${s}`);
  await page.waitForTimeout(s === 'solar' || s === 'litar' || s.startsWith('level1') || /level[5-9]|kampung/.test(s) ? 4500 : 1200);
  await page.screenshot({ path: join(keluar, `${s}.png`) });
  await page.close();
}
console.log(`Selesai. ${skrin.length} skrin, ${ralat} ralat.`);
await browser.close();
