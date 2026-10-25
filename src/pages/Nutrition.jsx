import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService, getLocalDateString } from '../services/dataService';
import { formatDate } from '../utils/storage';
import { commonFoods } from '../data/foodDatabase';

import CalorieRing from '../components/CalorieRing';
import MacroCards from '../components/MacroCards';
import FoodLogModal from '../components/FoodLogModal';
import Modal from '../components/Modal';
import {
  IconPlus,
  IconCopy,
  IconSearch,
  IconFlame,
  IconTrash,
  IconCheck,
  IconChevronRight,
  IconTrendingUp,
} from '../components/Icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './Nutrition.css';

const TABS = [
  { key: 'log', label: 'Today\'s Meals' },
  { key: 'common', label: 'Food Database' },
  { key: 'recent', label: 'Quick Add' },
  { key: 'myfoods', label: 'My Foods' },
  { key: 'weekly', label: 'Weekly Analytics' },
];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

function inferMealType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('egg') || n.includes('oat') || n.includes('bread') || n.includes('milk')) return 'Breakfast';
  if (n.includes('rice') || n.includes('curry') || n.includes('dal') || n.includes('chickpea')) return 'Lunch';
  if (n.includes('roti') || n.includes('paneer') || n.includes('rajma') || n.includes('soya')) return 'Dinner';
  return 'Snacks';
}

