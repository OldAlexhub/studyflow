import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radii, fontSizes, fontWeights } from '../constants/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function DurationButton({ label, selected, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    margin: 5,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.surface,
  },
});
