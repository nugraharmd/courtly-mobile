import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Reusable circular back button without text (chevron only). Falls back to tabs when no history. */
export function BackButton({ onPress, style }: BackButtonProps) {
  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    void Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
    >
      <Text style={styles.chevron}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,18,32,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pressed: { opacity: 0.7 },
  chevron: { color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 26, marginTop: -2 },
});
