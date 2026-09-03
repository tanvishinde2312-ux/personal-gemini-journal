import { JournalInteraction, DailyFocusRecord, DailyFocusItem, ActionPlan } from '../types';

/**
 * Returns consistent local calendar date representation as YYYY-MM-DD
 * (e.g. "2026-09-02"). Does not rely on UTC string conversion.
 */
export function getLocalTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD string into a friendly, accessible display string
 */
export function formatFocusDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return 'Today';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    if (!y || !m || !d) return dateStr;
    
    const dateObj = new Date(y, m - 1, d);
    const todayStr = getLocalTodayDateString();
    const isToday = dateStr === todayStr;

    const formatted = dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return isToday ? `Today (${formatted})` : formatted;
  } catch {
    return dateStr;
  }
}

/**
 * Safely parses and sanitizes stored Daily Focus data to prevent any runtime crashes
 * from malformed, undefined, or legacy structures.
 */
export function sanitizeDailyFocusRecord(
  raw: any, 
  interactionId: string, 
  fallbackGoal: string = '',
  targetDate: string = getLocalTodayDateString()
): DailyFocusRecord {
  if (!raw || typeof raw !== 'object') {
    return {
      date: targetDate,
      interactionId,
      goal: fallbackGoal,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const date = typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) 
    ? raw.date 
    : targetDate;

  const goal = typeof raw.goal === 'string' && raw.goal.trim() 
    ? raw.goal.trim() 
    : fallbackGoal;

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: DailyFocusItem[] = rawItems
    .filter((it: any) => it && typeof it === 'object' && typeof it.text === 'string' && it.text.trim())
    .map((it: any, idx: number) => ({
      id: typeof it.id === 'string' && it.id ? it.id : `focus-item-${idx}-${Date.now()}`,
      stepIndex: typeof it.stepIndex === 'number' && !isNaN(it.stepIndex) ? it.stepIndex : idx,
      text: String(it.text).trim(),
      completed: Boolean(it.completed),
      completedAt: it.completedAt && typeof it.completedAt === 'string' ? it.completedAt : undefined,
    }));

  return {
    date,
    interactionId: typeof raw.interactionId === 'string' ? raw.interactionId : interactionId,
    goal,
    items,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

/**
 * Safely extracts action steps from an ActionPlan object
 */
export function getActionStepsFromPlan(plan?: ActionPlan | null): string[] {
  if (!plan) return [];
  if (Array.isArray(plan.actionSteps) && plan.actionSteps.length > 0) {
    return plan.actionSteps.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(plan.actionPlan) && plan.actionPlan.length > 0) {
    return plan.actionPlan.map(String).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Retrieve the DailyFocusRecord for a specific date from a JournalInteraction
 */
export function getDailyFocusForDate(
  interaction: JournalInteraction | null,
  dateStr: string = getLocalTodayDateString()
): DailyFocusRecord | null {
  if (!interaction) return null;

  const fallbackGoal = interaction.plan?.suggestedGoal || '';
  const dailyFocusMap = interaction.dailyFocus;

  if (dailyFocusMap && typeof dailyFocusMap === 'object' && !Array.isArray(dailyFocusMap)) {
    const candidate = dailyFocusMap[dateStr];
    if (candidate) {
      return sanitizeDailyFocusRecord(candidate, interaction.id, fallbackGoal, dateStr);
    }
  }

  return null;
}

/**
 * Creates a clean, empty DailyFocusRecord for an interaction and date
 */
export function createEmptyDailyFocus(
  interaction: JournalInteraction,
  dateStr: string = getLocalTodayDateString()
): DailyFocusRecord {
  return {
    date: dateStr,
    interactionId: interaction.id,
    goal: interaction.plan?.suggestedGoal || '',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Toggles completion status of an individual item in a DailyFocusRecord
 */
export function toggleDailyFocusItem(
  record: DailyFocusRecord,
  itemId: string
): DailyFocusRecord {
  const updatedItems = record.items.map((item) => {
    if (item.id === itemId) {
      const nextCompleted = !item.completed;
      return {
        ...item,
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : undefined,
      };
    }
    return item;
  });

  return {
    ...record,
    items: updatedItems,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Saves/updates selected action steps as today's focus items.
 * Retains existing completion status if a step was previously selected today.
 */
export function saveDailyFocusSelection(
  existingRecord: DailyFocusRecord | null,
  interaction: JournalInteraction,
  selectedIndices: number[],
  dateStr: string = getLocalTodayDateString()
): DailyFocusRecord {
  const allSteps = getActionStepsFromPlan(interaction.plan);
  const goal = interaction.plan?.suggestedGoal || existingRecord?.goal || '';

  const existingMap = new Map<number, DailyFocusItem>();
  if (existingRecord?.items) {
    for (const item of existingRecord.items) {
      existingMap.set(item.stepIndex, item);
    }
  }

  const newItems: DailyFocusItem[] = selectedIndices
    .filter((idx) => idx >= 0 && idx < allSteps.length)
    .map((stepIdx) => {
      const existing = existingMap.get(stepIdx);
      const text = allSteps[stepIdx];
      if (existing) {
        return {
          ...existing,
          text,
        };
      }
      return {
        id: `focus-item-${Date.now()}-${stepIdx}-${Math.random().toString(36).slice(2, 6)}`,
        stepIndex: stepIdx,
        text,
        completed: false,
      };
    });

  return {
    date: dateStr,
    interactionId: interaction.id,
    goal,
    items: newItems,
    createdAt: existingRecord?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns formatted progress string e.g. "1 of 3 completed"
 */
export function getDailyFocusProgress(items: DailyFocusItem[]): {
  total: number;
  completed: number;
  progressText: string;
  percent: number;
} {
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    total,
    completed,
    progressText: `${completed} of ${total} completed`,
    percent,
  };
}

/**
 * Attaches or updates a DailyFocusRecord inside a JournalInteraction's dailyFocus dictionary
 */
export function attachDailyFocusToInteraction(
  interaction: JournalInteraction,
  record: DailyFocusRecord
): JournalInteraction {
  const existingMap = interaction.dailyFocus || {};
  return {
    ...interaction,
    dailyFocus: {
      ...existingMap,
      [record.date]: record,
    },
    updatedAt: new Date().toISOString(),
  };
}

