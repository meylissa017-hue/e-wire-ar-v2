// Jana kad-qr-v2.png dan E-WIRE-AR-Kad-QR-V2-A4.pdf daripada kad-qr-v2.html (folder E-WIRE-AR-Poster).
// Guna: node tools/kad-qr-v2.mjs <folder-poster>
import { chromium } from 'playwright';
import { join } from 'path';
import { pathToFileURL } from 'url';

const dir = process.argv[2];
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
await p.goto(pathToFileURL(join(dir, 'kad-qr-v2.html')).href);
await p.waitForLoadState('networkidle');
const kad = await p.$('.kad');
await kad.screenshot({ path: join(dir, 'kad-qr-v2.png') });
const limpah = await p.evaluate(() => { const k = document.querySelector('.kad'); return k.scrollHeight - k.clientHeight; });
console.log('limpahan px:', limpah);
const c = await browser.newPage();
await c.goto(pathToFileURL(join(dir, 'kad-qr-cetak-v2.html')).href);
await c.waitForLoadState('networkidle');
await c.pdf({ path: join(dir, 'E-WIRE-AR-Kad-QR-V2-A4.pdf'), preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log('siap');
