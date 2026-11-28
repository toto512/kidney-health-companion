/**
 * Supabase returns the TOTP QR as an SVG data URI such as `data:image/svg+xml;utf-8,<svg ...>`.
 * The `utf-8` parameter is not a valid media-type parameter and the markup is not percent-encoded,
 * so browsers refuse to render it as an image. Re-encode it into a valid data URI.
 */
export function normalizeSvgDataUri(qr: string): string {
  const m = /^data:image\/svg\+xml;?(?:charset=)?utf-8,(.*)$/is.exec(qr);
  if (!m) return qr;
  let svg = m[1];
  try { svg = decodeURIComponent(svg); } catch { /* already raw markup */ }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
