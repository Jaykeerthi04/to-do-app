import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
}

export default function Button({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      android_ripple={{ color: '#ffffff33' }}
      style={[styles.base, variant === 'primary' ? styles.primary : styles.ghost, inactive && styles.inactive, style]}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, variant === 'ghost' && { color: colors.accent }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  primary: { backgroundColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  inactive: { opacity: 0.6 },
  text: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
