import type { CsvRow } from './labCsv';
import { supabase } from './supabase';
import type { TestKey } from './labTests';

export const BUCKET = 'lab-files';
export const MAX_BYTES = 10 * 1024 * 1024;
export const FILE_EXT: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export type LabValue = { id: string; test: TestKey; value: number; unit: string; corrected: boolean };
export type LabReport = { id: string; taken_on: string; lab: string | null; file_path: string | null; file_type: string | null; results: LabValue[] };
export type NewValue = { test: TestKey; value: number; unit: string; corrected: boolean };
export type NewFile = { uri: string; mime: string };
export type SaveError = 'signin' | 'fileType' | 'fileSize' | 'upload' | 'save';

function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  throw new Error('no random source');
}

// null means it could not be loaded.
export async function loadReports(): Promise<LabReport[] | null> {
  const { data, error } = await supabase.from('lab_reports').select('id,taken_on,lab,file_path,file_type,lab_results(id,test,value,unit,corrected)').order('taken_on', { ascending: false }).limit(200);
  if (error) return null;
  return (data ?? []).map((r) => ({ ...(r as unknown as LabReport), results: ((r as { lab_results?: LabValue[] }).lab_results ?? []).map((v) => ({ ...v, value: Number(v.value) })) }));
}

// Saves the original (if any), then the report, then the confirmed values. If a later step fails the earlier ones are removed, so nothing half-saved stays behind.
export async function saveReport(input: { takenOn: string; lab: string; file: NewFile | null; values: NewValue[] }): Promise<{ ok: true; id: string } | { ok: false; error: SaveError }> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return { ok: false, error: 'signin' };
  const id = uuid();
  let path: string | null = null;
  if (input.file) {
    const ext = FILE_EXT[input.file.mime];
    if (!ext) return { ok: false, error: 'fileType' };
    let blob: Blob;
    try { blob = await (await fetch(input.file.uri)).blob(); } catch { return { ok: false, error: 'upload' }; }
    if (blob.size > MAX_BYTES) return { ok: false, error: 'fileSize' };
    path = `${uid}/${id}.${ext}`;
    const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: input.file.mime, upsert: false });
    if (up.error) return { ok: false, error: 'upload' };
  }
  const undo = async () => { if (path) await supabase.storage.from(BUCKET).remove([path]); await supabase.from('lab_reports').delete().eq('id', id); };
  const rep = await supabase.from('lab_reports').insert({ id, user_id: uid, taken_on: input.takenOn, lab: input.lab.trim() || null, file_path: path, file_type: input.file?.mime ?? null });
  if (rep.error) { await undo(); return { ok: false, error: 'save' }; }
  const vals = await supabase.from('lab_results').insert(input.values.map((v) => ({ user_id: uid, report_id: id, test: v.test, value: v.value, unit: v.unit, taken_on: input.takenOn, corrected: v.corrected })));
  if (vals.error) { await undo(); return { ok: false, error: 'save' }; }
  return { ok: true, id };
}

// File first, then rows: if the file removal fails nothing is deleted and the person can try again.
export async function deleteReport(r: Pick<LabReport, 'id' | 'file_path'>): Promise<boolean> {
  if (r.file_path) { const { error } = await supabase.storage.from(BUCKET).remove([r.file_path]); if (error) return false; }
  const { error } = await supabase.from('lab_reports').delete().eq('id', r.id);
  return !error;
}

export async function deleteAllLabData(): Promise<boolean> {
  const { data, error } = await supabase.from('lab_reports').select('id,file_path');
  if (error) return false;
  const paths = (data ?? []).map((r) => r.file_path as string | null).filter((p): p is string => !!p);
  if (paths.length) { const rm = await supabase.storage.from(BUCKET).remove(paths); if (rm.error) return false; }
  const del = await supabase.from('lab_reports').delete().in('id', (data ?? []).map((r) => r.id as string));
  return !del.error;
}

// Short-lived link (60 s) to one original, opened by the person on request.
export async function originalUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  return error ? null : data.signedUrl;
}

export async function exportRows(): Promise<CsvRow[] | null> {
  const { data, error } = await supabase.from('lab_results').select('test,value,unit,taken_on,lab_reports(lab)').order('taken_on', { ascending: true }).limit(5000);
  if (error) return null;
  return (data ?? []).map((r) => ({ taken_on: r.taken_on as string, test: r.test as string, value: Number(r.value), unit: r.unit as string, lab: ((r as unknown as { lab_reports: { lab: string | null } | null }).lab_reports?.lab) ?? null }));
}
