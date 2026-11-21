// On-device reading in the browser. The file never leaves the device: text PDFs are read directly, photos and scanned PDFs go through tesseract.js (WebAssembly).
// The engine and language files are served from this site (public/ocr, copied by scripts/copy-ocr-assets.mjs), never from a third-party CDN.
import type { OcrResult } from './ocr';
export type { OcrResult };
export const ocrSupported = true;

const MAX_PAGES = 5;

async function ocrImage(source: string | HTMLCanvasElement, onProgress?: (p: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const base = `${globalThis.location.origin}/ocr`;
  const worker = await createWorker(['eng', 'fra'], 1, { workerPath: `${base}/worker.min.js`, workerBlobURL: false, corePath: `${base}/core`, langPath: `${base}/lang`, logger: (m: { status: string; progress: number }) => { if (m.status === 'recognizing text') onProgress?.(m.progress); } });
  try {
    const { data } = await worker.recognize(source as never);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function readPdf(uri: string, onProgress?: (p: number) => void): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Run the PDF reader in the page instead of a separate worker file, so the bundler needs no extra asset.
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
  const data = new Uint8Array(await (await fetch(uri)).arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = Math.min(doc.numPages, MAX_PAGES);
  let out = '';
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Rebuild lines from text positions: items on the same baseline form one line.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items as { str?: string; transform: number[] }[]) {
      if (!it.str) continue;
      const y = Math.round(it.transform[5] / 3);
      const r = rows.get(y) ?? [];
      r.push({ x: it.transform[4], s: it.str });
      rows.set(y, r);
    }
    let text = [...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, r]) => r.sort((a, b) => a.x - b.x).map((c) => c.s).join(' ')).join('\n');
    if (text.replace(/\s/g, '').length < 40) {
      // Scanned page: draw it and read it as a photo.
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport } as never).promise;
      text = await ocrImage(canvas, (p) => onProgress?.((i - 1 + p) / pages));
    } else onProgress?.(i / pages);
    out += text + '\n';
  }
  return out;
}

export async function readTextFromFile(uri: string, mime: string, onProgress?: (p: number) => void): Promise<OcrResult> {
  try {
    const text = mime === 'application/pdf' ? await readPdf(uri, onProgress) : await ocrImage(uri, onProgress);
    return { ok: true, text };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
