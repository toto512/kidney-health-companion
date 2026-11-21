// Phones and the native app use the system camera (see UploadButtons). The webcam picture is a web-only feature: WebcamModal.web.tsx.
import type { Shot } from './UploadButtons';
export function WebcamModal(_props: { onShot: (s: Shot) => void; onClose: () => void; onFail: () => void }) {
  return null;
}
