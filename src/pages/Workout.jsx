import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService, getLocalDateString } from '../services/dataService';
import { generateId } from '../utils/storage';
import { workoutProgram, dayNames, dayLabels } from '../data/workoutProgram';
import WorkoutExercise from '../components/WorkoutExercise';
import Modal from '../components/Modal';
import {
  IconDumbbell,
  IconCheck,
  IconPlus,
  IconAward,
  IconHistory,
  IconSparkles,
} from '../components/Icons';
import './Workout.css';

export default function Workout() {
  const { user } = useAuth();
  const todayDate = getLocalDateString();
  const todayDay = dayNames[new Date().getDay()];

  const [selectedDay, setSelectedDay] = useState(todayDay);
  const [exercises, setExercises] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExForm, setNewExForm] = useState({ name: '', muscle: '', sets: 3, reps: '8-12' });
  const [completionRecord, setCompletionRecord] = useState(null);

  const workout = workoutProgram[selectedDay] || { name: 'Rest Day', isRest: true, exercises: [] };

  // Load user's workout exercises for the selected day
  const loadDayExercises = useCallback((day) => {
    if (!user?.id) return;
    const key = `workout_${day.toLowerCase()}`;
    const saved = dataService.localStore ? dataService.localStore.getUserData(user.id, key, null) : null;
    if (saved && Array.isArray(saved) && saved.length > 0) {
      setExercises(saved);
      return;
    }

    const program = workoutProgram[day];
    if (!program) {
      setExercises([]);
      return;
    }

    const initial = (program.exercises || []).map((e) => ({
      ...e,
      actualReps: e.actualReps !== undefined ? e.actualReps : parseInt(e.reps) || 8,
      actualSets: e.actualSets !== undefined ? e.actualSets : e.sets,
      completed: !!e.completed,
      weight: e.weight || 0,
    }));
    setExercises(initial);
  }, [user?.id]);

  useEffect(() => {
    loadDayExercises(selectedDay);
  }, [selectedDay, loadDayExercises]);

  // Persist day exercises
  const updateAndPersist = useCallback(
    (updated) => {
      setExercises(updated);
      if (user?.id) {
        const key = `workout_${selectedDay.toLowerCase()}`;
        dataService.localStore.setUserData(user.id, key, updated);
      }
    },
    [user?.id, selectedDay]
  );

  // Switch day
  const handleDayChange = (day) => {
    setSelectedDay(day);
    setCompletionRecord(null);
  };

  const handleExerciseChange = useCallback(
    (id, updatedEx) => {
      setExercises((prev) => {
        const next = prev.map((e) => (e.id === id ? updatedEx : e));
        if (user?.id) {
          const key = `workout_${selectedDay.toLowerCase()}`;
          dataService.localStore.setUserData(user.id, key, next);
        }
        return next;
      });
    },
    [user?.id, selectedDay]
  );

  const handleDeleteExercise = useCallback(
    (id) => {
      setExercises((prev) => {
        const next = prev.filter((e) => e.id !== id);
        if (user?.id) {
          const key = `workout_${selectedDay.toLowerCase()}`;
          dataService.localStore.setUserData(user.id, key, next);
        }
        return next;
      });
    },
    [user?.id, selectedDay]
  );

  const handleResetDay = () => {
    if (window.confirm(`Reset ${workout.name} back to default program exercises?`)) {
      const defaults = (workoutProgram[selectedDay]?.exercises || []).map((e) => ({
        ...e,
        actualReps: parseInt(e.reps) || 8,
        actualSets: e.sets,
        completed: false,
        weight: 0,
      }));
      setExercises(defaults);
      if (user?.id) {
        const key = `workout_${selectedDay.toLowerCase()}`;
        dataService.localStore.setUserData(user.id, key, defaults);
      }
      setCompletionRecord(null);
    }
  };

  const handleAddCustomExercise = (e) => {
    e.preventDefault();
    if (!newExForm.name.trim()) return;
    const newEx = {
      id: 'custom_' + generateId(),
      name: newExForm.name.trim(),
      muscle: newExForm.muscle.trim() || 'General',
      sets: Number(newExForm.sets) || 3,
      reps: newExForm.reps.trim() || '8-12',
      weight: 0,
      actualReps: parseInt(newExForm.reps) || 10,
      actualSets: Number(newExForm.sets) || 3,
      completed: false,
    };
    const next = [...exercises, newEx];
    updateAndPersist(next);
    setNewExForm({ name: '', muscle: '', sets: 3, reps: '8-12' });
    setShowAddModal(false);
  };

  // Live Stats
  const stats = useMemo(() => {
    const totalExercises = exercises.length;
    const completedCount = exercises.filter((e) => e.completed).length;
    const totalSets = exercises.reduce((s, e) => s + (Number(e.actualSets) || Number(e.sets) || 0), 0);
    const totalVolume = exercises.reduce((v, e) => {
      if (e.isCardio) return v;
      const w = Number(e.weight) || 0;
      const s = Number(e.actualSets) || Number(e.sets) || 0;
      const r = Number(e.actualReps) || parseInt(e.reps) || 0;
      return v + w * r * s;
    }, 0);
    const progressPct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

    return { totalExercises, completedCount, totalSets, totalVolume, progressPct };
  }, [exercises]);

  // Finish Workout & PR Detection
  const handleFinishWorkout = async () => {
    if (!user?.id) return;
    const { totalExercises, totalSets, totalVolume } = stats;

    const strengthData = await dataService.getStrengthData(user.id);
    const newPRs = [];
    const updatedStrength = { ...strengthData };

    for (const ex of exercises) {
      const name = ex.name.toLowerCase();
      const weight = Number(ex.weight) || 0;
      const reps = Number(ex.actualReps) || parseInt(ex.reps) || 0;

      // Bench press check
      if ((name.includes('bench') || name.includes('chest press')) && weight > 0) {
        if (weight > (updatedStrength.benchPress?.value || 0)) {
          newPRs.push(`Bench Press: ${weight} kg`);
          updatedStrength.benchPress = { ...updatedStrength.benchPress, value: weight };
        }
      }

      // Squat check
      if (name.includes('squat') && !name.includes('split') && weight > 0) {
        if (weight > (updatedStrength.squat?.value || 0)) {
          newPRs.push(`Squat: ${weight} kg`);
          updatedStrength.squat = { ...updatedStrength.squat, value: weight };
        }
      }

      // Deadlift check
      if (name.includes('deadlift') && weight > 0) {
        if (weight > (updatedStrength.deadlift?.value || 0)) {
          newPRs.push(`Deadlift: ${weight} kg`);
          updatedStrength.deadlift = { ...updatedStrength.deadlift, value: weight };
        }
      }

      // Pull-ups check
      if ((name.includes('pull-up') || name.includes('pullup')) && reps > 0) {
        if (reps > (updatedStrength.pullUps?.value || 0)) {
          newPRs.push(`Pull-ups: ${reps} reps`);
          updatedStrength.pullUps = { ...updatedStrength.pullUps, value: reps };
        }
      }
    }

    if (newPRs.length > 0) {
      await dataService.updateStrengthData(user.id, updatedStrength);
    }

    // Mark current session completed
    const completedExercises = exercises.map((e) => ({ ...e, completed: true }));
    updateAndPersist(completedExercises);

    const record = {
      id: generateId(),
      date: todayDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      day: selectedDay,
      name: workout.name,
      exercises: completedExercises.map((e) => ({
        name: e.name,
        muscle: e.muscle,
        weight: Number(e.weight) || 0,
        reps: Number(e.actualReps) || parseInt(e.reps) || 0,
        sets: Number(e.actualSets) || Number(e.sets) || 0,
        completed: true,
        isCardio: !!e.isCardio,
      })),
      totalExercises,
      totalSets,
      total_volume: totalVolume,
      duration: 45,
      newPRs,
    };

    await dataService.saveWorkoutSession(user.id, record);
    setCompletionRecord(record);
  };

  return (
    <div className="ft-workout ft-animate-fade">
      {/* Day Selector Pills */}
      <div className="ft-workout__day-selector">
        {dayNames.map((day) => {
          const isCurrent = day === todayDay;
          const isSel = day === selectedDay;
          return (
            <button
              key={day}
              type="button"
              className={`ft-day-pill ${isSel ? 'ft-day-pill--active' : ''} ${isCurrent ? 'ft-day-pill--today' : ''}`}
              onClick={() => handleDayChange(day)}
            >
              <span className="ft-day-pill__sub">{day.slice(0, 3)}</span>
              <span className="ft-day-pill__label">{dayLabels[day]}</span>
              {isCurrent && <span className="ft-day-pill__badge">Today</span>}
            </button>
          );
        })}
      </div>

      {/* Hero Header */}
      <header className="ft-workout__hero">
        <div className="ft-workout__hero-info">
          <span className="ft-workout__eyebrow">Session Program · {selectedDay}</span>
          <h1 className="ft-workout__title">{workout.name}</h1>
          <p className="ft-workout__sub">
            {workout.description || 'Target key muscle groups with structured progressive sets.'}
          </p>
        </div>

        {/* Live Volume & Progress Metric Pills */}
        {!workout.isRest && (
          <div className="ft-workout__metrics-strip">
            <div className="ft-live-metric">
              <span className="label">Exercises</span>
              <strong className="val">
                {stats.completedCount} / {stats.totalExercises}
              </strong>
            </div>

            <div className="ft-live-metric">
              <span className="label">Total Sets</span>
              <strong className="val">{stats.totalSets}</strong>
            </div>

            <div className="ft-live-metric ft-live-metric--volume">
              <span className="label">Total Volume</span>
              <strong className="val">{stats.totalVolume.toLocaleString()} kg</strong>
            </div>
          </div>
        )}
      </header>

      {/* Rest Day Card */}
      {workout.isRest ? (
        <div className="ft-rest-card ft-animate-slide-up">
          <div className="ft-rest-card__icon-wrap">🚶</div>
          <h2>Active Recovery & Walking Day</h2>
          <p>
            Aim for 30–60 minutes of low-intensity walking, hydration, mobility drills, and optimal nutrition recovery.
          </p>
          <div className="ft-rest-card__actions">
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => handleDayChange(dayNames[0])}
            >
              Preview Push A Routine →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Action Row */}
          <div className="ft-workout__action-row">
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => setShowAddModal(true)}
            >
              <IconPlus size={16} />
              <span>Add Custom Exercise</span>
            </button>

            <button
              type="button"
              className="ft-btn ft-btn--secondary ft-workout__reset-btn"
              onClick={handleResetDay}
            >
              ↺ Reset Program
            </button>
          </div>

          {/* Exercises List */}
          <div className="ft-workout__exercise-list">
            {exercises.map((ex, index) => (
              <WorkoutExercise
                key={ex.id || index}
                exercise={ex}
                index={index}
                onChange={(updated) => handleExerciseChange(ex.id, updated)}
                onDelete={() => handleDeleteExercise(ex.id)}
              />
            ))}
          </div>

          {/* Sticky Bottom Finish Bar */}
          <div className="ft-workout__finish-bar">
            <div className="ft-workout__finish-summary">
              <strong>{stats.completedCount} of {stats.totalExercises} exercises completed</strong>
              <span>· {stats.totalVolume.toLocaleString()} kg total volume</span>
            </div>

            <button
              type="button"
              className="ft-btn ft-btn--emerald ft-workout__finish-btn"
              onClick={handleFinishWorkout}
            >
              <IconCheck size={18} />
              <span>Finish & Save Workout</span>
            </button>
          </div>
        </>
      )}

      {/* Add Custom Exercise Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Custom Exercise"
        maxWidth="460px"
      >
        <form onSubmit={handleAddCustomExercise} className="ft-form-stack">
          <div className="ft-form-stack__field">
            <label>Exercise Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Incline Dumbbell Press"
              value={newExForm.name}
              onChange={(e) => setNewExForm({ ...newExForm, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="ft-form-stack__field">
            <label>Target Muscle Group</label>
            <input
              type="text"
              placeholder="e.g. Upper Chest / Shoulders"
              value={newExForm.muscle}
              onChange={(e) => setNewExForm({ ...newExForm, muscle: e.target.value })}
            />
          </div>

          <div className="ft-form-row">
            <div className="ft-form-stack__field">
              <label>Sets</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newExForm.sets}
                onChange={(e) => setNewExForm({ ...newExForm, sets: e.target.value })}
              />
            </div>
            <div className="ft-form-stack__field">
              <label>Rep Range</label>
              <input
                type="text"
                placeholder="e.g. 8-12"
                value={newExForm.reps}
                onChange={(e) => setNewExForm({ ...newExForm, reps: e.target.value })}
              />
            </div>
          </div>

          <div className="ft-modal-actions">
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="ft-btn ft-btn--primary">
              Add Exercise
            </button>
          </div>
        </form>
      </Modal>

      {/* Celebratory Completion Modal */}
      {completionRecord && (
        <Modal
          isOpen={!!completionRecord}
          onClose={() => setCompletionRecord(null)}
          title="Workout Complete!"
          maxWidth="480px"
        >
          <div className="ft-completion-celebration">
            <div className="ft-completion-celebration__trophy">🏆</div>
            <h3>Great session, athlete!</h3>
            <p>You completed <strong>{completionRecord.name}</strong> on {completionRecord.day}.</p>

            <div className="ft-completion-stats-grid">
              <div className="stat">
                <span className="label">Total Sets</span>
                <span className="val">{completionRecord.totalSets}</span>
              </div>
              <div className="stat">
                <span className="label">Volume</span>
                <span className="val">{completionRecord.total_volume?.toLocaleString()} kg</span>
              </div>
            </div>

            {completionRecord.newPRs && completionRecord.newPRs.length > 0 && (
              <div className="ft-pr-banner">
                <IconSparkles size={18} />
                <div>
                  <strong>New Personal Record{completionRecord.newPRs.length > 1 ? 's' : ''}!</strong>
                  <ul>
                    {completionRecord.newPRs.map((pr, i) => (
                      <li key={i}>{pr}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <button
              type="button"
              className="ft-btn ft-btn--primary ft-btn--full"
              style={{ marginTop: '20px' }}
              onClick={() => setCompletionRecord(null)}
            >
              Awesome!
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
