import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@studyflow_sessions';

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  completedAt: number; // ms timestamp
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface StudyRank {
  title: string;
  emoji: string;
  nextTitle: string;
  progressToNext: number; // 0–1
  totalHoursForNext: number;
}

// ─── helpers ───────────────────────────────────────────────────────────────

function toDateStr(d = new Date()): string {
  return d.toISOString().split('T')[0];
}

// ─── storage ───────────────────────────────────────────────────────────────

export async function getSessions(): Promise<StudySession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudySession[]) : [];
  } catch {
    return [];
  }
}

export async function saveSession(durationMinutes: number): Promise<void> {
  try {
    const sessions = await getSessions();
    sessions.push({
      id: Date.now().toString(),
      date: toDateStr(),
      durationMinutes,
      completedAt: Date.now(),
    });
    await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {}
}

// ─── calculations ──────────────────────────────────────────────────────────

export function calcTotalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
}

export function calcStreak(sessions: StudySession[]): number {
  if (!sessions.length) return 0;
  const dates = new Set(sessions.map(s => s.date));
  const d = new Date();
  if (!dates.has(toDateStr(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dates.has(toDateStr(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function calcBestStreak(sessions: StudySession[]): number {
  if (!sessions.length) return 0;
  const sorted = [...new Set(sessions.map(s => s.date))].sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const gap =
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) /
      86_400_000;
    cur = gap === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

export function getWeekGrid(
  sessions: StudySession[],
): Array<{ label: string; studied: boolean; isToday: boolean }> {
  const dates = new Set(sessions.map(s => s.date));
  const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: labels[d.getDay()],
      studied: dates.has(toDateStr(d)),
      isToday: i === 6,
    };
  });
}

export function calcRank(totalMinutes: number): StudyRank {
  const h = totalMinutes / 60;
  const RANKS = [
    { title: 'Newcomer', emoji: '🌱', hours: 0 },
    { title: 'Explorer', emoji: '🔭', hours: 2 },
    { title: 'Scholar', emoji: '📚', hours: 8 },
    { title: 'Adept', emoji: '⚡', hours: 20 },
    { title: 'Expert', emoji: '🎯', hours: 50 },
    { title: 'Master', emoji: '🏆', hours: 100 },
  ];

  let rankIdx = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (h >= RANKS[i].hours) {
      rankIdx = i;
      break;
    }
  }

  const current = RANKS[rankIdx];
  const next = RANKS[rankIdx + 1];

  if (!next) {
    return {
      title: current.title,
      emoji: current.emoji,
      nextTitle: 'Legend',
      progressToNext: 1,
      totalHoursForNext: current.hours,
    };
  }

  const progress = (h - current.hours) / (next.hours - current.hours);
  return {
    title: current.title,
    emoji: current.emoji,
    nextTitle: next.title,
    progressToNext: Math.min(Math.max(progress, 0), 1),
    totalHoursForNext: next.hours,
  };
}

export function getBadges(
  sessions: StudySession[],
  streak: number,
  bestStreak: number,
): Badge[] {
  const total = sessions.length;
  const totalMins = calcTotalMinutes(sessions);

  const define = (
    id: string,
    emoji: string,
    title: string,
    description: string,
    unlocked: boolean,
  ): Badge => ({ id, emoji, title, description, unlocked });

  return [
    define('first', '🌟', 'First Step', 'Complete your first session', total >= 1),
    define('streak3', '🔥', 'On Fire', 'Reach a 3-day streak', bestStreak >= 3),
    define('sessions5', '📖', 'Getting Serious', 'Complete 5 sessions', total >= 5),
    define('streak7', '⚡', 'Week Warrior', 'Reach a 7-day streak', bestStreak >= 7),
    define('sessions10', '🎯', 'Double Digits', 'Complete 10 sessions', total >= 10),
    define('hours10', '⏱️', 'Time Investor', 'Study for 10 hours total', totalMins >= 600),
    define('streak14', '🏅', 'Fortnight Focus', 'Reach a 14-day streak', bestStreak >= 14),
    define('sessions25', '💡', 'Knowledge Seeker', 'Complete 25 sessions', total >= 25),
    define('hours25', '🚀', 'Deep Worker', 'Study for 25 hours total', totalMins >= 1500),
    define('streak30', '👑', 'Iron Will', 'Reach a 30-day streak', bestStreak >= 30),
    define('sessions50', '🧠', 'Brain Builder', 'Complete 50 sessions', total >= 50),
    define('hours100', '💎', 'Century Scholar', 'Study for 100 hours total', totalMins >= 6000),
  ].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
}

export function getCompanionMessage(
  sessions: StudySession[],
  streak: number,
): { title: string; body: string } {
  const total = sessions.length;
  const totalMins = calcTotalMinutes(sessions);
  const today = toDateStr();
  const studiedToday = sessions.some(s => s.date === today);

  if (total === 0) {
    return {
      title: 'Ready when you are.',
      body: "Start your first session and I'll begin tracking your progress. Every expert was once a beginner who simply kept going.",
    };
  }
  if (streak >= 30) {
    return {
      title: `${streak} days. Legendary. 👑`,
      body: "A month of consecutive study. That level of commitment is rarer than most achievements. This is who you are now.",
    };
  }
  if (streak >= 14) {
    return {
      title: `${streak} days straight. 🏅`,
      body: "Two weeks without missing a day. Your brain is adapting to this rhythm — it's getting easier because you've earned it.",
    };
  }
  if (streak >= 7) {
    return {
      title: 'A full week! ⚡',
      body: `${streak} days in a row. Most people quit long before this point. You are not most people.`,
    };
  }
  if (streak >= 3) {
    return {
      title: `${streak}-day streak! 🔥`,
      body: "Momentum is the hardest thing to build — and you have it right now. Keep the chain alive.",
    };
  }
  if (studiedToday) {
    return {
      title: 'Today counts. ✓',
      body: "You showed up today. That's the whole game. Small wins, every single day, add up to something extraordinary.",
    };
  }
  if (totalMins >= 6000) {
    return {
      title: '100 hours. Incredible. 💎',
      body: "You've crossed 100 hours of focused study. The compound effect of what you've learned is bigger than you know.",
    };
  }
  if (totalMins >= 1500) {
    return {
      title: '25 hours in. 🚀',
      body: "Deep work is rare. You're choosing it, repeatedly. That's a skill in itself.",
    };
  }
  if (totalMins >= 600) {
    return {
      title: '10 hours studied. ⏱️',
      body: "Ten hours of intentional focus. Each session built on the last — that's how mastery actually works.",
    };
  }
  if (total >= 10) {
    return {
      title: 'Double digits. 🎯',
      body: "10 sessions done. You've shown yourself you can do this. Now make it a lifestyle.",
    };
  }
  if (total >= 5) {
    return {
      title: 'Building the habit.',
      body: `${total} sessions in. Research says habits take around 21 days — you're already proving consistency.`,
    };
  }
  return {
    title: "You're getting started.",
    body: `${total} session${total !== 1 ? 's' : ''} complete. The hardest sessions are the first ones — and you're already past them.`,
  };
}

export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatSessionDate(dateStr: string): string {
  const today = toDateStr();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = toDateStr(d);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
