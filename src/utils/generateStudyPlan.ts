import { StudyBlock } from '../types/study';

const FOCUS_INSTRUCTIONS = [
  'Stay with one task.',
  'Keep your phone away.',
  'Work until the next break.',
  'Do not switch tasks right now.',
];

const BREAK_SUGGESTIONS = [
  'Stand up and stretch.',
  'Drink water.',
  'Rest your eyes.',
  'Walk around the room.',
  'Stretch your neck and shoulders.',
  'Take slow breaths.',
  'Listen to one calm song.',
  'One short selected video only — no feed, no autoplay.',
];

let blockCounter = 0;

function uid(): string {
  return `block_${++blockCounter}`;
}

function focusInstruction(): string {
  return FOCUS_INSTRUCTIONS[blockCounter % FOCUS_INSTRUCTIONS.length];
}

function breakSuggestion(): string {
  return BREAK_SUGGESTIONS[blockCounter % BREAK_SUGGESTIONS.length];
}

function preStudy(): StudyBlock {
  return {
    id: uid(),
    type: 'prestudy',
    title: 'Pre-Study Reset',
    durationSeconds: 60,
    instruction: 'Clear your space and prepare your mind.',
  };
}

function focus(minutes: number): StudyBlock {
  return {
    id: uid(),
    type: 'focus',
    title: 'Focus Block',
    durationSeconds: minutes * 60,
    instruction: focusInstruction(),
  };
}

function shortBreak(minutes: number = 3): StudyBlock {
  return {
    id: uid(),
    type: 'break',
    title: 'Short Break',
    durationSeconds: minutes * 60,
    instruction: 'Step away from your desk.',
    suggestion: breakSuggestion(),
  };
}

function longBreak(minutes: number = 10): StudyBlock {
  return {
    id: uid(),
    type: 'break',
    title: 'Long Break',
    durationSeconds: minutes * 60,
    instruction: 'Rest fully before the next focus block.',
    suggestion: breakSuggestion(),
  };
}

function review(minutes: number): StudyBlock {
  return {
    id: uid(),
    type: 'review',
    title: 'Review & Recap',
    durationSeconds: minutes * 60,
    instruction: 'Review what you covered. Write down key points.',
  };
}

const PRESET_PLANS: Record<number, () => StudyBlock[]> = {
  15: () => [preStudy(), focus(12), review(2)],
  30: () => [preStudy(), focus(20), shortBreak(3), review(6)],
  45: () => [preStudy(), focus(20), shortBreak(3), focus(18), review(3)],
  60: () => [preStudy(), focus(25), shortBreak(5), focus(25), review(4)],
  90: () => [
    preStudy(),
    focus(25),
    shortBreak(5),
    focus(25),
    shortBreak(7),
    focus(22),
    review(5),
  ],
  120: () => [
    preStudy(),
    focus(25),
    shortBreak(5),
    focus(25),
    longBreak(10),
    focus(25),
    shortBreak(5),
    focus(20),
    review(4),
  ],
};

function generateCustomPlan(durationMinutes: number): StudyBlock[] {
  const clamped = Math.min(180, Math.max(10, durationMinutes));
  const available = clamped - 1; // subtract 1 min pre-study

  const blocks: StudyBlock[] = [preStudy()];

  if (available <= 14) {
    // short: one focus + review
    const reviewMins = Math.min(2, Math.floor(available * 0.15));
    const focusMins = available - reviewMins;
    blocks.push(focus(focusMins));
    blocks.push(review(reviewMins));
    return blocks;
  }

  if (available <= 59) {
    // medium: one or two focus blocks with one short break
    if (available <= 30) {
      const reviewMins = Math.floor(available * 0.15);
      const remaining = available - reviewMins;
      const breakMins = 3;
      const f1 = Math.floor((remaining - breakMins) * 0.6);
      const f2 = remaining - breakMins - f1;
      blocks.push(focus(f1), shortBreak(breakMins), focus(f2), review(reviewMins));
    } else {
      const reviewMins = 4;
      const breakMins = 5;
      const focusTotal = available - reviewMins - breakMins;
      const f1 = Math.ceil(focusTotal / 2);
      const f2 = focusTotal - f1;
      blocks.push(focus(f1), shortBreak(breakMins), focus(f2), review(reviewMins));
    }
    return blocks;
  }

  if (available <= 119) {
    // 60-120 min: 25-min focus blocks, 5-min breaks, 1 longer break if needed
    const reviewMins = 5;
    let remaining = available - reviewMins;
    let longBreakAdded = false;
    let blockCount = 0;

    while (remaining > 0) {
      const focusMins = Math.min(25, remaining);
      blocks.push(focus(focusMins));
      remaining -= focusMins;
      blockCount++;

      if (remaining > 0) {
        if (!longBreakAdded && blockCount >= 2) {
          const lb = Math.min(10, remaining);
          blocks.push(longBreak(lb));
          remaining -= lb;
          longBreakAdded = true;
        } else if (remaining > 5) {
          const sb = Math.min(5, remaining);
          blocks.push(shortBreak(sb));
          remaining -= sb;
        } else {
          break;
        }
      }
    }

    blocks.push(review(reviewMins));
    return blocks;
  }

  // > 120 min: repeated 25-min blocks, 5-min breaks, one 10-min long break around the middle
  const reviewMins = 5;
  let remaining = available - reviewMins;
  let blockCount = 0;
  const midpoint = remaining / 2;
  let elapsed = 0;
  let longBreakAdded = false;

  while (remaining > 0) {
    const focusMins = Math.min(25, remaining);
    blocks.push(focus(focusMins));
    remaining -= focusMins;
    elapsed += focusMins;
    blockCount++;

    if (remaining > 0) {
      if (!longBreakAdded && elapsed >= midpoint - 15) {
        const lb = Math.min(10, remaining);
        blocks.push(longBreak(lb));
        remaining -= lb;
        elapsed += lb;
        longBreakAdded = true;
      } else if (remaining > 5) {
        const sb = Math.min(5, remaining);
        blocks.push(shortBreak(sb));
        remaining -= sb;
        elapsed += sb;
      } else {
        break;
      }
    }
  }

  blocks.push(review(reviewMins));
  return blocks;
}

export function generateStudyPlan(durationMinutes: number): StudyBlock[] {
  blockCounter = 0;
  if (PRESET_PLANS[durationMinutes]) {
    return PRESET_PLANS[durationMinutes]();
  }
  return generateCustomPlan(durationMinutes);
}
