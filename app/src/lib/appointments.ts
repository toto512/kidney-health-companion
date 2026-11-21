import { supabase } from './supabase';
import type { Appointment, ApptValid } from './calendarLogic';

// Owner-only rows (row-level security). null means the list could not be loaded. Titles and notes can reveal health information: never log them.
const COLS = 'id,title,note,starts_on,starts_at,repeat,remind_minutes';
export async function loadAppointments(): Promise<Appointment[] | null> {
  const { data, error } = await supabase.from('appointments').select(COLS).order('starts_on', { ascending: true }).order('starts_at', { ascending: true });
  if (error) return null;
  return (data ?? []) as Appointment[];
}
export async function addAppointment(v: ApptValid): Promise<'ok' | 'limit' | 'error'> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return 'error';
  const { error } = await supabase.from('appointments').insert({ user_id: u.user.id, ...v });
  if (!error) return 'ok';
  return error.code === '23514' && /up to \d+ appointments/i.test(error.message) ? 'limit' : 'error';
}
export async function updateAppointment(id: string, v: ApptValid): Promise<boolean> {
  const { error } = await supabase.from('appointments').update(v).eq('id', id);
  return !error;
}
export async function deleteAppointment(id: string): Promise<boolean> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  return !error;
}
