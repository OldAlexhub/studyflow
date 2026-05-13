import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, StudyBlock, BlockType } from '../types/study';
import { generateStudyPlan } from '../utils/generateStudyPlan';
import { formatTime } from '../utils/formatTime';
import { colors, spacing, radii, fontSizes, fontWeights } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanPreview'>;
  route: RouteProp<RootStackParamList, 'PlanPreview'>;
};

const BLOCK_COLORS: Record<BlockType, string> = {
  prestudy: colors.prestudyBlock,
  focus: colors.focusBlock,
  break: colors.breakBlock,
  review: colors.reviewBlock,
};

const BLOCK_EMOJI: Record<BlockType, string> = {
  prestudy: '🧘',
  focus: '🎯',
  break: '☕',
  review: '📝',
};

const BLOCK_LABELS: Record<BlockType, string> = {
  prestudy: 'Pre-Study Reset',
  focus: 'Focus',
  break: 'Break',
  review: 'Review',
};

function BlockRow({ block, index }: { block: StudyBlock; index: number }) {
  const color = BLOCK_COLORS[block.type];
  const mins = Math.floor(block.durationSeconds / 60);
  const secs = block.durationSeconds % 60;
  const durationLabel = secs > 0 ? formatTime(block.durationSeconds) : `${mins} min`;

  return (
    <View style={styles.blockRow}>
      {/* Left: index + color strip */}
      <View style={styles.blockLeft}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        <Text style={styles.blockIndex}>{index + 1}</Text>
      </View>

      {/* Middle: info */}
      <View style={styles.blockMiddle}>
        <View style={styles.blockTitleRow}>
          <Text style={styles.blockEmoji}>{BLOCK_EMOJI[block.type]}</Text>
          <Text style={[styles.blockType, { color }]}>{BLOCK_LABELS[block.type]}</Text>
        </View>
        <Text style={styles.blockInstruction} numberOfLines={2}>
          {block.instruction}
        </Text>
      </View>

      {/* Right: duration */}
      <View style={styles.blockRight}>
        <Text style={styles.blockDuration}>{durationLabel}</Text>
      </View>
    </View>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

export default function PlanPreviewScreen({ navigation, route }: Props) {
  const { durationMinutes } = route.params;
  const plan = useMemo(() => generateStudyPlan(durationMinutes), [durationMinutes]);

  const focusBlocks = plan.filter(b => b.type === 'focus');
  const breakBlocks = plan.filter(b => b.type === 'break');
  const totalFocusMin = Math.round(
    focusBlocks.reduce((s, b) => s + b.durationSeconds, 0) / 60,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Fixed header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Change duration</Text>
        </Pressable>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Your Study Plan</Text>
          <Text style={styles.headerSubtitle}>{durationMinutes} min session</Text>
        </View>
      </View>

      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <SummaryChip label="blocks" value={String(plan.length)} />
        <SummaryChip label="focus min" value={String(totalFocusMin)} />
        <SummaryChip label="breaks" value={String(breakBlocks.length)} />
      </View>

      {/* Plan list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.planCard}>
          {plan.map((block, i) => (
            <View key={block.id}>
              <BlockRow block={block} index={i} />
              {i < plan.length - 1 && (
                <View style={styles.connector}>
                  <View style={styles.connectorLine} />
                </View>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          The app will guide you through each block automatically.{'\n'}
          Vibration + sound will signal every transition.
        </Text>
      </ScrollView>

      {/* Fixed footer CTA */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          onPress={() => navigation.replace('PreStudy', { durationMinutes })}
          accessibilityRole="button"
          accessibilityLabel="Begin session">
          <Text style={styles.startBtnText}>Begin Session</Text>
          <Text style={styles.startBtnSub}>
            Starts with a 60-second reset
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.6,
  },
  headerTextGroup: {
    gap: 2,
  },
  headerTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  chipValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  chipLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    minHeight: 68,
  },
  blockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 44,
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  blockIndex: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    width: 18,
    textAlign: 'center',
  },
  blockMiddle: {
    flex: 1,
    gap: 3,
    paddingLeft: spacing.xs,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  blockEmoji: {
    fontSize: 14,
  },
  blockType: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  blockInstruction: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  blockRight: {
    paddingLeft: spacing.sm,
    alignItems: 'flex-end',
  },
  blockDuration: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  connector: {
    paddingLeft: 44,
    height: 1,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  note: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  startBtnText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.surface,
    letterSpacing: 0.3,
  },
  startBtnSub: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.surface,
    opacity: 0.75,
  },
});
