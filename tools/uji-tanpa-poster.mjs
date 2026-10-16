// Ujian: (1) kamera nampak gambar BUKAN poster -> objek 3D tidak muncul;
// (2) kamera ditolak -> panel "KAMERA TIDAK DAPAT DIBUKA" muncul, objek 3D tidak dipaparkan senyap.
// Guna: node tools/uji-tanpa-poster.mjs <bukan-poster.mjpeg> [skrin,skrin…]
import { chromium } from 'playwright';

const [, , video, senarai] = process.argv;
const skrin = (senarai || 'level6,kampung').split(',');
const ASAS = process.env.ASAS || 'http://127.0.0.1:8765/';
const objekNampak = (p) => p.evaluate(() => document.body.classList.contains('pratonton'));

let b = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${video}`] });
let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, permissions: ['camera'] });
let p = await ctx.newPage();
for (const s of skrin) {
  await p.goto(`${ASAS}index.html?skrin=${s}`);
  await p.waitForTimeout(9000);
  const r = await p.evaluate(() => ({ imbas: !!document.querySelector('.skrin.aktif .bingkai-imbas:not([hidden])') && getComputedStyle(document.querySelector('.skrin.aktif .bingkai-imbas')).display !== 'none', hidup: document.body.className }));
  console.log(`bukan poster ${s}:`, JSON.stringify(r), 'pratonton=', await objekNampak(p));
}
await b.close();

b = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
p = await ctx.newPage();
await p.goto(`${ASAS}index.html?skrin=${skrin[0]}`);
await p.waitForTimeout(5000);
console.log('kamera ditolak: panel=', await p.isVisible('#m-kamera'), 'pratonton=', await objekNampak(p));
await p.click('#m-kamera [data-pilih="pratonton"]');
await p.waitForTimeout(3000);
console.log('pilih tanpa kamera: panel=', await p.isVisible('#m-kamera'), 'pratonton=', await objekNampak(p));
await b.close();
