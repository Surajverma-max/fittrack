import React, { useState } from 'react';
import { IconCheck, IconTrash, IconDumbbell } from './Icons';
import './WorkoutExercise.css';

export default function WorkoutExercise({ exercise, onChange, onDelete }) {
  // Number of sets (fallback to target sets)
  const totalSets = Number(exercise.actualSets) || Number(exercise.sets) || 3;
  const currentWeight = Number(exercise.weight) || 0;
  const currentReps = Number(exercise.actualReps) || (parseInt(exercise.reps) || 8);

  // Per-set completion state or fallback
  const setDetails = exercise.setDetails || Array.from({ length: totalSets }, (_, i) => ({
    setNumber: i + 1,
    weight: currentWeight,
    reps: currentReps,
    completed: !!exercise.completed,
  }));

  const handleUpdateField = (field, value) => {
    onChange(exercise.id, {
      ...exercise,
      [field]: value,
    });
  };

  const handleWeightStep = (delta) => {
    const nextWeight = Math.max(0, parseFloat((currentWeight + delta).toFixed(1)));
    handleUpdateField('weight', nextWeight);
  };

  const handleRepsStep = (delta) => {
    const nextReps = Math.max(0, currentReps + delta);
    handleUpdateField('actualReps', nextReps);
  };

  const toggleSetComplete = (setIndex) => {
    const nextSets = setDetails.map((s, idx) => {
      if (idx === setIndex) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });

    const allDone = nextSets.every(s => s.completed);

    onChange(exercise.id, {
      ...exercise,
      setDetails: nextSets,
      completed: allDone,
    });
  };

  const toggleAllComplete = () => {
    const targetState = !exercise.completed;
    const nextSets = setDetails.map(s => ({ ...s, completed: targetState }));

    onChange(exercise.id, {
      ...exercise,
      completed: targetState,
      setDetails: nextSets,
      actualReps: exercise.actualReps || currentReps,
    });
  };

  return (
    <div className={`ft-exercise-card ${exercise.completed ? 'ft-exercise-card--completed' : ''}`}>
      {/* Exercise Header */}
      <div className="ft-exercise-card__header">
        <div className="ft-exercise-card__title-group">
          <span className="ft-exercise-card__muscle-tag">{exercise.muscle}</span>
          <h3 className="ft-exercise-card__name">{exercise.name}</h3>
          <span className="ft-exercise-card__target-label">
            Target: <strong>{exercise.sets} sets · {exercise.reps} reps</strong>
          </span>
        </div>

        <div className="ft-exercise-card__header-actions">
          <button
            type="button"
            className={`ft-exercise-card__done-toggle ${exercise.completed ? 'ft-exercise-card__done-toggle--active' : ''}`}
            onClick={toggleAllComplete}
            title={exercise.completed ? 'Mark incomplete' : 'Mark all sets complete'}
          >
            <IconCheck size={18} />
            <span>{exercise.completed ? 'Completed' : 'Complete'}</span>
          </button>

          <button
            type="button"
            className="ft-exercise-card__del-btn"
            onClick={() => onDelete(exercise.id)}
            title="Remove exercise"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      {/* Main Stepper Inputs for Mobile & Fast Logging */}
      {!exercise.isCardio ? (
        <div className="ft-exercise-card__quick-inputs">
          {/* Weight Control */}
          <div className="ft-exercise-stepper">
            <span className="ft-exercise-stepper__label">Working Weight</span>
            <div className="ft-exercise-stepper__controls">
              <button
                type="button"
                className="ft-exercise-stepper__btn"
                onClick={() => handleWeightStep(-2.5)}
              >
                –2.5
              </button>
              <div className="ft-exercise-stepper__input-wrap">
                <input
                  type="number"
                  step="2.5"
                  min="0"
                  value={exercise.weight || ''}
                  onChange={(e) => handleUpdateField('weight', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                <span className="ft-exercise-stepper__unit">kg</span>
              </div>
              <button
                type="button"
                className="ft-exercise-stepper__btn"
                onClick={() => handleWeightStep(2.5)}
              >
                +2.5
              </button>
            </div>
          </div>

          {/* Reps Control */}
          <div className="ft-exercise-stepper">
            <span className="ft-exercise-stepper__label">Reps Completed</span>
            <div className="ft-exercise-stepper__controls">
              <button
                type="button"
                className="ft-exercise-stepper__btn"
                onClick={() => handleRepsStep(-1)}
              >
                –1
              </button>
              <div className="ft-exercise-stepper__input-wrap">
                <input
                  type="number"
                  min="0"
                  value={exercise.actualReps !== undefined && exercise.actualReps !== 0 ? exercise.actualReps : ''}
                  onChange={(e) => handleUpdateField('actualReps', parseInt(e.target.value) || 0)}
                  placeholder={exercise.reps}
                />
                <span className="ft-exercise-stepper__unit">reps</span>
              </div>
              <button
                type="button"
                className="ft-exercise-stepper__btn"
                onClick={() => handleRepsStep(1)}
              >
                +1
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="ft-exercise-card__cardio-note">
          <span>Cardio / Recovery Target: {exercise.reps}</span>
        </div>
      )}

      {/* Set-by-Set Visual Checklist */}
      {!exercise.isCardio && (
        <div className="ft-exercise-card__sets-list">
          {setDetails.slice(0, totalSets).map((set, idx) => {
            const isDone = set.completed || exercise.completed;
            return (
              <div
                key={idx}
                className={`ft-set-row ${isDone ? 'ft-set-row--done' : ''}`}
                onClick={() => toggleSetComplete(idx)}
              >
                <span className="ft-set-row__num">Set {idx + 1}</span>
                <span className="ft-set-row__metrics">
                  {currentWeight > 0 ? `${currentWeight} kg × ` : ''}{currentReps} reps
                </span>
                <button
                  type="button"
                  className={`ft-set-row__check ${isDone ? 'ft-set-row__check--checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSetComplete(idx);
                  }}
                >
                  <IconCheck size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
