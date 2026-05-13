import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, fontSizes, fontWeights } from '../constants/theme';

interface Props {
  suggestion: string;
}

export default function BreakSuggestionCard({ suggestion }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>💡</Text>
      <View style={styles.content}>
        <Text style={styles.label}>Suggestion</Text>
        <Text style={styles.text}>{suggestion}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accentLight + '44',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentLight,
  },
  emoji: {
    fontSize: 20,
    marginTop: 1,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
