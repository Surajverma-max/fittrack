import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateNutritionTargets } from '../utils/calculator';
import { IconCheck, IconTarget, IconFlame, IconScale, IconDumbbell } from '../components/Icons';
import './Goals.css';

export default function Goals() {
  const { user, profile, updateProfile } = useAuth();

  const [goals, setGoals] = useState({
    calories: 2100,
    protein: 130,
    carbs: 240,
    fat: 65,
    weightGoal: 70,
    waistGoal: 32,
    workoutFrequency: 5,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setGoals({
        calories: Number(profile.calorie_target) || 2100,
        protein: Number(profile.protein_target) || 130,
        carbs: Number(profile.carb_target) || 240,
        fat: Number(profile.fat_target) || 65,
        weightGoal: Number(profile.target_weight) || Number(profile.current_weight) || 70,
        waistGoal: 32,
        workoutFrequency: Number(profile.workout_frequency) || 5,
      });
    }
  }, [profile]);

  const handleChange = (field, value) => {
    const num = value === '' ? '' : Number(value);
    setGoals((prev) => ({
      ...prev,
      [field]: num,
    }));
    setSavedSuccess(false);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const sanitized = {
      calories: Math.max(0, Number(goals.calories) || 2100),
      protein: Math.max(0, Number(goals.protein) || 130),
      carbs: Math.max(0, Number(goals.carbs) || 240),
      fat: Math.max(0, Number(goals.fat) || 65),
      weightGoal: Math.max(0, Number(goals.weightGoal) || 70),
      waistGoal: Math.max(0, Number(goals.waistGoal) || 32),
      workoutFrequency: Math.min(7, Math.max(1, Number(goals.workoutFrequency) || 5)),
    };

    try {
      await updateProfile({
        calorie_target: sanitized.calories,
        protein_target: sanitized.protein,
        carb_target: sanitized.carbs,
        fat_target: sanitized.fat,
        target_weight: sanitized.weightGoal,
        workout_frequency: sanitized.workoutFrequency,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update goals:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Recalculate scientific targets based on your personal biometrics?')) {
      const targets = calculateNutritionTargets({
        weight: profile?.current_weight || 70,
        height: profile?.height || 175,
        age: profile?.age || 25,
        gender: profile?.gender || 'male',
        activityLevel: profile?.activity_level || 'moderate',
        goal: profile?.goal || 'maintain',
      });

      const resetValues = {
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
        weightGoal: profile?.target_weight || profile?.current_weight || 70,
        waistGoal: 32,
        workoutFrequency: 5,
      };

      setGoals(resetValues);
      await updateProfile({
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carb_target: targets.carbs,
        fat_target: targets.fat,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Macro Energy Math
  const proteinKcal = (Number(goals.protein) || 0) * 4;
  const carbsKcal = (Number(goals.carbs) || 0) * 4;
  const fatKcal = (Number(goals.fat) || 0) * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  return (
    <div className="ft-goals ft-animate-fade">
      {/* Toast */}
      {savedSuccess && (
        <div className="ft-toast ft-animate-slide-up">
          <IconCheck size={16} />
          <span>Targets & Goals updated across your dashboard!</span>
        </div>
      )}

      {/* Header */}
      <header className="ft-goals__header">
        <div>
          <span className="ft-goals__eyebrow">Parameters & Targets</span>
          <h1 className="ft-goals__title">Targets & Goals</h1>
          <p className="ft-goals__subtitle">
            Configure your daily caloric threshold, macronutrient targets, and transformation milestones
          </p>
        </div>

        <button
          type="button"
          className="ft-btn ft-btn--secondary"
          onClick={handleReset}
        >
          ↺ Recalculate From Biometrics
        </button>
      </header>

      {/* Main Goal Configuration Form */}
      <form onSubmit={handleSave} className="ft-goals__form">
        {/* Card 1: Nutrition & Fuel Targets */}
        <div className="ft-goals-card">
          <div className="ft-goals-card__header">
            <div className="ft-goals-card__icon-wrap ft-goals-card__icon-wrap--emerald">
              <IconFlame size={20} />
            </div>
            <div>
              <h3 className="ft-goals-card__title">Daily Nutrition & Macronutrient Targets</h3>
              <p className="ft-goals-card__sub">
                Current Macro Calorie Equivalent: <strong>{totalMacroKcal.toLocaleString()} kcal</strong>
              </p>
            </div>
          </div>

          <div className="ft-goals-card__grid">
            <div className="ft-goal-field">
              <label>Daily Calorie Target</label>
              <div className="ft-goal-field__input-wrap">
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="50"
                  value={goals.calories}
                  onChange={(e) => handleChange('calories', e.target.value)}
                  required
                />
                <span className="ft-goal-field__unit">kcal</span>
              </div>
              <span className="ft-goal-field__hint">Total daily energy ceiling</span>
            </div>

            <div className="ft-goal-field ft-goal-field--primary">
              <label>Daily Protein Goal</label>
              <div className="ft-goal-field__input-wrap">
                <input
                  type="number"
                  min="20"
                  max="500"
                  step="5"
                  value={goals.protein}
                  onChange={(e) => handleChange('protein', e.target.value)}
                  required
                />
                <span className="ft-goal-field__unit">grams</span>
              </div>
              <span className="ft-goal-field__hint">Priority for muscle retention ({proteinKcal} kcal)</span>
            </div>

            <div className="ft-goal-field">
              <label>Daily Carbohydrates Goal</label>
              <div className="ft-goal-field__input-wrap">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="5"
                  value={goals.carbs}
                  onChange={(e) => handleChange('carbs', e.target.value)}
                  required
                />
                <span className="ft-goal-field__unit">grams</span>
              </div>
              <span className="ft-goal-field__hint">Primary training fuel ({carbsKcal} kcal)</span>
            </div>

            <div className="ft-goal-field">
              <label>Daily Fat Goal</label>
              <div className="ft-goal-field__input-wrap">
                <input
                  type="number"
                  min="10"
                  max="300"
                  step="5"
                  value={goals.fat}
                  onChange={(e) => handleChange('fat', e.target.value)}
                  required
                />
                <span className="ft-goal-field__unit">grams</span>
              </div>
              <span className="ft-goal-field__hint">Essential hormone support ({fatKcal} kcal)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Physical Body Milestones */}
        <div className="ft-goals-card">
          <div className="ft-goals-card__header">
            <div className="ft-goals-card__icon-wrap ft-goals-card__icon-wrap--charcoal">
              <IconScale size={20} />
            </div>
            <div>
              <h3 className="ft-goals-card__title">Target Body Composition</h3>
              <p className="ft-goals-card__sub">Desired long-term scale and measurement benchmarks</p>
            </div>
          </div>

          <div className="ft-goals-card__grid">
            <div className="ft-goal-field">
              <label>Target Body Weight</label>
              <div className="ft-goal-field__input-wrap">
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.5"
                  value={goals.weightGoal}
                  onChange={(e) => handleChange('weightGoal', e.target.value)}
                  required
                />
                <span className="ft-goal-field__unit">kg</span>
              </div>
              <span className="ft-goal-field__hint">Long term transformation target</span>
            </div>

            <div className="ft-goal-field">
              <label>Target Waist Circumference</label>
              <div className="ft-goal-field__input-wrap">
                <input
                  type="number"
                  min="20"
                  max="100"
                  step="0.5"
                  value={goals.waistGoal}
                  onChange={(e) => handleChange('waistGoal', e.target.value)}
                  required
                />
                <span className="ft-goal-field__unit">inches</span>
              </div>
              <span className="ft-goal-field__hint">Midsection composition goal</span>
            </div>
          </div>
        </div>

        {/* Card 3: Training Frequency */}
        <div className="ft-goals-card">
          <div className="ft-goals-card__header">
            <div className="ft-goals-card__icon-wrap ft-goals-card__icon-wrap--indigo">
              <IconDumbbell size={20} />
            </div>
            <div>
              <h3 className="ft-goals-card__title">Training Routine Frequency</h3>
              <p className="ft-goals-card__sub">Scheduled lifting and cardio sessions per week</p>
            </div>
          </div>

          <div className="ft-goals-card__grid">
            <div className="ft-goal-field">
              <label>Workout Frequency (days/week)</label>
              <div className="ft-goal-field__input-wrap">
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={goals.workoutFrequency}
                  onChange={(e) => handleChange('workoutFrequency', e.target.value)}
                  required
                />
                <span className="ft-goal-field__unit">days/wk</span>
              </div>
              <span className="ft-goal-field__hint">Target training consistency</span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="ft-goals__save-bar">
          <button
            type="submit"
            className="ft-btn ft-btn--primary ft-goals__save-btn"
            disabled={isSaving}
          >
            <IconCheck size={18} />
            <span>{isSaving ? 'Saving...' : 'Save All Target Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
