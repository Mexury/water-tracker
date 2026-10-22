// Renders every glass in src/lib/glass3d/specs.ts to assets/glasses/<id>.png
// using headless Chromium. Run: node scripts/render-glass-thumbs.mjs
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const { outputFiles } = await build({
  entryPoints: ['scripts/glass-thumbs.entry.ts'],
  bundle: true,
  write: false,
  format: 'iife',
});
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage();
page.on('console', (m) => console.log('[page]', m.text()));
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ content: outputFiles[0].text });
const thumbs = await page.evaluate(() => window.thumbs);
await browser.close();

mkdirSync('assets/glasses', { recursive: true });
for (const [id, url] of Object.entries(thumbs)) {
  writeFileSync(`assets/glasses/${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
console.log(`Rendered ${Object.keys(thumbs).length} glasses`);
