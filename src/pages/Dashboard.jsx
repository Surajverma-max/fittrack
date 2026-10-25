import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService, getLocalDateString } from '../services/dataService';
import { formatDate } from '../utils/storage';
import { commonFoods } from '../data/foodDatabase';
import { workoutProgram, dayNames } from '../data/workoutProgram';

import NutritionSummary from '../components/NutritionSummary';
import QuickActions from '../components/QuickActions';
import FoodLogModal from '../components/FoodLogModal';
import Modal from '../components/Modal';
import {
  IconDumbbell,
  IconFlame,
  IconCheck,
  IconAward,
  IconTrendingUp,
  IconScale,
  IconRuler,
  IconChevronRight,
  IconSparkles,
} from '../components/Icons';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const today = getLocalDateString();

  // App State - Scoped strictly to current user
  const [nutritionLog, setNutritionLog] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [waistData, setWaistData] = useState([]);
  const [strengthData, setStrengthData] = useState({});

  // Modals & Feedback
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isCopyConfirmOpen, setIsCopyConfirmOpen] = useState(false);
  const [newWeightVal, setNewWeightVal] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const dayOfWeek = dayNames[new Date().getDay()];
  const todayWorkout = workoutProgram[dayOfWeek] || { name: 'Rest Day', exercises: [], isRest: true };

  // Load all user data
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [todayFoods, allCustom, workouts, weights, waists, strength] = await Promise.all([
        dataService.getFoodEntries(user.id, today),
        dataService.getCustomFoods(user.id),
        dataService.getWorkoutHistory(user.id),
        dataService.getWeightHistory(user.id),
        dataService.getWaistHistory(user.id),
        dataService.getStrengthData(user.id),
      ]);

      setNutritionLog(todayFoods || []);
      setCustomFoods(allCustom || []);
      setWorkoutHistory(workouts || []);
      setWeightData(weights || []);
      setWaistData(waists || []);
      setStrengthData(strength || {});
    } catch (err) {
      console.error('Error loading dashboard user data:', err);
    }
  }, [user?.id, today]);

  useEffect(() => {
    loadUserData();

    const handleRefresh = () => loadUserData();
    window.addEventListener('nutritionUpdated', handleRefresh);
    window.addEventListener('weightUpdated', handleRefresh);
    window.addEventListener('waistUpdated', handleRefresh);
    window.addEventListener('workoutUpdated', handleRefresh);
    window.addEventListener('strengthUpdated', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      window.removeEventListener('nutritionUpdated', handleRefresh);
      window.removeEventListener('weightUpdated', handleRefresh);
      window.removeEventListener('waistUpdated', handleRefresh);
      window.removeEventListener('workoutUpdated', handleRefresh);
      window.removeEventListener('strengthUpdated', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [loadUserData]);

  // Dynamic user goals from profile
  const goals = useMemo(() => {
    return {
      calories: Number(profile?.calorie_target) || 2100,
      protein: Number(profile?.protein_target) || 130,
      carbs: Number(profile?.carb_target) || 240,
      fat: Number(profile?.fat_target) || 65,
      weightGoal: Number(profile?.target_weight) || Number(profile?.current_weight) || 70,
      waistGoal: 32,
      workoutFrequency: 5,
    };
  }, [profile]);

  // Today's nutrition totals
  const totals = useMemo(() => {
    return (nutritionLog || []).reduce(
      (acc, e) => ({
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein) || 0),
        carbs: acc.carbs + (Number(e.carbs) || 0),
        fat: acc.fat + (Number(e.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [nutritionLog]);

  // Today's completed workout for current user
  const todayCompletedWorkout = useMemo(() => {
    return (workoutHistory || []).find((w) => w.date === today);
  }, [workoutHistory, today]);

  // Recent foods for quick add modal
  const recentFoods = useMemo(() => {
    const seen = new Set();
    const recent = [];
    for (const entry of nutritionLog) {
      const key = entry.food_name || entry.name;
      if (!seen.has(key)) {
        seen.add(key);
        recent.push({
          id: entry.id,
          name: key,
          serving: entry.serving_unit || entry.serving || '100g',
          calories: entry.calories / (entry.quantity || 1),
          protein: entry.protein / (entry.quantity || 1),
          carbs: (entry.carbs || 0) / (entry.quantity || 1),
          fat: (entry.fat || 0) / (entry.quantity || 1),
        });
        if (recent.length >= 8) break;
      }
    }
    return recent;
  }, [nutritionLog]);

  // Handlers
  const handleAddFood = async (food, qty) => {
    if (!user?.id) return;
    const entry = {
      food_name: food.name,
      serving_unit: food.serving,
      meal_type: 'lunch',
      quantity: qty,
      calories: Math.round(food.calories * qty),
      protein: Number((food.protein * qty).toFixed(1)),
      carbs: Number(((food.carbs || 0) * qty).toFixed(1)),
      fat: Number(((food.fat || 0) * qty).toFixed(1)),
      consumed_at: today,
    };

    await dataService.addFoodEntry(user.id, entry);
    showToast(`Added ${qty}× ${food.name} (${entry.calories} kcal)`);
  };

  const handleSaveCustomFood = async (food) => {
    if (!user?.id) return;
    await dataService.addCustomFood(user.id, food);
    showToast(`Custom food "${food.name}" saved!`);
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    const val = parseFloat(newWeightVal);
    if (isNaN(val) || val <= 0 || val > 300) return;

    await dataService.logWeight(user.id, val, today);
    setNewWeightVal('');
    setIsWeightModalOpen(false);
    showToast(`Weight recorded: ${val} kg`);
  };

  const handleCopyYesterday = async () => {
    if (!user?.id) return;
    const count = await dataService.copyYesterdayFoods(user.id, today);
    setIsCopyConfirmOpen(false);
    if (count > 0) {
      showToast(`Copied ${count} meals from yesterday!`);
    } else {
      showToast('No meals logged yesterday to copy.');
    }
  };

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Display Name
  const displayName = profile?.full_name || user?.name || 'Athlete';

  // Weight & Waist
  const currentWeightVal = weightData.length > 0
    ? weightData[weightData.length - 1].weight
    : profile?.current_weight || null;

  const currentWaistVal = waistData.length > 0
    ? waistData[waistData.length - 1].waist
    : null;

  // Weight transformation calculation
  const startWeightVal = weightData.length > 0 ? weightData[0].weight : currentWeightVal;
  const weightChange = currentWeightVal && startWeightVal ? (currentWeightVal - startWeightVal).toFixed(1) : 0;

  // Latest workout from history
  const latestWorkout = workoutHistory.length > 0 ? workoutHistory[0] : null;

  return (
    <div className="ft-dashboard ft-animate-fade">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="ft-toast ft-animate-slide-up">
          <IconCheck size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <header className="ft-dashboard__header">
        <div className="ft-dashboard__greeting-block">
          <span className="ft-dashboard__date-badge">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <h1 className="ft-dashboard__greeting">
            {greeting}, <span className="ft-dashboard__user-highlight">{displayName}</span>
          </h1>
          <p className="ft-dashboard__subtitle">Here's your fitness & nutrition progress for today.</p>
        </div>

        {/* Top Summary Chips */}
        <div className="ft-dashboard__consistency">
          <div className="ft-dashboard__metric-chip">
            <span className="ft-dashboard__chip-label">Nutrition</span>
            <span className="ft-dashboard__chip-val">
              {Math.min(100, Math.round((totals.calories / Math.max(goals.calories, 1)) * 100))}%
            </span>
          </div>

          <div className="ft-dashboard__metric-chip">
            <span className="ft-dashboard__chip-label">Workout</span>
            <span className={`ft-dashboard__chip-val ${todayCompletedWorkout ? 'ft-dashboard__chip-val--success' : ''}`}>
              {todayCompletedWorkout ? 'Completed' : '0/1'}
            </span>
          </div>

          <div className="ft-dashboard__metric-chip">
            <span className="ft-dashboard__chip-label">Weight</span>
            <span className="ft-dashboard__chip-val">
              {currentWeightVal ? `${currentWeightVal} kg` : 'Log weight'}
            </span>
          </div>
        </div>
      </header>

      {/* Prominent Daily Calorie & Fuel Section */}
      <section className="ft-dashboard__section">
        <NutritionSummary totals={totals} goals={goals} />
      </section>

      {/* Tactile Quick Actions */}
      <section className="ft-dashboard__section">
        <QuickActions
          onOpenFoodModal={() => setIsFoodModalOpen(true)}
          onOpenWeightModal={() => setIsWeightModalOpen(true)}
          onCopyYesterday={() => setIsCopyConfirmOpen(true)}
          todayWorkoutName={todayWorkout.name}
          isWorkoutCompleted={!!todayCompletedWorkout}
        />
      </section>

      {/* Interactive Main Dashboard Grid */}
      <div className="ft-dashboard__grid">
        {/* Left Column: Today's Workout Card */}
        <div className="ft-dashboard__card ft-dashboard__card--workout">
          <div className="ft-dashboard__card-header">
            <div>
              <span className="ft-dashboard__card-eyebrow">Scheduled Training</span>
              <h3 className="ft-dashboard__card-title">Today's Workout</h3>
            </div>
            <span className={`ft-badge ${todayCompletedWorkout ? 'ft-badge--success' : 'ft-badge--neutral'}`}>
              {todayCompletedWorkout ? 'Completed' : 'Today'}
            </span>
          </div>

          {todayWorkout.isRest ? (
            <div className="ft-workout-preview ft-workout-preview--rest">
              <div className="ft-workout-preview__icon-circle ft-workout-preview__icon-circle--emerald">
                🚶
              </div>
              <div>
                <h4 className="ft-workout-preview__name">Active Recovery & Walking</h4>
                <p className="ft-workout-preview__sub">30–60 minutes light stroll. Hydrate and recover well.</p>
              </div>
            </div>
          ) : todayCompletedWorkout ? (
            <div className="ft-workout-preview ft-workout-preview--done">
              <div className="ft-workout-preview__done-badge">
                <IconCheck size={24} />
              </div>
              <div className="ft-workout-preview__info">
                <h4 className="ft-workout-preview__name">{todayCompletedWorkout.name}</h4>
                <div className="ft-workout-preview__stats-row">
                  <span>{todayCompletedWorkout.duration || 45} mins</span>
                  <span>·</span>
                  <span>{(todayCompletedWorkout.total_volume || 0).toLocaleString()} kg volume</span>
                </div>
                <p className="ft-workout-preview__done-note">
                  Logged for today. Outstanding discipline!
                </p>
              </div>
            </div>
          ) : (
            <div className="ft-workout-preview">
              <div className="ft-workout-preview__header">
                <div>
                  <h4 className="ft-workout-preview__name">{todayWorkout.name}</h4>
                  <span className="ft-workout-preview__meta">
                    {todayWorkout.exercises?.length || 5} exercises planned
                  </span>
                </div>
              </div>

              <div className="ft-workout-preview__exercise-pills">
                {todayWorkout.exercises?.slice(0, 4).map((ex, i) => (
                  <span key={i} className="ft-exercise-pill">
                    {ex.name}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="ft-btn ft-btn--primary ft-workout-preview__btn"
                onClick={() => navigate('/workout')}
              >
                <IconDumbbell size={16} />
                <span>Start Workout Session</span>
                <IconChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="ft-dashboard__card">
          <div className="ft-dashboard__card-header">
            <div>
              <span className="ft-dashboard__card-eyebrow">Timeline</span>
              <h3 className="ft-dashboard__card-title">Recent Activity</h3>
            </div>
            <button
              type="button"
              className="ft-btn-link"
              onClick={() => navigate('/history')}
            >
              History →
            </button>
          </div>

          <div className="ft-activity-feed">
            {/* Last Logged Meal */}
            {nutritionLog.length > 0 ? (
              <div className="ft-activity-item">
                <div className="ft-activity-item__icon-wrap ft-activity-item__icon-wrap--emerald">
                  <IconFlame size={18} />
                </div>
                <div className="ft-activity-item__content">
                  <div className="ft-activity-item__top">
                    <span className="ft-activity-item__label">Latest Food Logged</span>
                    <span className="ft-activity-item__date">Today</span>
                  </div>
                  <strong className="ft-activity-item__heading">
                    {nutritionLog[nutritionLog.length - 1].food_name || nutritionLog[nutritionLog.length - 1].name}
                  </strong>
                  <span className="ft-activity-item__sub">
                    {Math.round(nutritionLog[nutritionLog.length - 1].calories)} kcal · {nutritionLog[nutritionLog.length - 1].protein}g protein
                  </span>
                </div>
              </div>
            ) : (
              <div className="ft-activity-item ft-activity-item--empty" onClick={() => setIsFoodModalOpen(true)}>
                <div className="ft-activity-item__icon-wrap">
                  <IconFlame size={18} />
                </div>
                <div className="ft-activity-item__content">
                  <strong className="ft-activity-item__heading">No meals logged yet today</strong>
                  <span className="ft-activity-item__action-link">+ Tap to log your first meal</span>
                </div>
              </div>
            )}

            {/* Recent Completed Workout */}
            {latestWorkout ? (
              <div className="ft-activity-item">
                <div className="ft-activity-item__icon-wrap ft-activity-item__icon-wrap--charcoal">
                  <IconDumbbell size={18} />
                </div>
                <div className="ft-activity-item__content">
                  <div className="ft-activity-item__top">
                    <span className="ft-activity-item__label">Latest Completed Session</span>
                    <span className="ft-activity-item__date">{formatDate(latestWorkout.date)}</span>
                  </div>
                  <strong className="ft-activity-item__heading">{latestWorkout.name}</strong>
                  <span className="ft-activity-item__sub">
                    {latestWorkout.duration || 45} mins · {(latestWorkout.total_volume || 0).toLocaleString()} kg volume
                  </span>
                </div>
              </div>
            ) : (
              <div className="ft-activity-item ft-activity-item--empty" onClick={() => navigate('/workout')}>
                <div className="ft-activity-item__icon-wrap">
                  <IconDumbbell size={18} />
                </div>
                <div className="ft-activity-item__content">
                  <strong className="ft-activity-item__heading">No workout completed yet</strong>
                  <span className="ft-activity-item__action-link">+ Start today's workout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body Metric Transformation Summary Cards */}
      <section className="ft-dashboard__section">
        <div className="ft-metrics-strip">
          <div className="ft-metric-card" onClick={() => navigate('/progress')}>
            <div className="ft-metric-card__header">
              <span className="ft-metric-card__icon-box">
                <IconScale size={16} />
              </span>
              <span className="ft-metric-card__label">Weight Progress</span>
            </div>
            <div className="ft-metric-card__body">
              <span className="ft-metric-card__value">
                {currentWeightVal || '--'} <span className="ft-metric-card__unit">kg</span>
              </span>
              <span className="ft-metric-card__trend ft-metric-card__trend--down">
                {weightData.length > 1
                  ? `${weightChange > 0 ? `+${weightChange}` : weightChange} kg from start (${startWeightVal} kg)`
                  : 'Baseline weight recorded'}
              </span>
            </div>
          </div>

          <div className="ft-metric-card" onClick={() => navigate('/progress')}>
            <div className="ft-metric-card__header">
              <span className="ft-metric-card__icon-box">
                <IconRuler size={16} />
              </span>
              <span className="ft-metric-card__label">Waist Measurement</span>
            </div>
            <div className="ft-metric-card__body">
              <span className="ft-metric-card__value">
                {currentWaistVal || '--'} <span className="ft-metric-card__unit">in</span>
              </span>
              <span className="ft-metric-card__trend">
                {waistData.length > 0 ? 'Recorded' : 'Tap to track waist'}
              </span>
            </div>
          </div>

          <div className="ft-metric-card" onClick={() => navigate('/progress')}>
            <div className="ft-metric-card__header">
              <span className="ft-metric-card__icon-box">
                <IconSparkles size={16} />
              </span>
              <span className="ft-metric-card__label">Bench Press PR</span>
            </div>
            <div className="ft-metric-card__body">
              <span className="ft-metric-card__value">
                {strengthData?.benchPress?.value || '--'} <span className="ft-metric-card__unit">kg</span>
              </span>
              <span className="ft-metric-card__trend ft-metric-card__trend--up">
                {strengthData?.benchPress?.value ? 'Milestone' : 'Track in progress'}
              </span>
            </div>
          </div>

          <div className="ft-metric-card" onClick={() => navigate('/progress')}>
            <div className="ft-metric-card__header">
              <span className="ft-metric-card__icon-box">
                <IconSparkles size={16} />
              </span>
              <span className="ft-metric-card__label">Squat Milestone</span>
            </div>
            <div className="ft-metric-card__body">
              <span className="ft-metric-card__value">
                {strengthData?.squat?.value || '--'} <span className="ft-metric-card__unit">kg</span>
              </span>
              <span className="ft-metric-card__trend ft-metric-card__trend--up">
                {strengthData?.squat?.value ? 'Milestone' : 'Track in progress'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Fast Food Logging Modal */}
      <FoodLogModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onAddFood={handleAddFood}
        recentFoods={recentFoods}
        commonFoods={commonFoods}
        customFoods={customFoods}
        onSaveCustomFood={handleSaveCustomFood}
      />

      {/* Quick Weight Modal */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Log Today's Weight"
        maxWidth="440px"
      >
        <form onSubmit={handleAddWeight} className="ft-form-stack">
          <p className="ft-form-stack__desc">
            Weigh yourself in the morning before food for consistent measurements.
          </p>
          <div className="ft-form-stack__field">
            <label>Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              placeholder="e.g. 72.4"
              value={newWeightVal}
              onChange={(e) => setNewWeightVal(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button type="submit" className="ft-btn ft-btn--primary ft-btn--full">
            <IconCheck size={16} /> Save Today's Weight
          </button>
        </form>
      </Modal>

      {/* Copy Yesterday Confirm Modal */}
      <Modal
        isOpen={isCopyConfirmOpen}
        onClose={() => setIsCopyConfirmOpen(false)}
        title="Copy Yesterday's Diet?"
        maxWidth="440px"
      >
        <div className="ft-form-stack">
          <p className="ft-form-stack__desc">
            This will copy all food entries logged yesterday into today's log without affecting past history.
          </p>
          <div className="ft-modal-actions">
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => setIsCopyConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ft-btn ft-btn--primary"
              onClick={handleCopyYesterday}
            >
              Yes, Copy Meals
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
