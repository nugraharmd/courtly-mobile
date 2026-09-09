import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';
import { theme } from '../utils';

/**
 * Shared password rule (login + register):
 * min 6 chars with at least one letter, one number and one special character.
 */
export const passwordSchema = z
  .string()
  .min(6, 'Minimum 6 characters')
  .regex(/[A-Za-z]/, 'Needs at least one letter')
  .regex(/[0-9]/, 'Needs at least one number')
  .regex(/[^A-Za-z0-9]/, 'Needs at least one special character');

interface PasswordFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/** Password input with an eye / eye-slash toggle to show & hide the value. */
export function PasswordField({ value, onChangeText, placeholder = '••••••••' }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.box}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        secureTextEntry={!visible}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          setVisible((v) => !v);
        }}
        style={styles.eye}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.emoji}>👁️</Text>
          {!visible ? <View style={styles.slash} /> : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    padding: 14,
  },
  eye: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    position: 'relative',
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 19,
  },
  slash: {
    position: 'absolute',
    left: -1,
    right: -1,
    top: '50%',
    marginTop: -1,
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.muted,
    transform: [{ rotate: '-45deg' }],
  },
});