export default function Nutrition() {
  const { user, profile } = useAuth();
  const today = getLocalDateString();

  const [activeTab, setActiveTab] = useState('log');
  const [nutritionLog, setNutritionLog] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);

  // Modals & Interactivity
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedMealForAdd, setSelectedMealForAdd] = useState('Breakfast');
  const [commonFilter, setCommonFilter] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Dynamic user goals from profile
  const goals = useMemo(() => {
    return {
      calories: Number(profile?.calorie_target) || 2100,
      protein: Number(profile?.protein_target) || 130,
      carbs: Number(profile?.carb_target) || 240,
      fat: Number(profile?.fat_target) || 65,
    };
  }, [profile]);

  // Load user's nutrition data
  const loadNutritionData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [allFoods, custom] = await Promise.all([
        dataService.getAllFoodEntries(user.id),
        dataService.getCustomFoods(user.id),
      ]);
      setNutritionLog(allFoods || []);
      setCustomFoods(custom || []);
    } catch (err) {
      console.error('Failed to load nutrition data:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNutritionData();

    const handleRefresh = () => loadNutritionData();
    window.addEventListener('nutritionUpdated', handleRefresh);
    window.addEventListener('customFoodsUpdated', handleRefresh);

    return () => {
      window.removeEventListener('nutritionUpdated', handleRefresh);
      window.removeEventListener('customFoodsUpdated', handleRefresh);
    };
  }, [loadNutritionData]);

  // Today's entries
  const todayEntries = useMemo(() => {
    return (nutritionLog || []).filter(
      (e) => (e.consumed_at || e.date) === today
    );
  }, [nutritionLog, today]);

  // Today's totals
  const totals = useMemo(() => {
    return todayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein) || 0),
        carbs: acc.carbs + (Number(e.carbs) || 0),
        fat: acc.fat + (Number(e.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayEntries]);

  // Group today's entries by meal
  const mealGroups = useMemo(() => {
    const groups = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
    };

    todayEntries.forEach((entry) => {
      const rawType = entry.meal_type || entry.mealType || inferMealType(entry.food_name || entry.name);
      const capType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      if (groups[capType]) {
        groups[capType].push(entry);
      } else {
        groups['Snacks'].push(entry);
      }
    });

    return groups;
  }, [todayEntries]);

  // Add food to log
  const addFood = useCallback(
    async (food, qty, mealType = selectedMealForAdd) => {
      if (!user?.id) return;
      const entry = {
        food_name: food.name,
        serving_unit: food.serving_size || food.serving || '100g',
        quantity: qty,
        meal_type: (mealType || inferMealType(food.name)).toLowerCase(),
        calories: Math.round(food.calories * qty),
        protein: Number((food.protein * qty).toFixed(1)),
        carbs: Number(((food.carbs || 0) * qty).toFixed(1)),
        fat: Number(((food.fat || 0) * qty).toFixed(1)),
        consumed_at: today,
      };

      await dataService.addFoodEntry(user.id, entry);
      showToast(`Logged ${qty}× ${food.name} (${entry.calories} kcal)`);
    },
    [user?.id, today, selectedMealForAdd]
  );

  // Delete food entry
  const deleteEntry = useCallback(
    async (entryId) => {
      if (!user?.id) return;
      await dataService.deleteFoodEntry(user.id, entryId);
      showToast('Entry removed');
    },
    [user?.id]
  );

  // Save custom food
  const saveCustomFood = async (food) => {
    if (!user?.id) return;
    await dataService.addCustomFood(user.id, food);
    showToast(`Saved custom food: ${food.name}`);
  };

  // Recent foods for quick add
  const recentFoods = useMemo(() => {
    const seen = new Set();
    const recent = [];
    const sorted = [...nutritionLog].sort(
      (a, b) => new Date(b.consumed_at || b.date) - new Date(a.consumed_at || a.date)
    );
    for (const entry of sorted) {
      const name = entry.food_name || entry.name;
      if (!seen.has(name)) {
        seen.add(name);
        recent.push({
          id: entry.id,
          name,
          serving: entry.serving_unit || entry.serving || '100g',
          calories: entry.calories / (entry.quantity || 1),
          protein: entry.protein / (entry.quantity || 1),
          carbs: (entry.carbs || 0) / (entry.quantity || 1),
          fat: (entry.fat || 0) / (entry.quantity || 1),
        });
        if (recent.length >= 10) break;
      }
    }
    return recent;
  }, [nutritionLog]);

  // Copy yesterday
  const copyYesterday = async () => {
    if (!user?.id) return;
    const count = await dataService.copyYesterdayFoods(user.id, today);
    setIsCopyModalOpen(false);
    if (count > 0) {
      showToast(`✓ Yesterday's ${count} meals added!`);
    } else {
      showToast('No entries from yesterday to copy.');
    }
  };

  // Filtered Common Foods
  const filteredCommon = useMemo(() => {
    if (!commonFilter.trim()) return commonFoods;
    const q = commonFilter.toLowerCase();
    return commonFoods.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.serving && f.serving.toLowerCase().includes(q))
    );
  }, [commonFilter]);

  // Weekly analytics data
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayEntries = nutritionLog.filter(
        (e) => (e.consumed_at || e.date) === dateStr
      );
      const dayTotals = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + (Number(e.calories) || 0),
          protein: acc.protein + (Number(e.protein) || 0),
          carbs: acc.carbs + (Number(e.carbs) || 0),
          fat: acc.fat + (Number(e.fat) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      days.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        logged: dayEntries.length > 0,
        ...dayTotals,
      });
    }
    return days;
  }, [nutritionLog]);

  const weeklyStats = useMemo(() => {
    const loggedDays = weeklyData.filter((d) => d.logged);
    const count = loggedDays.length;
    const avgCal = count > 0 ? loggedDays.reduce((s, d) => s + d.calories, 0) / count : 0;
    const avgPro = count > 0 ? loggedDays.reduce((s, d) => s + d.protein, 0) / count : 0;
    const avgCarb = count > 0 ? loggedDays.reduce((s, d) => s + d.carbs, 0) / count : 0;
    const avgFat = count > 0 ? loggedDays.reduce((s, d) => s + d.fat, 0) / count : 0;
    const calMet = loggedDays.filter(
      (d) => d.calories >= goals.calories * 0.95 && d.calories <= goals.calories * 1.05
    ).length;
    const proMet = loggedDays.filter((d) => d.protein >= goals.protein).length;
    const highest = count > 0 ? loggedDays.reduce((max, d) => (d.calories > max.calories ? d : max), loggedDays[0]) : null;
    const lowest = count > 0 ? loggedDays.reduce((min, d) => (d.calories < min.calories ? d : min), loggedDays[0]) : null;
    return { count, avgCal, avgPro, avgCarb, avgFat, calMet, proMet, highest, lowest };
  }, [weeklyData, goals]);

  return (
    <div className="ft-nutrition ft-animate-fade">
      {/* Toast */}
      {toastMessage && (
        <div className="ft-toast ft-animate-slide-up">
          <IconCheck size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="ft-nutrition__header">
        <div>
          <span className="ft-nutrition__eyebrow">Fuel & Macronutrients</span>
          <h1 className="ft-nutrition__title">Today's Nutrition</h1>
          <p className="ft-nutrition__subtitle">
            Daily target: <strong>{goals.calories.toLocaleString()} kcal</strong> · {goals.protein}g Protein
          </p>
        </div>

        <div className="ft-nutrition__header-actions">
          <button
            type="button"
            className="ft-btn ft-btn--secondary"
            onClick={() => setIsCopyModalOpen(true)}
          >
            <IconCopy size={16} />
            <span>Copy Yesterday</span>
          </button>

          <button
            type="button"
            className="ft-btn ft-btn--primary"
            onClick={() => {
              setSelectedMealForAdd('Breakfast');
              setIsLogModalOpen(true);
            }}
          >
            <IconPlus size={16} />
            <span>Log Food</span>
          </button>
        </div>
      </header>

      {/* Prominent Hero: Calorie Ring & Macro Cards */}
      <section className="ft-nutrition__hero-card">
        <div className="ft-nutrition__hero-ring">
          <CalorieRing
            consumed={totals.calories}
            target={goals.calories}
            size={220}
          />
        </div>
        <div className="ft-nutrition__hero-macros">
          <div className="ft-nutrition__hero-macros-header">
            <span className="ft-nutrition__eyebrow">Macro Distribution</span>
            <h3>Fuel Targets</h3>
          </div>
          <MacroCards totals={totals} goals={goals} />
        </div>
      </section>

      {/* Navigation Sub-Tabs */}
      <div className="ft-nutrition__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`ft-nutrition__tab ${activeTab === tab.key ? 'ft-nutrition__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Today's Meals Grouped */}
      {activeTab === 'log' && (
        <div className="ft-nutrition__meal-groups ft-animate-fade">
          {MEAL_TYPES.map((mealName) => {
            const items = mealGroups[mealName] || [];
            const mealCalories = items.reduce((s, it) => s + (Number(it.calories) || 0), 0);
            const mealProtein = items.reduce((s, it) => s + (Number(it.protein) || 0), 0);

            return (
              <div key={mealName} className="ft-meal-card">
                <div className="ft-meal-card__header">
                  <div className="ft-meal-card__title-group">
                    <h3 className="ft-meal-card__name">{mealName}</h3>
                    <span className="ft-meal-card__count">{items.length} items</span>
                  </div>

                  <div className="ft-meal-card__header-right">
                    <div className="ft-meal-card__macros">
                      <span className="ft-meal-card__cal">{Math.round(mealCalories)} kcal</span>
                      <span className="ft-meal-card__pro">· {Math.round(mealProtein)}g protein</span>
                    </div>
                    <button
                      type="button"
                      className="ft-meal-card__add-btn"
                      onClick={() => {
                        setSelectedMealForAdd(mealName);
                        setIsLogModalOpen(true);
                      }}
                      title={`Add food to ${mealName}`}
                    >
                      <IconPlus size={16} /> Add
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div
                    className="ft-meal-card__empty"
                    onClick={() => {
                      setSelectedMealForAdd(mealName);
                      setIsLogModalOpen(true);
                    }}
                  >
                    <span>+ Log {mealName.toLowerCase()}</span>
                  </div>
                ) : (
                  <div className="ft-meal-card__list">
                    {items.map((item) => (
                      <div key={item.id} className="ft-meal-item">
                        <div className="ft-meal-item__info">
                          <span className="ft-meal-item__name">{item.food_name || item.name}</span>
                          <span className="ft-meal-item__meta">
                            {item.quantity} × {item.serving_unit || item.serving || 'serving'}
                          </span>
                        </div>

                        <div className="ft-meal-item__macros">
                          <span className="ft-meal-item__cal">{Math.round(item.calories)} kcal</span>
                          <span className="ft-meal-item__pro">{item.protein}g P</span>
                          <span className="ft-meal-item__sub">
                            {item.carbs}g C · {item.fat}g F
                          </span>
                        </div>

                        <button
                          type="button"
                          className="ft-meal-item__del"
                          onClick={() => deleteEntry(item.id)}
                          title="Delete entry"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Food Database */}
      {activeTab === 'common' && (
        <div className="ft-nutrition__catalog ft-animate-fade">
          <div className="ft-nutrition__search-bar">
            <IconSearch size={18} />
            <input
              type="text"
              placeholder="Search 25 verified common fitness foods..."
              value={commonFilter}
              onChange={(e) => setCommonFilter(e.target.value)}
            />
          </div>

          <div className="ft-foods-grid">
            {filteredCommon.map((food) => (
              <div key={food.id} className="ft-food-catalog-card">
                <div className="ft-food-catalog-card__body">
                  <h4 className="ft-food-catalog-card__name">{food.name}</h4>
                  <span className="ft-food-catalog-card__serving">{food.serving}</span>

                  <div className="ft-food-catalog-card__macros">
                    <span className="ft-pill ft-pill--cal">{food.calories} kcal</span>
                    <span className="ft-pill ft-pill--pro">{food.protein}g Protein</span>
                    <span className="ft-pill ft-pill--sub">C: {food.carbs}g · F: {food.fat}g</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="ft-food-catalog-card__btn"
                  onClick={() => addFood(food, 1)}
                >
                  <IconPlus size={14} /> Log 1 Serving
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Quick Add / Recents */}
      {activeTab === 'recent' && (
        <div className="ft-nutrition__recents ft-animate-fade">
          <div className="ft-nutrition__recents-header">
            <div>
              <h3>Recently Logged Foods</h3>
              <p>One-tap logging for your everyday staples.</p>
            </div>
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => setIsCopyModalOpen(true)}
            >
              <IconCopy size={16} /> Copy Yesterday
            </button>
          </div>

          {recentFoods.length === 0 ? (
            <div className="ft-empty-state">
              <IconFlame size={32} />
              <h4>No recent foods recorded</h4>
              <p>Log a few meals and they will automatically appear here for instant 1-tap logging.</p>
              <button
                type="button"
                className="ft-btn ft-btn--primary"
                onClick={() => setIsLogModalOpen(true)}
              >
                + Log Food
              </button>
            </div>
          ) : (
            <div className="ft-recent-list">
              {recentFoods.map((food) => (
                <div key={food.id || food.name} className="ft-recent-card">
                  <div className="ft-recent-card__info">
                    <h4 className="ft-recent-card__title">{food.name}</h4>
                    <span className="ft-recent-card__sub">{food.serving}</span>
                    <div className="ft-recent-card__macros">
                      <strong>{Math.round(food.calories)} kcal</strong>
                      <span>·</span>
                      <span>{food.protein}g protein</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ft-btn ft-btn--primary ft-recent-card__btn"
                    onClick={() => addFood(food, 1)}
                  >
                    <IconPlus size={16} /> Add Today
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: My Custom Foods */}
      {activeTab === 'myfoods' && (
        <div className="ft-nutrition__custom ft-animate-fade">
          <div className="ft-nutrition__recents-header">
            <div>
              <h3>Custom Nutrition Foods</h3>
              <p>Add personalized foods, packaged ingredients, and custom recipes.</p>
            </div>
            <button
              type="button"
              className="ft-btn ft-btn--primary"
              onClick={() => setIsLogModalOpen(true)}
            >
              + Create Custom Food
            </button>
          </div>

          {customFoods.length === 0 ? (
            <div className="ft-empty-state">
              <IconPlus size={32} />
              <h4>No custom foods created yet</h4>
              <p>Add your personalized protein bars, snacks, or brand-specific foods.</p>
              <button
                type="button"
                className="ft-btn ft-btn--primary"
                onClick={() => setIsLogModalOpen(true)}
              >
                + Create Custom Food
              </button>
            </div>
          ) : (
            <div className="ft-foods-grid">
              {customFoods.map((food) => (
                <div key={food.id} className="ft-food-catalog-card">
                  <div className="ft-food-catalog-card__body">
                    <h4 className="ft-food-catalog-card__name">{food.name}</h4>
                    <span className="ft-food-catalog-card__serving">{food.serving_size || food.serving}</span>
                    <div className="ft-food-catalog-card__macros">
                      <span className="ft-pill ft-pill--cal">{food.calories} kcal</span>
                      <span className="ft-pill ft-pill--pro">{food.protein}g Protein</span>
                      <span className="ft-pill ft-pill--sub">C: {food.carbs}g · F: {food.fat}g</span>
                    </div>
                  </div>

                  <div className="ft-food-catalog-card__actions">
                    <button
                      type="button"
                      className="ft-btn ft-btn--primary ft-food-catalog-card__btn"
                      onClick={() => addFood(food, 1)}
                    >
                      <IconPlus size={14} /> Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Weekly Analytics Report */}
      {activeTab === 'weekly' && (
        <div className="ft-nutrition__analytics ft-animate-fade">
          <div className="ft-analytics-stats-grid">
            <div className="ft-stat-box">
              <span className="ft-stat-box__label">Days Logged</span>
              <strong className="ft-stat-box__val">{weeklyStats.count} / 7</strong>
              <span className="ft-stat-box__sub">Past 7 days</span>
            </div>

            <div className="ft-stat-box">
              <span className="ft-stat-box__label">Average Calories</span>
              <strong className="ft-stat-box__val">{Math.round(weeklyStats.avgCal)}</strong>
              <span className="ft-stat-box__sub">Target: {goals.calories} kcal</span>
            </div>

            <div className="ft-stat-box">
              <span className="ft-stat-box__label">Average Protein</span>
              <strong className="ft-stat-box__val">{Math.round(weeklyStats.avgPro)}g</strong>
              <span className="ft-stat-box__sub">Target: {goals.protein}g</span>
            </div>

            <div className="ft-stat-box">
              <span className="ft-stat-box__label">Calorie Target Met</span>
              <strong className="ft-stat-box__val">{weeklyStats.calMet} days</strong>
              <span className="ft-stat-box__sub">Within target range</span>
            </div>

            <div className="ft-stat-box">
              <span className="ft-stat-box__label">Protein Target Met</span>
              <strong className="ft-stat-box__val">{weeklyStats.proMet} days</strong>
              <span className="ft-stat-box__sub">Reached {goals.protein}g+</span>
            </div>

            <div className="ft-stat-box">
              <span className="ft-stat-box__label">Highest Calorie Day</span>
              <strong className="ft-stat-box__val">
                {weeklyStats.highest ? `${weeklyStats.highest.day} (${Math.round(weeklyStats.highest.calories)})` : '—'}
              </strong>
              <span className="ft-stat-box__sub">Peak intake</span>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="ft-chart-card">
            <div className="ft-chart-card__header">
              <div>
                <span className="ft-chart-card__eyebrow">7-Day Trajectory</span>
                <h3 className="ft-chart-card__title">Calories & Protein Intake</h3>
              </div>
            </div>

            <div className="ft-chart-card__body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="ft-custom-tooltip">
                          <span className="ft-custom-tooltip__title">{d.day} ({formatDate(d.date)})</span>
                          <div className="ft-custom-tooltip__row">
                            <span>Calories:</span>
                            <strong>{Math.round(d.calories)} kcal</strong>
                          </div>
                          <div className="ft-custom-tooltip__row">
                            <span>Protein:</span>
                            <strong style={{ color: '#10b981' }}>{Math.round(d.protein)}g</strong>
                          </div>
                          <div className="ft-custom-tooltip__row">
                            <span>Carbs:</span>
                            <strong style={{ color: '#f59e0b' }}>{Math.round(d.carbs)}g</strong>
                          </div>
                          <div className="ft-custom-tooltip__row">
                            <span>Fat:</span>
                            <strong style={{ color: '#6366f1' }}>{Math.round(d.fat)}g</strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="calories" name="Calories" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="protein" name="Protein" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Fast Food Logging Modal */}
      <FoodLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onAddFood={(food, qty) => addFood(food, qty, selectedMealForAdd)}
        recentFoods={recentFoods}
        commonFoods={commonFoods}
        customFoods={customFoods}
        onSaveCustomFood={saveCustomFood}
      />

      {/* Copy Yesterday Modal */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Yesterday's Diet?"
        maxWidth="440px"
      >
        <div className="ft-form-stack">
          <p className="ft-form-stack__desc">
            Copy all meals logged yesterday directly into today's log. Your past logs will remain preserved.
          </p>
          <div className="ft-modal-actions">
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => setIsCopyModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ft-btn ft-btn--primary"
              onClick={copyYesterday}
            >
              Yes, Copy Meals
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
