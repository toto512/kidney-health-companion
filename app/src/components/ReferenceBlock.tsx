import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Body } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { isGap, overdue, RefEntry, referenceFor, SOURCES, sourceLabel } from '@/content/reference';
import { Country } from '@/lib/profile';
import { AccentName, font, mix, useColors } from '@/theme/tokens';

const NOTE_MED = 'These are medicines the official pages name. This is not a list of what to take. Ask your doctor, nurse or pharmacist.';
const NOTE_LAB = 'These are typical ranges from the page, not your result. Your lab report is the authority. Ask your doctor, nurse or pharmacist.';

function Group({ title, note, entries, accent }: { title: string; note: string; entries: RefEntry[]; accent: AccentName }) {
  const color = useColors();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (entries.length === 0) return null;
  const today = new Date();
  // One source block per page, so the link, review date and check date are not repeated on every line.
  const order: string[] = [];
  for (const e of entries) if (!isGap(e) && !order.includes(e.src)) order.push(e.src);
  const gaps = entries.filter(isGap);
  return (
    <View style={{ gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}
        style={{ minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: color.accent[accent], paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: mix(color.accent[accent], color.surface, 0.06) }}>
        <Text style={{ flex: 1, fontSize: font.label, fontWeight: '700', color: color.accent[accent] }}>{title}</Text>
        <Text style={{ fontSize: font.label, fontWeight: '800', color: color.accent[accent] }}>{open ? t('common.hide') : t('common.show')}</Text>
      </Pressable>
      {open ? (
        <View style={{ gap: 14 }}>
          <Body>{note === NOTE_MED ? t('ref.noteMed') : note === NOTE_LAB ? t('ref.noteLab') : note}</Body>
          {order.map((id) => {
            const s = SOURCES[id];
            return (
              <View key={id} style={{ gap: 8, borderLeftWidth: 4, borderLeftColor: color.accent[accent], paddingLeft: 12 }}>
                {entries.filter((e) => !isGap(e) && e.src === id).map((e) => !isGap(e) && (
                  <View key={e.id} style={{ gap: 4 }}>
                    <Text style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{e.title}</Text>
                    {e.quotes.map((q, i) => <Text key={i} style={{ fontSize: font.body, lineHeight: 26, color: color.text }}>{'“'}{q}{'”'}</Text>)}
                    {e.names ? <Text style={{ fontSize: font.body, lineHeight: 26, color: color.muted }}>Named on the page: {e.names.join(', ')}.</Text> : null}
                  </View>
                ))}
                <Text style={{ fontSize: font.body, color: color.muted }}>Source: {sourceLabel(s)}.</Text>
                <Text style={{ fontSize: font.body, color: color.muted }}>{s.dateText ? `Page says: ${s.dateText}.` : 'The page shows no review date.'} We checked it on {s.checkedOn}.</Text>
                {overdue(s, today) ? <Text style={{ fontSize: font.body, fontWeight: '700', color: color.danger }}>The page{"'"}s own review date has passed. Check the page for newer information.</Text> : null}
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL(s.url)} style={{ minHeight: 48, justifyContent: 'center' }}>
                  <Text style={{ fontSize: font.body, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>Open the official page</Text>
                </Pressable>
              </View>
            );
          })}
          {gaps.map((g) => (
            <Text key={g.id} style={{ fontSize: font.body, lineHeight: 26, color: color.text }}><Text style={{ fontWeight: '700' }}>{g.title}:</Text> no official source found for your country, so nothing is shown.</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Medicines named and typical lab ranges for one condition in the user's country. Quotes only, no advice, no good or bad colours.
export function ReferenceBlock({ country, condition, accent }: { country: Country; condition: string; accent: AccentName }) {
  const entries = referenceFor(country, condition);
  const meds = entries.filter((e) => !isGap(e) && e.kind === 'medicine');
  const labs = entries.filter((e) => isGap(e) || e.kind === 'lab');
  return (
    <View style={{ gap: 10 }}>
      <Group title="Medicines the official page names" note={NOTE_MED} entries={meds} accent={accent} />
      <Group title="Typical ranges" note={NOTE_LAB} entries={labs} accent={accent} />
    </View>
  );
}
