import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StudyBlock, BlockType } from '../types/study';
import {
  colors,
  spacing,
  radii,
  fontSizes,
  fontWeights,
} from '../constants/theme';

const BLOCK_COLORS: Record<BlockType, string> = {
  prestudy: colors.prestudyBlock,
  focus: colors.focusBlock,
  break: colors.breakBlock,
  review: colors.reviewBlock,
};

const BLOCK_LABELS: Record<BlockType, string> = {
  prestudy: 'Pre-Study Reset',
  focus: 'Focus',
  break: 'Break',
  review: 'Review',
};

interface Props {
  block: StudyBlock;
  isNext?: boolean;
}

export default function SessionCard({ block, isNext = false }: Props) {
  const blockColor = BLOCK_COLORS[block.type];

  return (
    <View style={[styles.card, isNext && styles.nextCard]}>
      <View style={[styles.typePill, { backgroundColor: blockColor + '22' }]}>
        <View style={[styles.dot, { backgroundColor: blockColor }]} />
        <Text style={[styles.typeLabel, { color: blockColor }]}>
          {isNext ? 'Up next · ' : ''}{BLOCK_LABELS[block.type]}
        </Text>
      </View>
      {!isNext && (
        <Text style={styles.instruction}>{block.instruction}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  nextCard: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    elevation: 0,
    shadowOpacity: 0,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
  },
  typeLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instruction: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
    lineHeight: 26,
  },
});
