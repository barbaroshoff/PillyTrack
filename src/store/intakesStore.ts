import { create } from 'zustand';
import type { IntakeEvent, IntakeStatus } from '../db/intakes';
import { getIntakesForDate, markIntakeEvent, deleteIntakeEvent } from '../db/intakes';
import { completeCourseIfDone } from '../db/courses';
import { cancelIntakeNotifications } from '../services/notifications';

interface IntakesState {
  intakes: IntakeEvent[];
  loadToday: () => Promise<void>;
  markIntake: (id: string, status: IntakeStatus) => Promise<void>;
  deleteIntake: (id: string) => Promise<void>;
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export const useIntakesStore = create<IntakesState>((set, get) => ({
  intakes: [],

  loadToday: async () => {
    const intakes = await getIntakesForDate(todayIso());
    set({ intakes });
  },

  markIntake: async (id, status) => {
    await markIntakeEvent(id, status);
    // отменяем повторные напоминания при любом ответе
    await cancelIntakeNotifications(id).catch(() => {});
    const updated = get().intakes.map((i) =>
      i.id === id ? { ...i, status, marked_at: new Date().toISOString() } : i,
    );
    set({ intakes: updated });

    const intake = get().intakes.find((i) => i.id === id);
    if (intake) await completeCourseIfDone(intake.course_id);
  },

  deleteIntake: async (id) => {
    await deleteIntakeEvent(id);
    set({ intakes: get().intakes.filter((i) => i.id !== id) });
  },
}));

export function useTodayIntakes() {
  return useIntakesStore((s) => s.intakes);
}

export function useMarkIntake() {
  return useIntakesStore((s) => s.markIntake);
}
