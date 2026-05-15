import { Alert, Platform } from 'react-native';

export function notify(title, message, buttons) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    const text = message ? `${title}\n\n${message}` : title;
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(text);
      if (confirmed) {
        const action = buttons.find((b) => b.style !== 'cancel');
        action?.onPress?.();
      } else {
        const cancel = buttons.find((b) => b.style === 'cancel');
        cancel?.onPress?.();
      }
      return;
    }
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }
  Alert.alert(title, message, buttons);
}
