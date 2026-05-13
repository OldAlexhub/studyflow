import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, StudyBlock, BlockType } from '../types/study';
import TimerDisplay from '../components/TimerDisplay';
import ProgressBar from '../components/ProgressBar';
import SessionCard from '../components/SessionCard';
import BreakSuggestionCard from '../components/BreakSuggestionCard';
import { generateStudyPlan } from '../utils/generateStudyPlan';
import { playChime } from '../utils/playChime';
import { colors, spacing, radii, fontSizes, fontWeights } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Session'>;
  route: RouteProp<RootStackParamList, 'Session'>;
};

const BLOCK_COLORS: Record<BlockType, string> = {
  prestudy: colors.prestudyBlock,
  focus: colors.focusBlock,
  break: colors.breakBlock,
  review: colors.reviewBlock,
};

export default function SessionScreen({ navigation, route }: Props) {
  const { durationMinutes } = route.params;

  const plan = useMemo(() => generateStudyPlan(durationMinutes), [durationMinutes]);

  const [blockIndex, setBlockIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(plan[0]?.durationSeconds ?? 0);
  const [paused, setPaused] = useState(false);

  const blockIndexRef = useRef(blockIndex);
  const secondsLeftRef = useRef(secondsLeft);
  const pausedRef = useRef(paused);
  const blockStartTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  blockIndexRef.current = blockIndex;
  secondsLeftRef.current = secondsLeft;
  pausedRef.current = paused;

  const totalSessionSeconds = useMemo(
    () => plan.reduce((sum, b) => sum + b.durationSeconds, 0),
    [plan],
  );

  const elapsedBeforeCurrentBlock = useMemo(() => {
    return plan
      .slice(0, blockIndex)
      .reduce((sum, b) => sum + b.durationSeconds, 0);
  }, [plan, blockIndex]);

  const currentBlock: StudyBlock | undefined = plan[blockIndex];
  const nextBlock: StudyBlock | undefined = plan[blockIndex + 1];

  const overallProgress = useMemo(() => {
    if (totalSessionSeconds === 0) return 1;
    const elapsed =
      elapsedBeforeCurrentBlock +
      (currentBlock ? currentBlock.durationSeconds - secondsLeft : 0);
    return elapsed / totalSessionSeconds;
  }, [elapsedBeforeCurrentBlock, currentBlock, secondsLeft, totalSessionSeconds]);

  const blockProgress = useMemo(() => {
    if (!currentBlock) return 1;
    return 1 - secondsLeft / currentBlock.durationSeconds;
  }, [currentBlock, secondsLeft]);

  const advanceBlock = useCallback(() => {
    const idx = blockIndexRef.current;
    const nextIdx = idx + 1;
    playChime();

    if (nextIdx >= plan.length) {
      if (doneRef.current) return;
      doneRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigation.replace('Complete', { durationMinutes });
      return;
    }

    const nextBlock = plan[nextIdx];
    setBlockIndex(nextIdx);
    setSecondsLeft(nextBlock.durationSeconds);
    blockStartTimeRef.current = Date.now();
    pausedAtRef.current = null;
  }, [plan, navigation, durationMinutes]);

  useEffect(() => {
    blockStartTimeRef.current = Date.now();
    setSecondsLeft(plan[0]?.durationSeconds ?? 0);

    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;

      const block = plan[blockIndexRef.current];
      if (!block) return;

      const elapsed = (Date.now() - blockStartTimeRef.current) / 1000;
      const remaining = block.durationSeconds - elapsed;

      if (remaining <= 0) {
        setSecondsLeft(0);
        advanceBlock();
      } else {
        setSecondsLeft(remaining);
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePause = () => {
    pausedAtRef.current = Date.now();
    setPaused(true);
  };

  const handleResume = () => {
    if (pausedAtRef.current !== null) {
      const pauseDuration = Date.now() - pausedAtRef.current;
      blockStartTimeRef.current += pauseDuration;
      pausedAtRef.current = null;
    }
    setPaused(false);
  };

  const handleEnd = () => {
    Alert.alert(
      'End Session?',
      'Your progress will not be saved. Are you sure you want to end the session?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            navigation.replace('Home');
          },
        },
      ],
    );
  };

  if (!currentBlock) return null;

  const blockColor = BLOCK_COLORS[currentBlock.type];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Overall progress */}
        <View style={styles.overallProgress}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Session progress</Text>
            <Text style={styles.progressValue}>
              {blockIndex + 1} / {plan.length}
            </Text>
          </View>
          <ProgressBar progress={overallProgress} color={blockColor} />
        </View>

        {/* Current block card */}
        <SessionCard block={currentBlock} />

        {/* Timer */}
        <View style={styles.timerSection}>
          {paused && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          )}
          <TimerDisplay seconds={secondsLeft} color={blockColor} />
          <View style={styles.blockProgressWrapper}>
            <ProgressBar progress={blockProgress} color={blockColor} />
          </View>
        </View>

        {/* Break suggestion */}
        {currentBlock.type === 'break' && currentBlock.suggestion ? (
          <BreakSuggestionCard suggestion={currentBlock.suggestion} />
        ) : null}

        {/* Next block */}
        {nextBlock ? (
          <View style={styles.nextSection}>
            <Text style={styles.nextLabel}>Up next</Text>
            <SessionCard block={nextBlock} isNext />
          </View>
        ) : (
          <View style={styles.lastBlockHint}>
            <Text style={styles.lastBlockText}>Last block — almost there.</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {paused ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={handleResume}>
              <Text style={styles.primaryBtnText}>Resume</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={handlePause}>
              <Text style={styles.secondaryBtnText}>Pause</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.endBtn, pressed && styles.pressed]}
            onPress={handleEnd}>
            <Text style={styles.endBtnText}>End Session</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  overallProgress: {
    gap: spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  progressValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  timerSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pausedBadge: {
    backgroundColor: colors.danger + '22',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  pausedText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.danger,
    letterSpacing: 1.5,
  },
  blockProgressWrapper: {
    width: '100%',
  },
  nextSection: {
    gap: spacing.sm,
  },
  nextLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastBlockHint: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  lastBlockText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  controls: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  primaryBtnText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.surface,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  endBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  endBtnText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
});
