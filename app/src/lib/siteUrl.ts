import { Platform } from 'react-native';
import { resolveSiteUrl } from './siteUrlLogic';

// Where emailed links and social sign-in return to: EXPO_PUBLIC_SITE_URL, else the page's own origin on web, else undefined (phone apps).
export const siteUrl = () =>
  resolveSiteUrl(process.env.EXPO_PUBLIC_SITE_URL, Platform.OS === 'web' ? window.location.origin : undefined);
