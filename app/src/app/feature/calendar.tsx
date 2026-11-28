import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BigButton, Body, DisclaimerFooter, H1, H2, Panel, Screen } from '@/components/ui';
import { calendarDate, isRtl, ltrIsolate } from '@/i18n/core';
import { calendarHint, remindLabel, repeatLabel, templateName, timeLabel } from '@/i18n/labels';
import { useI18n } from '@/i18n/I18nProvider';
import { loadAppointments, loadCalendarApp } from '@/lib/appointments';
import { CalendarApp } from '@/lib/calendarApp';
import { Appointment, cleanTime, itemsOn, markersFor, monthGrid, parseKey, shiftMonth, upcomingReminders, weekdayOrder, weekStartFor } from '@/lib/calendarLogic';
import { loadTasks } from '@/lib/myDay';
import { localDateKey, Task, weekdayName } from '@/lib/myDayLogic';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

// Month view. Appointments are the person's own; My day tasks are worked out from the days chosen on each task.
// Reminders are shown here in the app only: nothing rings or sends a message yet.
export default function Calendar() {
  const { t, lang } = useI18n();
  const color = useColors();
  const [now, setNow] = useState(() => new Date());
  const [shown, setShown] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const [selected, setSelected] = useState(() => localDateKey(new Date()));
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [appts, setAppts] = useState<Appointment[] | null>(null);
  const [calApp, setCalApp] = useState<CalendarApp | null>(null);
  const [err, setErr] = useState('');
  const todayKey = localDateKey(now);

  useFocusEffect(useCallback(() => {
    let alive = true;
    setNow(new Date());
    void loadCalendarApp().then((v) => { if (alive) setCalApp(v); });
    void Promise.all([loadTasks(), loadAppointments()]).then(([tk, ap]) => {
      if (!alive) return;
      if (!tk || !ap) { setErr(t('cal.errLoad')); return; }
      setErr(''); setTasks(tk); setAppts(ap);
    });
    return () => { alive = false; };
  }, []));

  const weekStart = weekStartFor(lang);
  const grid = useMemo(() => monthGrid(shown.year, shown.month, weekStart), [shown, weekStart]);
  const markers = useMemo(() => (tasks && appts ? markersFor(grid.flat(), tasks, appts) : new Map()), [grid, tasks, appts]);
  const selDate = parseKey(selected) ?? now;
  const items = tasks && appts ? itemsOn(tasks, appts, selDate) : null;
  const reminders = appts ? upcomingReminders(appts, now) : [];
  const rtl = isRtl(lang);
  const clock = (a: Appointment) => ltrIsolate(cleanTime(a.starts_at) ?? a.starts_at);

  const go = (delta: number) => setShown((s) => shiftMonth(s.year, s.month, delta));
  const goToday = () => { const n = new Date(); setNow(n); setShown({ year: n.getFullYear(), month: n.getMonth() }); setSelected(localDateKey(n)); };
  const navBtn = (label: string, glyph: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minHeight: MIN_TOUCH, paddingVertical: 8, minWidth: MIN_TOUCH, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: color.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: font.h2, fontWeight: '800', color: color.primary }}>{glyph}</Text>
    </Pressable>
  );
  const dot = (kind: 'appt' | 'task') => (
    <View accessible={false} style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: color.primary, backgroundColor: kind === 'appt' ? color.primary : 'transparent' }} />
  );

  const dayWord = (d: Date) => calendarDate(d, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <ScrollView>
      <Screen>
        <H1>{t('cal.title')}</H1>
        {err ? <Text accessibilityRole="alert" style={{ color: color.danger, fontSize: font.body, fontWeight: '600' }}>{err}</Text> : null}
        {!tasks && !appts && !err ? <Body>{t('emergency.loading')}</Body> : null}

        {reminders.length > 0 ? (
          <Panel>
            <H2>{t('cal.comingUp')}</H2>
            {reminders.map((r) => (
              <Text key={r.appointment.id + r.start.getTime()} style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>
                {t(localDateKey(r.start) === todayKey ? 'cal.reminderToday' : 'cal.reminderTomorrow', { title: r.appointment.title, raw: cleanTime(r.appointment.starts_at) ?? '' })}
              </Text>
            ))}
          </Panel>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          {navBtn(t('cal.prev'), rtl ? '›' : '‹', () => go(-1))}
          <View style={{ flexShrink: 1, flexGrow: 1, alignItems: 'center' }}>
            <H2>{calendarDate(new Date(shown.year, shown.month, 1), lang, { month: 'long', year: 'numeric' })}</H2>
          </View>
          {navBtn(t('cal.next'), rtl ? '‹' : '›', () => go(1))}
        </View>
        <BigButton variant="secondary" label={t('cal.today')} onPress={goToday} />

        <View accessibilityLabel={calendarDate(new Date(shown.year, shown.month, 1), lang, { month: 'long', year: 'numeric' })} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {weekdayOrder(weekStart).map((g) => (
              <View key={g} style={{ flex: 1, alignItems: 'center' }} accessible={false}>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontSize: font.body, fontWeight: '700', color: color.muted }}>{weekdayName((g + 6) % 7, lang, 'short')}</Text>
              </View>
            ))}
          </View>
          {grid.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 4 }}>
              {row.map((c) => {
                const mk = markers.get(c.key);
                const isToday = c.key === todayKey;
                const isSel = c.key === selected;
                const d = parseKey(c.key) as Date;
                const di = tasks && appts ? itemsOn(tasks, appts, d) : null;
                const a11y = `${dayWord(d)}. ${t('cal.dayCounts', { appts: di?.appointments.length ?? 0, tasks: di?.tasks.length ?? 0 })}`;
                return (
                  <Pressable key={c.key} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: isSel }}
                    onPress={() => { setSelected(c.key); if (!c.inMonth) setShown({ year: d.getFullYear(), month: d.getMonth() }); }}
                    style={{ flex: 1, minHeight: MIN_TOUCH + 8, paddingVertical: 8, borderRadius: 12, borderWidth: isSel ? 3 : 1, borderColor: isSel ? color.primary : color.border, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: c.inMonth ? 1 : 0.45 }}>
                    <View style={{ minWidth: 32, minHeight: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? color.primary : 'transparent' }}>
                      <Text style={{ fontSize: font.label, fontWeight: '700', color: isToday ? color.primaryText : color.text }}>{c.day}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, minHeight: 9 }}>
                      {mk?.appointments ? dot('appt') : null}
                      {mk?.tasks ? dot('task') : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }} accessible={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{dot('appt')}<Text style={{ fontSize: font.body, color: color.text }}>{t('cal.legendAppt')}</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{dot('task')}<Text style={{ fontSize: font.body, color: color.text }}>{t('cal.legendTask')}</Text></View>
        </View>

        <H2>{dayWord(selDate)}</H2>
        {items ? (
          <>
            <H2>{t('cal.apptHeading')}</H2>
            {items.appointments.length === 0 ? <Body>{t('cal.noAppts')}</Body> : null}
            {items.appointments.map((a) => (
              <Panel key={a.id}>
                <Text style={{ fontSize: font.h2, fontWeight: '800', color: color.text }}>{clock(a)}</Text>
                <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{a.title}</Text>
                {a.note ? <Body>{a.note}</Body> : null}
                <Body>{repeatLabel(t, a.repeat)}. {a.remind_minutes > 0 ? t('cal.reminderShort', { when: remindLabel(t, a.remind_minutes) }) : remindLabel(t, 0)}.</Body>
                <BigButton variant="secondary" label={t('cal.change')} onPress={() => router.push({ pathname: '/feature/appointment', params: { id: a.id } })} />
              </Panel>
            ))}
            <BigButton label={t('cal.addAppt')} onPress={() => router.push({ pathname: '/feature/appointment', params: { date: selected } })} />
            <Body>{calendarHint(t, calApp)}</Body>
            {appts?.some((a) => a.remind_minutes > 0) ? <Body>{t('cal.remindersNote')}</Body> : null}

            <H2>{t('cal.tasksHeading')}</H2>
            {items.tasks.length === 0 ? <Body>{t('cal.noTasks')}</Body> : null}
            {items.tasks.map((k) => (
              <Panel key={k.id}>
                <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{k.template_key ? templateName(t, k.template_key) : k.title}</Text>
                <Body>{timeLabel(t, k.time_of_day)}</Body>
              </Panel>
            ))}
            <Body>{t('cal.tasksNote')}</Body>
            <BigButton variant="secondary" label={t('cal.openMyDay')} onPress={() => router.push('/feature/my-day')} />
          </>
        ) : null}
        <BigButton variant="secondary" label={t('myday.back')} onPress={goBack} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
