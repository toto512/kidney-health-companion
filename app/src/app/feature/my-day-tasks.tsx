import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { DayPicker } from '@/components/DayPicker';
import { BigButton, Body, DisclaimerFooter, Field, H1, H2, Panel, Screen, Segmented } from '@/components/ui';
import { templateHint, templateName, timeLabel, trError } from '@/i18n/labels';
import { useI18n } from '@/i18n/I18nProvider';
import { addTask, deleteTask, loadTasks, updateTask } from '@/lib/myDay';
import { canAddMore, daysSummary, EVERY_DAY, isHabit, MAX_TASKS, MAX_TITLE, menuAt, MENU, slotsLeft, Task, Template, TemplateKey, TimeOfDay, TIMES, validateTask } from '@/lib/myDayLogic';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

type Form = { id: string | null; template: string | null; title: string; time: TimeOfDay; days: number };

// Add, change or remove the tasks on My day: from the menu of 12, or a task the person types.
export default function MyDayTasks() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [list, setList] = useState<Task[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [pick, setPick] = useState<{ time: TimeOfDay; keys: TemplateKey[]; days: number } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // "Add" on a My day heading arrives with that time of day: open the own-task form with it chosen.
  const { add } = useLocalSearchParams<{ add?: string }>();
  useEffect(() => {
    if (add && (TIMES as readonly string[]).includes(add)) setPick({ time: add as TimeOfDay, keys: [], days: EVERY_DAY });
  }, [add]);

  const reload = useCallback(async () => {
    const l = await loadTasks();
    if (!l) { setErr(t('myday.errLoad')); return null; }
    setList(l);
    return l;
  }, []);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const nameOf = (x: Task) => (x.template_key ? templateName(t, x.template_key) : x.title ?? '');
  async function save() {
    if (!form) return;
    setErr('');
    const r = validateTask({ template: form.template, title: form.title, time: form.time, days: form.days });
    if (!r.ok) { setErr(trError(t, r.error)); return; }
    setBusy(true);
    let ok = false;
    if (form.id) ok = await updateTask(form.id, r.value);
    else {
      const res = await addTask(r.value);
      ok = res === 'ok';
      if (res === 'limit') { setBusy(false); setErr(t('myday.errLimit', { max: MAX_TASKS })); return; }
      if (res === 'duplicate') { setBusy(false); setErr(t('myday.errDuplicate')); return; }
    }
    setBusy(false);
    if (!ok) { setErr(t('myday.errSave')); return; }
    setForm(null);
    await reload();
  }
  // Adds every ticked menu task with the shared time and days. Stops at the first real failure and keeps what was saved.
  async function savePick() {
    if (!pick) return;
    setErr('');
    if (pick.keys.length === 0) { setErr(t('myday.pickNone')); return; }
    setBusy(true);
    let failure = '';
    const added: TemplateKey[] = [];
    for (const key of pick.keys) {
      const r = validateTask({ template: key, title: '', time: pick.time, days: isHabit(key) ? EVERY_DAY : pick.days });
      if (!r.ok) { failure = trError(t, r.error); break; }
      const res = await addTask(r.value);
      if (res === 'ok' || res === 'duplicate') { added.push(key); continue; }
      failure = res === 'limit' ? t('myday.errLimit', { max: MAX_TASKS }) : t('myday.errSave');
      break;
    }
    setBusy(false);
    await reload();
    if (failure) { setPick({ ...pick, keys: pick.keys.filter((k) => !added.includes(k)) }); setErr(failure); return; }
    setPick(null);
    goBack();
  }
  async function remove(id: string) {
    setBusy(true);
    const ok = await deleteTask(id);
    setBusy(false); setConfirmDel(null);
    if (!ok) { setErr(t('myday.errSave')); return; }
    await reload();
  }
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/feature/my-day'));
  const room = list ? slotsLeft(list.length) : 0;
  const menu = list ? MENU.filter((tp) => !list.some((x) => x.template_key === tp.key)) : [];

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('myday.editTitle')}</H1>
        <Body>{t('myday.editIntro', { max: MAX_TASKS })}</Body>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        {list === null && !err ? <Body>{t('emergency.loading')}</Body> : null}
        {list && list.length === 0 && !form && !pick ? <Body>{t('myday.empty')}</Body> : null}

        {list?.map((x) => (
          <Panel key={x.id}>
            <H2>{nameOf(x)}</H2>
            {templateHint(t, x.template_key) ? <Body>{templateHint(t, x.template_key)}</Body> : null}
            <Body>{t('myday.summary', { time: timeLabel(t, x.time_of_day), days: daysSummary(x.days, lang, t('myday.everyDay')) })}</Body>
            {confirmDel === x.id ? (
              <>
                <Body tone="danger">{t('myday.removeAsk', { task: nameOf(x) })}</Body>
                <BigButton label={t('myday.yesRemove')} disabled={busy} onPress={() => void remove(x.id)} />
                <BigButton variant="secondary" label={t('myday.keep')} onPress={() => setConfirmDel(null)} />
              </>
            ) : (
              <>
                <BigButton variant="secondary" label={t('myday.changeTask', { task: nameOf(x) })} onPress={() => { setErr(''); setForm({ id: x.id, template: x.template_key, title: x.title ?? '', time: x.time_of_day, days: x.days }); }} />
                <BigButton variant="secondary" label={t('myday.removeTask', { task: nameOf(x) })} onPress={() => setConfirmDel(x.id)} />
              </>
            )}
          </Panel>
        ))}

        {pick && list ? (() => {
          const available = menuAt(pick.time).filter((tp) => !list.some((x) => x.template_key === tp.key));
          const habits = available.filter((tp) => isHabit(tp.key));
          const chores = available.filter((tp) => !isHabit(tp.key));
          const row = (tp: Template) => {
            const on = pick.keys.includes(tp.key);
            const blocked = !on && pick.keys.length >= room;
            return (
              <Pressable key={tp.key} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: blocked }} accessibilityLabel={templateName(t, tp.key)} disabled={blocked}
                onPress={() => { setErr(''); setPick({ ...pick, keys: on ? pick.keys.filter((k) => k !== tp.key) : [...pick.keys, tp.key] }); }}
                style={{ minHeight: 64, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 16, opacity: blocked ? 0.4 : 1 }}>
                <View accessible={false} style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 3, borderColor: color.primary, backgroundColor: on ? color.primary : color.bg, alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <Text style={{ color: color.primaryText, fontSize: 26, fontWeight: '800' }}>✓</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{templateName(t, tp.key)}</Text>
                  {templateHint(t, tp.key) ? <Text style={{ fontSize: font.body, color: color.muted }}>{templateHint(t, tp.key)}</Text> : null}
                </View>
              </Pressable>
            );
          };
          return (
            <Panel>
              <H2>{t('myday.pickTitle', { time: timeLabel(t, pick.time) })}</H2>
              <Body>{t('myday.pickIntro')}</Body>
              <Body>{t('myday.pickSlots', { n: room })}</Body>
              {room > 0 ? <BigButton variant="secondary" label={t('myday.addOwn')} onPress={() => { setErr(''); setForm({ id: null, template: null, title: '', time: pick.time, days: pick.days }); setPick(null); }} /> : <Body tone="danger">{t('myday.pickFull')}</Body>}
              {available.length === 0 ? <Body>{t('myday.pickAllAdded')}</Body> : null}
              {habits.length > 0 ? <H2>{t('myday.pickHabits')}</H2> : null}
              {habits.length > 0 ? <Body>{t('myday.pickHabitsNote')}</Body> : null}
              {habits.map(row)}
              {chores.length > 0 ? <H2>{t('myday.pickChores')}</H2> : null}
              {chores.map(row)}
              {chores.length > 0 ? <DayPicker label={t('myday.daysLabel')} value={pick.days} onChange={(v) => { setPick({ ...pick, days: v }); setErr(''); }} /> : null}
              <BigButton label={busy ? t('myday.saving') : t('myday.pickSave')} disabled={busy} onPress={() => void savePick()} />
              <BigButton variant="secondary" label={t('myday.cancel')} onPress={() => { setPick(null); setErr(''); }} />
            </Panel>
          );
        })() : null}

        {form ? (
          <Panel>
            <H2>{form.id ? t('myday.formChange') : t('myday.formAdd')}</H2>
            {form.template ? <Body>{templateName(t, form.template as TemplateKey)}</Body>
              : <Field label={t('myday.titleLabel')} value={form.title} onChangeText={(v) => { setForm({ ...form, title: v }); setErr(''); }} maxLength={MAX_TITLE} />}
            <Text style={{ fontSize: font.label, fontWeight: '600', color: color.text }}>{t('myday.timeLabel')}</Text>
            <Segmented<TimeOfDay> label={t('myday.timeLabel')} value={form.time} options={TIMES.map((v) => ({ value: v, label: timeLabel(t, v) }))} onChange={(v) => { setForm({ ...form, time: v }); setErr(''); }} />
            <DayPicker label={t('myday.daysLabel')} value={form.days} onChange={(v) => { setForm({ ...form, days: v }); setErr(''); }} />
            <BigButton label={busy ? t('myday.saving') : t('myday.save')} disabled={busy} onPress={() => void save()} />
            <BigButton variant="secondary" label={t('myday.cancel')} onPress={() => { setForm(null); setErr(''); }} />
          </Panel>
        ) : null}

        {!form && !pick && list && canAddMore(list.length) ? (
          <>
            <BigButton label={t('myday.addOwn')} onPress={() => { setErr(''); setForm({ id: null, template: null, title: '', time: 'morning', days: EVERY_DAY }); }} />
            {menu.length ? <H2>{t('myday.menuTitle')}</H2> : <Body>{t('myday.menuAllAdded')}</Body>}
            {menu.map((tp) => (
              <BigButton key={tp.key} variant="secondary" label={templateName(t, tp.key)} onPress={() => { setErr(''); setForm({ id: null, template: tp.key, title: '', time: tp.time, days: tp.days }); }} />
            ))}
          </>
        ) : null}
        {list && !canAddMore(list.length) && !form && !pick ? <Body>{t('myday.full', { max: MAX_TASKS })}</Body> : null}

        <BigButton variant="secondary" label={t('myday.back')} onPress={goBack} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
