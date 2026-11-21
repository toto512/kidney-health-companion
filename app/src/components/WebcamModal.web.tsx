import { useEffect, useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { BigButton, Body } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { font, useColors } from '@/theme/tokens';
import type { Shot } from './UploadButtons';

// Desktop browser: shows the webcam, and "Take the picture" makes a JPEG on this device. Nothing is uploaded. If the browser refuses or has no camera, onFail runs and the caller falls back to the file picker.
export function WebcamModal({ onShot, onClose, onFail }: { onShot: (s: Shot) => void; onClose: () => void; onFail: () => void }) {
  const { t } = useI18n();
  const color = useColors();
  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera api');
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!live) { s.getTracks().forEach((x) => x.stop()); return; }
        stream.current = s;
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => undefined); }
        setReady(true);
      } catch {
        if (live) onFail();
      }
    })();
    return () => { live = false; stream.current?.getTracks().forEach((x) => x.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function shoot() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob((b) => {
      if (!b) { onFail(); return; }
      stream.current?.getTracks().forEach((x) => x.stop());
      onShot({ uri: URL.createObjectURL(b), mimeType: 'image/jpeg', fileSize: b.size });
    }, 'image/jpeg', 0.9);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 640, backgroundColor: color.surface, borderRadius: 16, padding: 16, gap: 12 }}>
          <Text accessibilityRole="header" style={{ fontSize: font.label, fontWeight: '700', color: color.text }}>{t('upload.photo')}</Text>
          <Body>{t('upload.webcamHint')}</Body>
          <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 8, backgroundColor: '#000', maxHeight: 400 }} />
          <BigButton label={t('upload.shoot')} onPress={shoot} disabled={!ready} />
          <BigButton variant="secondary" label={t('upload.cancel')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
