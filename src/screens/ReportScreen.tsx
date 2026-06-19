import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  getSessions,
  calcStreak,
  calcBestStreak,
  calcTotalMinutes,
  calcRank,
  getBadges,
  getWeekGrid,
  getCompanionMessage,
  formatStudyTime,
  formatSessionDate,
  StudySession,
  Badge,
} from '../utils/studyStorage';
import BannerAdView from '../components/BannerAdView';
import { colors, spacing, radii, fontSizes, fontWeights } from '../constants/theme';

// ─── helpers ───────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── sub-components ────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WeekDay({
  label,
  studied,
  isToday,
}: {
  label: string;
  studied: boolean;
  isToday: boolean;
}) {
  return (
    <View style={styles.weekDay}>
      <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>
        {label}
      </Text>
      <View
        style={[
          styles.weekDot,
          studied && styles.weekDotStudied,
          isToday && !studied && styles.weekDotToday,
        ]}
      />
      {isToday && <View style={styles.weekTodayTick} />}
    </View>
  );
}

function BadgeTile({ badge }: { badge: Badge }) {
  return (
    <View style={[styles.badgeTile, !badge.unlocked && styles.badgeTileLocked]}>
      <Text style={[styles.badgeEmoji, !badge.unlocked && styles.badgeEmojiLocked]}>
        {badge.unlocked ? badge.emoji : '🔒'}
      </Text>
      <Text
        style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}
        numberOfLines={2}>
        {badge.title}
      </Text>
    </View>
  );
}

function SessionRow({ session }: { session: StudySession }) {
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionDot} />
      <Text style={styles.sessionDate}>{formatSessionDate(session.date)}</Text>
      <Text style={styles.sessionDuration}>{session.durationMinutes} min</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📚</Text>
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptyBody}>
        Complete your first study session and your companion will start building
        your personal report.
      </Text>
    </View>
  );
}

// ─── main screen ───────────────────────────────────────────────────────────

export default function ReportScreen() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(data => {
        setSessions(data);
        setLoaded(true);
      });
    }, []),
  );

  if (!loaded) return null;

  const streak = calcStreak(sessions);
  const bestStreak = calcBestStreak(sessions);
  const totalMins = calcTotalMinutes(sessions);
  const avgMins =
    sessions.length > 0 ? Math.round(totalMins / sessions.length) : 0;
  const rank = calcRank(totalMins);
  const badges = getBadges(sessions, streak, bestStreak);
  const weekGrid = getWeekGrid(sessions);
  const companion = getCompanionMessage(sessions, streak);
  const recentSessions = [...sessions]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 5);
  const weekCount = weekGrid.filter(d => d.studied).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
            <Text style={styles.rankTitle}>{rank.title}</Text>
          </View>
        </View>

        {/* ── Rank progress ── */}
        <View style={styles.rankCard}>
          <View style={styles.rankCardRow}>
            <Text style={styles.rankCardLabel}>Rank Progress</Text>
            <Text style={styles.rankCardNext}>→ {rank.nextTitle}</Text>
          </View>
          <View style={styles.rankTrack}>
            <View
              style={[styles.rankFill, { width: `${rank.progressToNext * 100}%` }]}
            />
          </View>
          {rank.progressToNext < 1 && (
            <Text style={styles.rankHint}>
              {formatStudyTime(rank.totalHoursForNext * 60 - totalMins)} until {rank.nextTitle}
            </Text>
          )}
        </View>

        {/* ── Companion message ── */}
        <View style={styles.companionCard}>
          <Text style={styles.companionTitle}>{companion.title}</Text>
          <Text style={styles.companionBody}>{companion.body}</Text>
        </View>

        {/* ── Streak cards ── */}
        <View style={styles.streakRow}>
          <View style={[styles.streakCard, styles.streakCardActive]}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>
              {streak === 1 ? 'day streak' : 'day streak'}
            </Text>
            {streak === 0 && (
              <Text style={styles.streakSub}>Study today to start one!</Text>
            )}
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🏆</Text>
            <Text style={styles.streakNumberMuted}>{bestStreak}</Text>
            <Text style={styles.streakLabelMuted}>best streak</Text>
          </View>
        </View>

        {sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Stats ── */}
            <View style={styles.statsRow}>
              <StatCard label="Total time" value={formatStudyTime(totalMins)} />
              <StatCard label="Sessions" value={String(sessions.length)} />
              <StatCard label="Avg session" value={`${avgMins}m`} />
            </View>

            {/* ── This Week ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>This Week</Text>
                <Text style={styles.sectionBadge}>
                  {weekCount}/{weekGrid.length} days
                </Text>
              </View>
              <View style={styles.weekGrid}>
                {weekGrid.map((day, i) => (
                  <WeekDay
                    key={i}
                    label={day.label}
                    studied={day.studied}
                    isToday={day.isToday}
                  />
                ))}
              </View>
            </View>

            {/* ── Badges ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.badgeGrid}>
                {badges.map(b => (
                  <BadgeTile key={b.id} badge={b} />
                ))}
              </View>
            </View>

            {/* ── Recent sessions ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              <View style={styles.sessionList}>
                {recentSessions.map(s => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <BannerAdView />
    </SafeAreaView>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },

  // header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '18',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  rankEmoji: { fontSize: 16 },
  rankTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },

  // rank progress card
  rankCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  rankCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankCardLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rankCardNext: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  rankTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  rankFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  rankHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },

  // companion
  companionCard: {
    backgroundColor: colors.primary + '12',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  companionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  companionBody: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // streaks
  streakRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streakCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  streakCardActive: {
    backgroundColor: '#FFF5ED',
    borderWidth: 1.5,
    borderColor: '#FFB347',
  },
  streakEmoji: { fontSize: 28 },
  streakNumber: {
    fontSize: 40,
    fontWeight: fontWeights.bold,
    color: '#E8760A',
    lineHeight: 44,
  },
  streakNumberMuted: {
    fontSize: 40,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: 44,
  },
  streakLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: '#E8760A',
  },
  streakLabelMuted: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
  },
  streakSub: {
    fontSize: fontSizes.xs,
    color: '#E8760A',
    fontWeight: fontWeights.medium,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },

  // stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 3,
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // section
  section: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  sectionBadge: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.accent,
  },

  // week grid
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  weekDay: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  weekDayLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
  },
  weekDayLabelToday: {
    color: colors.primary,
  },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  weekDotStudied: {
    backgroundColor: colors.accent,
  },
  weekDotToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  weekTodayTick: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // badges
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeTile: {
    width: '22%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  badgeTileLocked: {
    backgroundColor: colors.surfaceAlt,
    elevation: 0,
    shadowOpacity: 0,
  },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { opacity: 0.4 },
  badgeTitle: {
    fontSize: 10,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 13,
  },
  badgeTitleLocked: {
    color: colors.textMuted,
  },

  // recent sessions
  sessionList: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  sessionDate: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  sessionDuration: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
  },

  // empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  bottomPad: { height: spacing.lg },
});
