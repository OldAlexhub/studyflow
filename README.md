# StudyFlow

> Enter your study time. StudyFlow guides the rhythm.

A calm, focused study autopilot for Android. The user picks a duration — StudyFlow generates a structured session plan with focus blocks, timed breaks, and a final review, then runs it automatically from start to finish.

---

## Features

- **One input only** — choose a duration (15, 30, 45, 60, 90, or 120 min, or any custom value from 10 to 180 min)
- **Plan preview** — see the full block-by-block schedule before you start
- **Mandatory 60-second pre-study reset** — guided phases to clear distractions before every session
- **Automatic session runner** — transitions between focus blocks, breaks, and review automatically
- **Break suggestions** — calm, screen-free activity prompts during every break
- **Vibration + chime** at every block transition
- **Pause / Resume / End** session controls
- **Completion screen** with an encouraging message
- No login. No account. No internet. No ads.

---

## Screen flow

```
Home → Plan Preview → Pre-Study Reset (60s) → Session → Complete
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 22 |
| Java JDK | 17+ (Android Studio's bundled JBR works) |
| Android SDK | API 36 (install via Android Studio) |
| Python | 3.10+ (for release builds) |

Set `ANDROID_HOME` to your SDK path, or just install Android Studio — `release.py` detects it automatically.

---

## Development setup

```bash
# Install JS dependencies
npm install

# Start Metro bundler
npm start

# Run on a connected device or emulator (new terminal)
npm run android
```

> The first build takes several minutes — Gradle downloads dependencies and compiles native modules.

---

## Project structure

```
src/
  screens/
    HomeScreen.tsx          Duration picker
    PlanPreviewScreen.tsx   Full plan displayed before starting
    PreStudyScreen.tsx      60-second guided reset
    SessionScreen.tsx       Live block runner with timer
    CompleteScreen.tsx      End-of-session summary
  components/
    DurationButton.tsx
    TimerDisplay.tsx
    ProgressBar.tsx
    SessionCard.tsx
    BreakSuggestionCard.tsx
  utils/
    generateStudyPlan.ts    Session plan engine
    formatTime.ts           MM:SS formatter
    playChime.ts            Vibration + native chime wrapper
  types/
    study.ts                Shared TypeScript types
  constants/
    theme.ts                Colors, spacing, typography
    breakSuggestions.ts     Break prompt strings

android/
  app/src/main/java/com/studyflow/
    SoundModule.kt          Native chime via Android AudioTrack
    SoundPackage.kt         Registers SoundModule with React Native

assets/
  logo.png                  App logo (used in HomeScreen + app icon)

release.py                  Release build script (APK + AAB)
releases/                   Output folder for signed artifacts (gitignored)
```

---

## Session plan engine

`generateStudyPlan(durationMinutes)` returns an array of `StudyBlock` objects:

```ts
interface StudyBlock {
  id: string;
  type: 'prestudy' | 'focus' | 'break' | 'review';
  title: string;
  durationSeconds: number;
  instruction: string;
  suggestion?: string;  // break blocks only
}
```

Preset plans exist for 15, 30, 45, 60, 90, and 120 minutes. Custom durations use a rule-based generator that always starts with a 1-minute pre-study block, uses 25-minute focus blocks where possible, and ends with a review block.

---

## Building a release

Signing must be configured first (one-time setup):

**1. Generate a keystore** (skip if you already have one):
```bash
keytool -genkeypair -v \
  -keystore android/app/studyflow.keystore \
  -alias studyflow -keyalg RSA -keysize 2048 -validity 10000
```

**2. Add credentials to `~/.gradle/gradle.properties`** — never commit this file:
```properties
STUDYFLOW_STORE_FILE=studyflow.keystore
STUDYFLOW_KEY_ALIAS=studyflow
STUDYFLOW_STORE_PASSWORD=your_store_password
STUDYFLOW_KEY_PASSWORD=your_key_password
```

**3. Build:**
```bash
python release.py apk      # signed APK  (sideloading / direct install)
python release.py aab      # signed AAB  (Play Store upload)
python release.py both     # both
python release.py clean    # clean Gradle outputs
```

Java and Android SDK are auto-detected from Android Studio or standard install paths. No manual environment setup needed.

Artifacts are saved to `releases/` with a timestamp:
```
releases/StudyFlow_release_20260512_232921.apk
releases/StudyFlow_release_20260512_232933.aab
```

---

## Play Store checklist

- [ ] Upload `releases/*.aab` in Google Play Console
- [ ] Add at least 2 phone screenshots
- [ ] Write a short description (80 chars max)
- [ ] Write a full description
- [ ] Add a privacy policy URL (required even for offline apps)
- [ ] Complete content rating questionnaire
- [ ] Set category: Education or Productivity

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Bare React Native 0.85 |
| Language | TypeScript |
| Navigation | React Navigation (native stack) |
| Safe areas | react-native-safe-area-context |
| Sound | Custom Android native module (AudioTrack) |
| State | Local React state only |
| Storage | None |
| Backend | None |
