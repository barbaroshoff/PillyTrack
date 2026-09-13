import { create } from 'zustand';

interface ScanFlowState {
  medicationName: string;
  barcode: string | null;
  photoUri: string | null;
  pillsPerPack: number;
  timesPerDay: number;
  customTimes: string[];
  dosePerDay: number;
  existingMedicationId: string | null;
  existingCourseId: string | null;

  setField: <K extends keyof Omit<ScanFlowState, 'setField' | 'reset'>>(
    key: K,
    value: ScanFlowState[K],
  ) => void;
  reset: () => void;
}

const INITIAL: Omit<ScanFlowState, 'setField' | 'reset'> = {
  medicationName: '',
  barcode: null,
  photoUri: null,
  pillsPerPack: 30,
  timesPerDay: 1,
  customTimes: ['08:00'],
  dosePerDay: 1,
  existingMedicationId: null,
  existingCourseId: null,
};

export const useScanFlowStore = create<ScanFlowState>((set) => ({
  ...INITIAL,
  setField: (key, value) => set((s) => ({ ...s, [key]: value })),
  reset: () => set((s) => ({ ...s, ...INITIAL })),
}));
