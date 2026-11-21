import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text } from 'react-native';
import { ConditionTiles } from '@/components/ConditionTiles';
import { ReferenceBlock } from '@/components/ReferenceBlock';
import { BigButton, Body, DisclaimerFooter, H1, Panel, Screen, SectionHeader } from '@/components/ui';
import { CONDITIONS, EXTRAS, sourceReviewOverdue } from '@/content/conditions';
import { hasTiles } from '@/content/conditionTiles';
import { useI18n } from '@/i18n/I18nProvider';
import { countryLabel } from '@/i18n/labels';
import { cardsFor } from '@/lib/conditionIds';
import { countryName, isSupported } from '@/lib/profile';
import { loadMyConditionIds } from '@/lib/userConditions';
import { supabase } from '@/lib/supabase';
import { AccentName, font, useColors } from '@/theme/tokens';

const ICON: Record<string, string> = { ckd: '🫘', gout: '🦶', hbp: '❤️', diabetes: '🩸', heart: '🫀' };
const ACCENT: Record<string, AccentName> = { ckd: 'teal', gout: 'orange', hbp: 'red', diabetes: 'purple', heart: 'red' };

// Shows only verbatim official quotes with link and check date. No advice, no numbers of ours.
export default function Conditions() {
  const color = useColors();
  const { t, lang } = useI18n();
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    supabase.from('profiles').select('country_code').maybeSingle().then(({ data }) => setCountry(data?.country_code ?? null));
  }, []);
  const [picked, setPicked] = useState<string[] | null | undefined>(undefined);
  useEffect(() => { void loadMyConditionIds().then(setPicked); }, []);
  const today = new Date();
  // Every condition the person picked gets a card. With none picked (or the list unreadable), the five with official definitions show as before.
  const cards = (picked && picked.length ? cardsFor(picked) : CONDITIONS.map((c) => ({ key: c.id, officialId: c.id, label: c.label })));

  return (
    <ScrollView>
      <Screen>
        <H1>{t('cond.title')}</H1>
        {country === undefined ? <Body>{t('common.loading')}</Body> : null}
        {country === null ? (
          <>
            <Body>{t('cond.chooseCountry')}</Body>
            <BigButton label={t('cond.openProfile')} onPress={() => router.push('/feature/profile')} />
          </>
        ) : null}
        {country && !isSupported(country) ? <Body>{t('cond.noCountry', { country: countryLabel(country, lang, countryName(country)) })}</Body> : null}
        {isSupported(country) ? (
          <>
            <Body>{t('cond.officialFor', { country: countryLabel(country, lang, countryName(country)) })}</Body>
            {picked === undefined ? <Body>{t('common.loading')}</Body> : null}
            {picked && picked.length > 1 ? <Body>{t('cond.disagree')}</Body> : null}
            {picked !== undefined ? <BigButton variant="secondary" label={t('cond.choose')} onPress={() => router.push('/feature/choose-conditions')} /> : null}
            {picked === undefined ? null : cards.map((card) => {
              const c = CONDITIONS.find((x) => x.id === card.officialId);
              if (!c) {
                return (
                  <Panel key={card.key}>
                    <SectionHeader icon="🩺" accent="blue">{card.label}</SectionHeader>
                    {hasTiles(card.officialId, country) ? <ConditionTiles country={country} condition={card.officialId} conditionLabel={card.label} accent="blue" others={cards.map((x) => ({ id: x.officialId, label: x.label }))} /> : <Body>{t('cond.noneYet')}</Body>}
                  </Panel>
                );
              }
              const f = c.facts[country];
              return (
                <Panel key={c.id}>
                  <SectionHeader icon={ICON[c.id] ?? '🩺'} accent={ACCENT[c.id] ?? 'blue'}>{c.label}</SectionHeader>
                  <Body>{'“'}{f.quote}{'”'}</Body>
                  {EXTRAS[`${c.id}.${country}`]?.symptoms ? <Body>{t('cond.symptoms', { q: EXTRAS[`${c.id}.${country}`].symptoms ?? '' })}</Body> : null}
                  {EXTRAS[`${c.id}.${country}`]?.getHelp ? <Body>{t('cond.getHelp', { q: EXTRAS[`${c.id}.${country}`].getHelp ?? '' })}</Body> : null}
                  <Body>{t('cond.source', { source: f.source })}{f.sourceType === 'charity' ? t('cond.charity') : ''}</Body>
                  <Body>{t('cond.reviewed', { page: f.pageReviewed ?? t('cond.noDate'), checked: f.checkedOn })}</Body>
                  {sourceReviewOverdue(f, today) ? <Body tone="danger">{t('cond.overdue')}</Body> : null}
                  <Pressable accessibilityRole="link" onPress={() => Linking.openURL(f.url)} style={{ minHeight: 56, justifyContent: 'center' }}>
                    <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary, textDecorationLine: 'underline' }}>{t('cond.openPage')}</Text>
                  </Pressable>
                  <ReferenceBlock country={country} condition={c.id} accent={ACCENT[c.id] ?? 'blue'} />
                  {hasTiles(c.id, country) ? <ConditionTiles country={country} condition={c.id} conditionLabel={c.label} accent={ACCENT[c.id] ?? 'blue'} others={cards.map((x) => ({ id: x.officialId, label: x.label }))} /> : null}
                </Panel>
              );
            })}
          </>
        ) : null}
        <BigButton variant="secondary" label={t('profile.backHealth')} onPress={() => router.replace('/')} />
        <DisclaimerFooter />
      </Screen>
    </ScrollView>
  );
}
