import * as Haptics from "expo-haptics";

/** Lehká odezva při výběru odpovědi (neblokuje UI při chybě modulu). */
export function hapticLight(): void {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* Expo Go / web */
  }
}

export function hapticSuccess(): void {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* ignore */
  }
}
