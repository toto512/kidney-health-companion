import { Linking, Platform, Share } from 'react-native';

// Hands the person a text file: a download in the browser, the share sheet on a phone.
export async function saveTextFile(name: string, text: string, mime = 'text/csv'): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }
  await Share.share({ message: text, title: name });
}

export async function openLink(url: string): Promise<void> {
  if (Platform.OS === 'web') { window.open(url, '_blank', 'noopener,noreferrer'); return; }
  await Linking.openURL(url);
}
