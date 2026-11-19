import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, H2, Screen } from '@/components/ui';
import { localeTag } from '@/i18n/core';
import { templateName, timeLabel } from '@/i18n/labels';
import { useI18n } from '@/i18n/I18nProvider';
import type { Key } from '@/i18n/strings/en';
import { loadDone, loadTasks, setDone } from '@/lib/myDay';
import { canAddMore, groupByTime, localDateKey, progress, Task, TemplateLink, templateFor, TIMES } from '@/lib/myDayLogic';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

// The tool a row can open. The words are the same ones the Today cards use.
const TOOL_NAME: Record<TemplateLink, Key> = { '/feature/medications': 'cat.medications', '/feature/blood-pressure': 'today.bpTitle', '/feature/my-people': 'today.peopleTitle' };

// Today's list. The person ticks each task themselves; a tick can be undone. Nothing here tracks doses or alerts anyone.
export default function MyDay() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [done, setDoneIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => new Date());
  const [err, setErr] = useState('');
  const day = localDateKey(now);

  useFocusEffect(useCallback(() => {
    let alive = true;
    const n = new Date();
    setNow(n);
    void Promise.all([loadTasks(), loadDone(localDateKey(n))]).then(([tk, dn]) => {
      if (!alive) return;
      if (!tk || !dn) { setErr(t('myday.errLoad')); return; }
      setErr(''); setTasks(tk); setDoneIds(dn);
    });
    return () => { alive = false; };
  }, []));

  const flip = (id: string, on: boolean) => setDoneIds((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });
  async function toggle(task: Task) {
    const on = !done.has(task.id);
    setErr('');
    flip(task.id, on);
    const ok = await setDone(task.id, day, on);
    if (!ok) { flip(task.id, !on); setErr(t('myday.errSave')); }
  }

  function row(task: Task) {
    const isDone = done.has(task.id);
    const name = task.template_key ? templateName(t, task.template_key) : task.title ?? '';
    const link = templateFor(task.template_key)?.link;
    return (
      <View key={task.id} style={{ borderRadius: 20, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, padding: 16, gap: 8 }}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: isDone }} accessibilityLabel={name} onPress={() => void toggle(task)}
          style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View accessible={false} style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 3, borderColor: color.primary, backgroundColor: isDone ? color.primary : color.bg, alignItems: 'center', justifyContent: 'center' }}>
            {isDone ? <Text style={{ color: color.primaryText, fontSize: 26, fontWeight: '800' }}>✓</Text> : null}
          </View>
          <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.text }}>{name}</Text>
        </Pressable>
        {link ? (
          <Pressable accessibilityRole="link" accessibilityLabel={t('myday.openTool', { tool: t(TOOL_NAME[link]) })} onPress={() => router.push(link)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
            <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>{t('myday.openTool', { tool: t(TOOL_NAME[link]) })}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const p = tasks ? progress(tasks, done, now) : null;
  const groups = tasks ? groupByTime(tasks, now) : [];
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <ScrollView>
      <Screen>
        <H1>{t('myday.title')}</H1>
        <Body>{now.toLocaleDateString(localeTag(lang), { weekday: 'long', month: 'long', day: 'numeric' })}</Body>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        {tasks === null && !err ? <Body>{t('emergency.loading')}</Body> : null}
        {p && p.total > 0 ? <Text accessibilityLiveRegion="polite" style={{ fontSize: font.h2, fontWeight: '800', color: color.text }}>{t('myday.progress', { done: p.done, total: p.total })}</Text> : null}
        {tasks && tasks.length === 0 ? <Body>{t('myday.empty')}</Body> : null}
        {tasks && tasks.length > 0 && p?.total === 0 ? <Body>{t('myday.noneToday')}</Body> : null}
        {tasks ? TIMES.map((time) => (
          <View key={time} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexShrink: 1 }}><H2>{timeLabel(t, time)}</H2></View>
              {canAddMore(tasks.length) ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`${t('myday.addOwn')}: ${timeLabel(t, time)}`} onPress={() => router.push({ pathname: '/feature/my-day-tasks', params: { add: time } })}
                  style={{ minHeight: MIN_TOUCH, minWidth: 96, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: color.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary }}>{t('myday.addShort')}</Text>
                </Pressable>
              ) : null}
            </View>
            {(groups.find((g) => g.time === time)?.tasks ?? []).map(row)}
          </View>
        )) : null}
        {tasks ? <BigButton variant={tasks.length === 0 ? undefined : 'secondary'} label={tasks.length === 0 ? t('myday.start') : t('myday.change')} onPress={() => router.push('/feature/my-day-tasks')} /> : null}
        <Body>{t('myday.note')}</Body>
        <BigButton variant="secondary" label={t('myday.back')} onPress={goBack} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
