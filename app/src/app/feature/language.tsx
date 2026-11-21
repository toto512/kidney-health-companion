import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BigButton, Body, H1, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { Lang, LANGUAGES } from '@/i18n/core';

// Each language is shown by its own name, so a person who cannot read the current language can still find theirs.
export default function LanguageScreen() {
  const { t, lang, setLang } = useI18n();
  const [saved, setSaved] = useState(false);
  const choose = (l: Lang) => { setSaved(false); void setLang(l).then(() => setSaved(true)).catch(() => {}); };
  return (
    <ScrollView>
      <Screen>
        <H1>{t('language.title')}</H1>
        <Body>{t('language.intro')}</Body>
        <Segmented label={t('language.title')} value={lang} options={LANGUAGES.map((l) => ({ value: l.code, label: l.native }))} onChange={choose} />
        {lang !== 'en' ? <Body>{t('language.review')}</Body> : null}
        {saved ? <View accessibilityLiveRegion="polite"><Body>{t('language.saved')}</Body></View> : null}
        <BigButton variant="secondary" label={t('tab.profile')} onPress={() => router.back()} />
        <View style={{ height: 110 }} />
      </Screen>
    </ScrollView>
  );
}
