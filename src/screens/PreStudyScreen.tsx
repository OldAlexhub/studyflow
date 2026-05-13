import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/study';
import { playChime } from '../utils/playChime';
import TimerDisplay from '../components/TimerDisplay';
import ProgressBar from '../components/ProgressBar';
import { colors, spacing, fontSizes, fontWeights, radii } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PreStudy'>;
  route: RouteProp<RootStackParamList, 'PreStudy'>;
};

const TOTAL_SECONDS = 60;

interface Phase {
  threshold: number;
  instruction: string;
  emoji: string;
}

const PHASES: Phase[] = [
  { threshold: 45, instruction: 'Put distractions away', emoji: '📵' },
  { threshold: 30, instruction: 'Take slow breaths', emoji: '🌬️' },
  { threshold: 15, instruction: 'Open your study material', emoji: '📖' },
  { threshold: 0, instruction: 'Choose the first thing you will work on', emoji: '🎯' },
];

function getPhase(secondsLeft: number): Phase {
  for (const phase of PHASES) {
    if (secondsLeft > phase.threshold) return phase;
  }
  return PHASES[PHASES.length - 1];
}

export default function PreStudyScreen({ navigation, route }: Props) {
  const { durationMinutes } = route.params;
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    playChime();
    navigation.replace('Session', { durationMinutes });
  }, [navigation, durationMinutes]);

  useEffect(() => {
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = TOTAL_SECONDS - elapsed;

      if (remaining <= 0) {
        setSecondsLeft(0);
        finish();
      } else {
        setSecondsLeft(remaining);
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [finish]);

  const phase = getPhase(secondsLeft);
  const progress = 1 - secondsLeft / TOTAL_SECONDS;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.container}>
        {/* Top label */}
        <View style={styles.topSection}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Pre-Study Reset</Text>
          </View>
          <Text style={styles.subtitle}>
            A moment to clear your mind before you begin.
          </Text>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <TimerDisplay seconds={secondsLeft} color={colors.prestudyBlock} />
          <View style={styles.progressWrapper}>
            <ProgressBar progress={progress} color={colors.prestudyBlock} />
          </View>
        </View>

        {/* Current phase instruction */}
        <View style={styles.phaseCard}>
          <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
          <Text style={styles.phaseInstruction}>{phase.instruction}</Text>
        </View>

        {/* Steps preview */}
        <View style={styles.stepsContainer}>
          {PHASES.map((p, i) => {
            const isActive = p.instruction === phase.instruction;
            return (
              <View key={i} style={styles.step}>
                <View style={[styles.stepDot, isActive && styles.stepDotActive]} />
                <Text
                  style={[styles.stepText, isActive && styles.stepTextActive]}>
                  {p.instruction}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: colors.prestudyBlock + '22',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  pillText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.prestudyBlock,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  timerSection: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressWrapper: {
    width: '100%',
  },
  phaseCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  phaseEmoji: {
    fontSize: 44,
  },
  phaseInstruction: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  stepsContainer: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.prestudyBlock,
  },
  stepText: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  stepTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
});
