export const workoutProgram = {
  monday: {
    name: 'Push A',
    isRest: false,
    exercises: [
      { id: 'push_a_1', name: 'Incline Barbell / Machine Press', muscle: 'Chest', sets: 3, reps: '5-8', weight: 0 },
      { id: 'push_a_2', name: 'Flat DB / Machine Press', muscle: 'Chest', sets: 3, reps: '8-12', weight: 0 },
      { id: 'push_a_3', name: 'Seated Shoulder Press', muscle: 'Shoulders', sets: 2, reps: '6-10', weight: 0 },
      { id: 'push_a_4', name: 'Lateral Raise', muscle: 'Side Delts', sets: 4, reps: '10-20', weight: 0 },
      { id: 'push_a_5', name: 'Cable / Machine Fly', muscle: 'Chest', sets: 2, reps: '10-15', weight: 0 },
      { id: 'push_a_6', name: 'Triceps Pressdown', muscle: 'Triceps', sets: 3, reps: '8-15', weight: 0 },
      { id: 'push_a_7', name: 'Overhead Triceps Extension', muscle: 'Triceps', sets: 2, reps: '10-15', weight: 0 },
    ],
  },
  tuesday: {
    name: 'Pull A',
    isRest: false,
    exercises: [
      { id: 'pull_a_1', name: 'Pull-up / Lat Pulldown', muscle: 'Lats', sets: 4, reps: '6-10', weight: 0 },
      { id: 'pull_a_2', name: 'Chest-Supported Row', muscle: 'Upper Back', sets: 3, reps: '6-10', weight: 0 },
      { id: 'pull_a_3', name: 'Single-Arm Lat Pulldown', muscle: 'Lats', sets: 3, reps: '8-12', weight: 0 },
      { id: 'pull_a_4', name: 'Cable / Machine Row', muscle: 'Back', sets: 2, reps: '8-12', weight: 0 },
      { id: 'pull_a_5', name: 'Rear-Delt Fly', muscle: 'Rear Delts', sets: 3, reps: '12-20', weight: 0 },
      { id: 'pull_a_6', name: 'EZ-Bar Curl', muscle: 'Biceps', sets: 3, reps: '8-12', weight: 0 },
      { id: 'pull_a_7', name: 'Incline DB Curl', muscle: 'Biceps', sets: 2, reps: '10-15', weight: 0 },
    ],
  },
  wednesday: {
    name: 'Legs A + Abs',
    isRest: false,
    exercises: [
      { id: 'legs_a_1', name: 'Squat / Hack Squat', muscle: 'Quads', sets: 3, reps: '5-8', weight: 0 },
      { id: 'legs_a_2', name: 'Romanian Deadlift', muscle: 'Hamstrings', sets: 3, reps: '6-10', weight: 0 },
      { id: 'legs_a_3', name: 'Leg Press', muscle: 'Quads', sets: 3, reps: '8-12', weight: 0 },
      { id: 'legs_a_4', name: 'Leg Curl', muscle: 'Hamstrings', sets: 3, reps: '10-15', weight: 0 },
      { id: 'legs_a_5', name: 'Calf Raise', muscle: 'Calves', sets: 4, reps: '8-15', weight: 0 },
      { id: 'legs_a_6', name: 'Cable Crunch', muscle: 'Abs', sets: 3, reps: '8-15', weight: 0 },
      { id: 'legs_a_7', name: 'Hanging Leg Raise', muscle: 'Abs', sets: 3, reps: '8-15', weight: 0 },
    ],
  },
  thursday: {
    name: 'Push B',
    isRest: false,
    exercises: [
      { id: 'push_b_1', name: 'Incline DB / Machine Press', muscle: 'Upper Chest', sets: 3, reps: '8-12', weight: 0 },
      { id: 'push_b_2', name: 'Machine Chest Press', muscle: 'Chest', sets: 3, reps: '8-12', weight: 0 },
      { id: 'push_b_3', name: 'Machine / DB Shoulder Press', muscle: 'Shoulders', sets: 2, reps: '8-12', weight: 0 },
      { id: 'push_b_4', name: 'Lateral Raise', muscle: 'Side Delts', sets: 5, reps: '12-20', weight: 0 },
      { id: 'push_b_5', name: 'Low-to-High Cable Fly', muscle: 'Upper Chest', sets: 2, reps: '10-15', weight: 0 },
      { id: 'push_b_6', name: 'Overhead Triceps Extension', muscle: 'Triceps', sets: 3, reps: '8-12', weight: 0 },
      { id: 'push_b_7', name: 'Pressdown', muscle: 'Triceps', sets: 2, reps: '10-15', weight: 0 },
    ],
  },
  friday: {
    name: 'Pull B',
    isRest: false,
    exercises: [
      { id: 'pull_b_1', name: 'Lat Pulldown / Pull-up Variation', muscle: 'Lats', sets: 4, reps: '8-12', weight: 0 },
      { id: 'pull_b_2', name: 'One-Arm Cable Lat-Focused Row', muscle: 'Lats', sets: 3, reps: '8-12', weight: 0 },
      { id: 'pull_b_3', name: 'Chest-Supported Row', muscle: 'Upper Back', sets: 3, reps: '8-12', weight: 0 },
      { id: 'pull_b_4', name: 'Straight-Arm Pulldown', muscle: 'Lats', sets: 2, reps: '10-15', weight: 0 },
      { id: 'pull_b_5', name: 'Rear-Delt Fly', muscle: 'Rear Delts', sets: 3, reps: '12-20', weight: 0 },
      { id: 'pull_b_6', name: 'DB / EZ Curl', muscle: 'Biceps', sets: 3, reps: '8-12', weight: 0 },
      { id: 'pull_b_7', name: 'Hammer Curl', muscle: 'Biceps', sets: 3, reps: '10-15', weight: 0 },
    ],
  },
  saturday: {
    name: 'Legs B + Arms + Abs',
    isRest: false,
    exercises: [
      { id: 'legs_b_1', name: 'Leg Press / Hack Squat', muscle: 'Quads', sets: 3, reps: '8-12', weight: 0 },
      { id: 'legs_b_2', name: 'Bulgarian Split Squat', muscle: 'Quads / Glutes', sets: 3, reps: '8-12 per leg', weight: 0 },
      { id: 'legs_b_3', name: 'Leg Curl', muscle: 'Hamstrings', sets: 3, reps: '10-15', weight: 0 },
      { id: 'legs_b_4', name: 'Calf Raise', muscle: 'Calves', sets: 4, reps: '10-15', weight: 0 },
      { id: 'legs_b_5', name: 'DB / Cable Curl', muscle: 'Biceps', sets: 3, reps: '10-15', weight: 0 },
      { id: 'legs_b_6', name: 'Rope Pressdown', muscle: 'Triceps', sets: 3, reps: '10-15', weight: 0 },
      { id: 'legs_b_7', name: 'Weighted Crunch', muscle: 'Abs', sets: 3, reps: '8-15', weight: 0 },
      { id: 'legs_b_8', name: 'Reverse Crunch', muscle: 'Abs', sets: 3, reps: '10-15', weight: 0 },
    ],
  },
  sunday: {
    name: 'Rest + Walking',
    isRest: true,
    exercises: [
      { id: 'rest_1', name: 'Easy Walking', muscle: 'Recovery', sets: 1, reps: '30-60 min', weight: 0, isCardio: true },
    ],
  },
};

export const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function getTodayWorkout() {
  const today = dayNames[new Date().getDay()];
  return { day: today, ...workoutProgram[today] };
}

export function getWorkoutForDay(day) {
  return { day, ...workoutProgram[day] };
}
