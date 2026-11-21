import { supabase } from './supabase';
import { CalendarApp, isCalendarApp } from './calendarApp';
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

// The calendar the person says they use (profiles.calendar_app, migration 0017). Before the migration is run the column is missing: the error is ignored and the choice reads as not set.
export async function loadCalendarApp(): Promise<CalendarApp | null> {
  const { data, error } = await supabase.from('profiles').select('calendar_app').maybeSingle();
  if (error) return null;
  const v = (data as { calendar_app?: unknown } | null)?.calendar_app;
  return isCalendarApp(v) ? v : null;
}
export async function saveCalendarApp(v: CalendarApp): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return false;
  const { error } = await supabase.from('profiles').upsert({ user_id: u.user.id, calendar_app: v });
  return !error;
}
