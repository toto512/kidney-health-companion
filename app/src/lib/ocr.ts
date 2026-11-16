// Phones: on-device reading needs a development build with a native text-recognition module (planned, Phase 5). Until then the person types the values.
export type OcrResult = { ok: true; text: string } | { ok: false; reason: 'unsupported' | 'failed' };
export const ocrSupported = false;
export async function readTextFromFile(_uri: string, _mime: string, _onProgress?: (p: number) => void): Promise<OcrResult> {
  return { ok: false, reason: 'unsupported' };
}
