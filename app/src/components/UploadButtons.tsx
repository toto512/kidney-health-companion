import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useI18n } from '@/i18n/I18nProvider';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';
import { Body } from '@/components/ui';
import { WebcamModal } from './WebcamModal';

export type Shot = { uri: string; mimeType?: string | null; fileSize?: number | null };

// A phone or tablet browser has a touch screen and uses the system camera. A computer browser opens the webcam in a window instead.
function touchScreen(): boolean {
  try { return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches; } catch { return false; }
}

// Our own simple icons (drawn here, no outside artwork): an open folder and a camera. Decorative, so the buttons carry the spoken labels.
export function FolderIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M5 14a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M5 22h38" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
export function CameraIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M6 17a3 3 0 0 1 3-3h6l3-4h12l3 4h6a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={24} cy={26} r={7} fill="none" stroke={color} strokeWidth={3} />
      <Rect x={36} y={18} width={3} height={3} rx={1} fill={color} />
    </Svg>
  );
}

function Big({ label, a11y, icon, onPress, disabled }: { label: string; a11y: string; icon: 'folder' | 'camera'; onPress: () => void; disabled?: boolean }) {
  const color = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} disabled={disabled} onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 140, minHeight: Math.max(MIN_TOUCH, 72), borderRadius: 12, borderWidth: 2, borderColor: color.primary, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 8, opacity: disabled ? 0.5 : 1 }}>
      {icon === 'folder' ? <FolderIcon color={color.primary} /> : <CameraIcon color={color.primary} />}
      <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

// One line and two big buttons, the same on every screen where a file or picture can be read, on phones and computers alike.
// Photo: the system camera on phones and tablets; on a computer the webcam (if the browser allows it), otherwise a picture file with a short line saying so.
export function UploadButtons({ onFile, onAsset, disabled }: { onFile: () => void; onAsset: (a: Shot | undefined) => void; disabled?: boolean }) {
  const { t } = useI18n();
  const muted = useColors().muted;
  const [webcam, setWebcam] = useState(false);
  const [note, setNote] = useState('');

  async function pickImage() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
    if (!res.canceled) onAsset(res.assets[0]);
  }
  async function photo() {
    setNote('');
    if (Platform.OS !== 'web' || touchScreen()) {
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!res.canceled) onAsset(res.assets[0]);
      return;
    }
    setWebcam(true);
  }
  function failed() { setWebcam(false); setNote(t('upload.noWebcam')); void pickImage(); }

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: font.body, color: muted }}>{t('upload.hint')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Big icon="folder" label={t('upload.file')} a11y={t('upload.fileA11y')} onPress={onFile} disabled={disabled} />
        <Big icon="camera" label={t('upload.photo')} a11y={t('upload.photoA11y')} onPress={() => void photo()} disabled={disabled} />
      </View>
      {note ? <Body>{note}</Body> : null}
      {webcam ? <WebcamModal onClose={() => setWebcam(false)} onFail={failed} onShot={(a) => { setWebcam(false); onAsset(a); }} /> : null}
    </View>
  );
}
