import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { DayPicker } from '@/components/DayPicker';
import { BigButton, Body, DisclaimerFooter, Field, H1, H2, Panel, Screen, Segmented } from '@/components/ui';
import { templateName, timeLabel, trError } from '@/i18n/labels';
import { useI18n } from '@/i18n/I18nProvider';
import { addTask, deleteTask, loadTasks, updateTask } from '@/lib/myDay';
import { canAddMore, daysSummary, EVERY_DAY, MAX_TASKS, MAX_TITLE, Task, TEMPLATES, TemplateKey, TimeOfDay, TIMES, validateTask } from '@/lib/myDayLogic';
import { font, useColors } from '@/theme/tokens';

type Form = { id: string | null; template: string | null; title: string; time: TimeOfDay; days: number };

// Add, change or remove the tasks on My day: from the menu of 12, or a task the person types.
export default function MyDayTasks() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [list, setList] = useState<Task[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // "Add" on a My day heading arrives with that time of day: open the own-task form with it chosen.
  const { add } = useLocalSearchParams<{ add?: string }>();
  useEffect(() => {
    if (add && (TIMES as readonly string[]).includes(add)) setForm({ id: null, template: null, title: '', time: add as TimeOfDay, days: EVERY_DAY });
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
  async function remove(id: string) {
    setBusy(true);
    const ok = await deleteTask(id);
    setBusy(false); setConfirmDel(null);
    if (!ok) { setErr(t('myday.errSave')); return; }
    await reload();
  }
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/feature/my-day'));
  const menu = list ? TEMPLATES.filter((tp) => !list.some((x) => x.template_key === tp.key)) : [];

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Screen>
        <H1>{t('myday.editTitle')}</H1>
        <Body>{t('myday.editIntro', { max: MAX_TASKS })}</Body>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        {list === null && !err ? <Body>{t('emergency.loading')}</Body> : null}
        {list && list.length === 0 && !form ? <Body>{t('myday.empty')}</Body> : null}

        {list?.map((x) => (
          <Panel key={x.id}>
            <H2>{nameOf(x)}</H2>
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

        {!form && list && canAddMore(list.length) ? (
          <>
            <BigButton label={t('myday.addOwn')} onPress={() => { setErr(''); setForm({ id: null, template: null, title: '', time: 'morning', days: EVERY_DAY }); }} />
            {menu.length ? <H2>{t('myday.menuTitle')}</H2> : <Body>{t('myday.menuAllAdded')}</Body>}
            {menu.map((tp) => (
              <BigButton key={tp.key} variant="secondary" label={templateName(t, tp.key)} onPress={() => { setErr(''); setForm({ id: null, template: tp.key, title: '', time: tp.time, days: tp.days }); }} />
            ))}
          </>
        ) : null}
        {list && !canAddMore(list.length) && !form ? <Body>{t('myday.full', { max: MAX_TASKS })}</Body> : null}

        <BigButton variant="secondary" label={t('myday.back')} onPress={goBack} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
