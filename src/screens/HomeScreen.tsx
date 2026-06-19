import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/study';
import DurationButton from '../components/DurationButton';
import BannerAdView from '../components/BannerAdView';
import { colors, spacing, radii, fontSizes, fontWeights } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const PRESET_DURATIONS = [15, 30, 45, 60, 90, 120];

export default function HomeScreen({ navigation }: Props) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');

  const handlePresetPress = (minutes: number) => {
    setSelectedDuration(minutes);
    setCustomInput('');
    setCustomError('');
  };

  const handleCustomChange = (text: string) => {
    setCustomInput(text);
    setSelectedDuration(null);
    setCustomError('');
  };

  const getEffectiveDuration = (): number | null => {
    if (selectedDuration !== null) return selectedDuration;
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed)) return parsed;
    return null;
  };

  const handleStart = () => {
    const duration = getEffectiveDuration();

    if (duration === null) {
      setCustomError('Please select or enter a duration.');
      return;
    }

    if (customInput !== '' && (duration < 10 || duration > 180)) {
      setCustomError('Custom duration must be between 10 and 180 minutes.');
      return;
    }

    navigation.navigate('PlanPreview', { durationMinutes: duration });
  };

  const effectiveDuration = getEffectiveDuration();
  const canStart = effectiveDuration !== null && (customInput === '' || (effectiveDuration >= 10 && effectiveDuration <= 180));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="StudyFlow"
            />
            <Text style={styles.tagline}>
              Enter your study time.{'\n'}StudyFlow guides the rhythm.
            </Text>
          </View>

          {/* Duration section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>How long do you want to study?</Text>

            <View style={styles.presetGrid}>
              {PRESET_DURATIONS.map(min => (
                <DurationButton
                  key={min}
                  label={`${min} min`}
                  selected={selectedDuration === min}
                  onPress={() => handlePresetPress(min)}
                />
              ))}
            </View>

            {/* Custom input */}
            <View style={styles.customRow}>
              <TextInput
                style={[styles.customInput, customError ? styles.inputError : undefined]}
                placeholder="Custom (10–180 min)"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={customInput}
                onChangeText={handleCustomChange}
                maxLength={3}
                returnKeyType="done"
                accessibilityLabel="Custom duration input"
              />
              {customInput !== '' && (
                <Text style={styles.customUnit}>min</Text>
              )}
            </View>

            {customError ? (
              <Text style={styles.errorText}>{customError}</Text>
            ) : null}
          </View>

          {/* Start button */}
          <View style={styles.startSection}>
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                !canStart && styles.startButtonDisabled,
                pressed && canStart && styles.startButtonPressed,
              ]}
              onPress={handleStart}
              disabled={!canStart}
              accessibilityRole="button"
              accessibilityLabel="Start Study Flow">
              <Text style={[styles.startLabel, !canStart && styles.startLabelDisabled]}>
                Start Study Flow
              </Text>
            </Pressable>

            {effectiveDuration !== null && canStart && (
              <Text style={styles.durationHint}>
                {effectiveDuration} min session · guided from start to finish
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BannerAdView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 100,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 28,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  customInput: {
    flex: 1,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  customUnit: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    marginTop: -spacing.xs,
  },
  startSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  startLabel: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.surface,
    letterSpacing: 0.3,
  },
  startLabelDisabled: {
    color: colors.textMuted,
  },
  durationHint: {
    textAlign: 'center',
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
});
