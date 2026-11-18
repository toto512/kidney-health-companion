import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useI18n } from '@/i18n/I18nProvider';
import { font, MIN_TOUCH, useColors } from '@/theme/tokens';

// Our own simple icons (drawn here, no outside artwork): an open folder and a camera. Decorative, so the buttons carry the spoken labels.
export function FolderIcon({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M5 14a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M5 22h38" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
export function CameraIcon({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M6 17a3 3 0 0 1 3-3h6l3-4h12l3 4h6a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={24} cy={26} r={7} fill="none" stroke={color} strokeWidth={3} />
      <Rect x={36} y={18} width={3} height={3} rx={1} fill={color} />
    </Svg>
  );
}

// A computer browser with a mouse has no camera to open: the Photo button shows only on phones and tablets (touch screens) and in the phone app.
export function cameraAvailable(): boolean {
  if (Platform.OS !== 'web') return true;
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function Big({ label, a11y, icon, onPress, disabled }: { label: string; a11y: string; icon: 'folder' | 'camera'; onPress: () => void; disabled?: boolean }) {
  const color = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} disabled={disabled} onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 140, minHeight: Math.max(MIN_TOUCH, 96), borderRadius: 14, borderWidth: 2, borderColor: color.primary, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 10, opacity: disabled ? 0.5 : 1 }}>
      {icon === 'folder' ? <FolderIcon color={color.primary} /> : <CameraIcon color={color.primary} />}
      <Text style={{ fontSize: font.label, fontWeight: '700', color: color.primary, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

// One line and two big buttons, the same on every screen where a file or picture can be read. At large text the buttons wrap onto two rows.
export function UploadButtons({ onFile, onCamera, disabled }: { onFile: () => void; onCamera: () => void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: font.body, color: useColors().muted }}>{t('upload.hint')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Big icon="folder" label={t('upload.file')} a11y={t('upload.fileA11y')} onPress={onFile} disabled={disabled} />
        {cameraAvailable() ? <Big icon="camera" label={t('upload.photo')} a11y={t('upload.photoA11y')} onPress={onCamera} disabled={disabled} /> : null}
      </View>
    </View>
  );
}
