// Ujian pantas satu skrin AR dalam mod pratonton: tangkap skrin selepas N ms, laporkan ralat.
// Guna: node tools/uji-l.mjs <skrin> <fail.png> [ms] [skrip-ketik.json]
import { chromium } from 'playwright';
const [skrin, fail, ms = '3500'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
let ralat = 0;
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { if (m.type() === 'error') ralat++; console.log('konsol:', m.type(), m.text()); } });
page.on('pageerror', (e) => { ralat++; console.log('ralat:', e.message); });
page.on('requestfailed', (r) => { ralat++; console.log('gagal muat:', r.url()); });
await page.goto(`http://127.0.0.1:8765/index.html?pratonton&skrin=${skrin}`);
await page.waitForTimeout(Number(ms));
if (process.env.SKRIP) { const f = new Function('page', `return (async () => { ${process.env.SKRIP} })()`); await f(page); }
await page.screenshot({ path: fail });
console.log(`ralat=${ralat}`);
await browser.close();
