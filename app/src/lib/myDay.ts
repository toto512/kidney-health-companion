import { supabase } from './supabase';
import type { Task, TaskValid } from './myDayLogic';

// Owner-only rows (row-level security). null means the list could not be loaded.
export async function loadTasks(): Promise<Task[] | null> {
  const { data, error } = await supabase.from('my_day_tasks').select('id,template_key,title,time_of_day,days').order('created_at', { ascending: true });
  if (error) return null;
  return (data ?? []) as Task[];
}
export async function addTask(v: TaskValid): Promise<'ok' | 'limit' | 'duplicate' | 'error'> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return 'error';
  const { error } = await supabase.from('my_day_tasks').insert({ user_id: u.user.id, ...v });
  if (!error) return 'ok';
  if (error.code === '23505') return 'duplicate';
  return error.code === '23514' && /up to 20/i.test(error.message) ? 'limit' : 'error';
}
// A menu task keeps its words; only a typed task can change its title.
export async function updateTask(id: string, v: TaskValid): Promise<boolean> {
  const fields = v.template_key ? { time_of_day: v.time_of_day, days: v.days } : { title: v.title, time_of_day: v.time_of_day, days: v.days };
  const { error } = await supabase.from('my_day_tasks').update(fields).eq('id', id);
  return !error;
}
export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase.from('my_day_tasks').delete().eq('id', id);
  return !error;
}

// Ticks for one day (year-month-day in the person's own calendar). null means they could not be loaded.
export async function loadDone(day: string): Promise<Set<string> | null> {
  const { data, error } = await supabase.from('my_day_done').select('task_id').eq('day', day);
  if (error) return null;
  return new Set((data ?? []).map((r: { task_id: string }) => r.task_id));
}
export async function setDone(taskId: string, day: string, on: boolean): Promise<boolean> {
  if (on) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user?.id) return false;
    const { error } = await supabase.from('my_day_done').insert({ user_id: u.user.id, task_id: taskId, day });
    return !error || error.code === '23505'; // already ticked counts as ticked
  }
  const { error } = await supabase.from('my_day_done').delete().eq('task_id', taskId).eq('day', day);
  return !error;
}
