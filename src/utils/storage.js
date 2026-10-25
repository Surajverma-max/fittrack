// Storage keys
export const KEYS = {
  GOALS: 'fittrack_goals',
  NUTRITION_LOG: 'fittrack_nutrition_data',
  CUSTOM_FOODS: 'fittrack_custom_foods',
  WORKOUT_HISTORY: 'fittrack_workout_history',
  STRENGTH_DATA: 'fittrack_strength_data',
  WEIGHT_DATA: 'fittrack_weight_data',
  WAIST_DATA: 'fittrack_waist_data',
  MEASUREMENT_HISTORY: 'fittrack_measurement_history',
};

export const getWorkoutDayKey = (day) => `fittrack_workout_${day.toLowerCase()}`;

export const DEFAULT_WEIGHT_DATA = [
  { date: '2026-01-01', weight: 86 },
  { date: '2026-01-15', weight: 83 },
  { date: '2026-02-01', weight: 80 },
  { date: '2026-02-15', weight: 78 },
  { date: '2026-03-01', weight: 75 },
  { date: '2026-03-15', weight: 72 },
];

export const DEFAULT_WAIST_DATA = [
  { date: '2026-01-01', waist: 36 },
  { date: '2026-03-15', waist: 33 },
];

export function loadData(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}
