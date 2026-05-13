import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii } from '../constants/theme';

interface Props {
  progress: number; // 0 to 1
  color?: string;
}

export default function ProgressBar({ progress, color }: Props) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${clampedProgress * 100}%` },
          color ? { backgroundColor: color } : undefined,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
});
