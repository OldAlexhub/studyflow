import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors, fontWeights } from '../constants/theme';
import { formatTime } from '../utils/formatTime';

interface Props {
  seconds: number;
  color?: string;
}

export default function TimerDisplay({ seconds, color }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.timer, color ? { color } : undefined]}>
        {formatTime(seconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 80,
    fontWeight: fontWeights.bold,
    color: colors.timerText,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
});
