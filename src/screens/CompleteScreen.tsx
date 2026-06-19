import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { RootStackParamList } from '../types/study';
import BannerAdView from '../components/BannerAdView';
import { AD_UNITS } from '../utils/adUnits';
import { saveSession } from '../utils/studyStorage';
import { colors, spacing, radii, fontSizes, fontWeights } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Complete'>;
  route: RouteProp<RootStackParamList, 'Complete'>;
};

const MESSAGES = [
  "Every minute you studied is a step forward. Be proud of that.",
  "You showed up and did the work. That's what matters.",
  "Consistency builds mastery. See you next time.",
  "Rest well. Your brain is consolidating what you learned.",
  "Another session done. You're building something real.",
];

function getMessage(durationMinutes: number): string {
  const idx = Math.floor(durationMinutes / 30) % MESSAGES.length;
  return MESSAGES[idx];
}

export default function CompleteScreen({ navigation, route }: Props) {
  const { durationMinutes } = route.params;
  const message = getMessage(durationMinutes);
  const interstitialRef = useRef(
    InterstitialAd.createForAdRequest(AD_UNITS.interstitial),
  );

  useEffect(() => {
    saveSession(durationMinutes);

    const interstitial = interstitialRef.current;
    const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setTimeout(() => interstitial.show(), 1500);
    });
    interstitial.load();
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartAnother = () => {
    navigation.replace('Home');
  };

  const handleBackHome = () => {
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Icon / Badge */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>✓</Text>
          </View>
        </View>

        {/* Completion text */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Session Complete</Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{durationMinutes} min session</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{durationMinutes}</Text>
            <Text style={styles.statLabel}>minutes planned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>session done</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={handleStartAnother}
            accessibilityRole="button"
            accessibilityLabel="Start another session">
            <Text style={styles.primaryBtnText}>Start Another Session</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={handleBackHome}
            accessibilityRole="button"
            accessibilityLabel="Back to home">
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </Pressable>
        </View>

        <BannerAdView />

        {/* Footer hint */}
        <Text style={styles.footerHint}>
          Take a proper rest before your next session.
        </Text>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  iconEmoji: {
    fontSize: 44,
    color: colors.surface,
    fontWeight: fontWeights.bold,
  },
  textSection: {
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  durationBadge: {
    backgroundColor: colors.accent + '22',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  durationText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 300,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '100%',
    elevation: 1,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statValue: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryBtnText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.surface,
    letterSpacing: 0.3,
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
  pressed: {
    opacity: 0.75,
  },
  footerHint: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
