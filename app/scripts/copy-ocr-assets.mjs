// Copies the text-reading engine and language files into public/ocr so the web app serves them itself.
// The app then never fetches anything from a third-party CDN when a person reads a lab sheet. public/ocr is generated, not committed.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'ocr');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'core'), { recursive: true });
mkdirSync(join(out, 'lang'), { recursive: true });

cpSync(join(root, 'node_modules/tesseract.js/dist/worker.min.js'), join(out, 'worker.min.js'));
const core = join(root, 'node_modules/tesseract.js-core');
for (const f of readdirSync(core)) if (/lstm\.wasm\.js$/.test(f)) cpSync(join(core, f), join(out, 'core', f));
for (const l of ['eng', 'fra']) {
  const src = join(root, `node_modules/@tesseract.js-data/${l}/4.0.0_best_int/${l}.traineddata.gz`);
  if (!existsSync(src)) throw new Error('missing language file: ' + src);
  cpSync(src, join(out, 'lang', `${l}.traineddata.gz`));
}
console.log('OCR assets copied to public/ocr');
