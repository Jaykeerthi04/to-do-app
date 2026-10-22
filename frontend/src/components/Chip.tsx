import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  label: string;
  active?: boolean;
  color?: string; // accent color when active (e.g. priority color)
  onPress?: () => void;
  small?: boolean;
}

export default function Chip({ label, active, color = colors.primary, onPress, small }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        small && styles.small,
        active && { backgroundColor: color + '33', borderColor: color },
      ]}>
      <Text style={[styles.text, small && styles.smallText, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  small: { paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  text: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  smallText: { fontSize: 11 },
});
