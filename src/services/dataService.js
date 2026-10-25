import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { generateId } from '../utils/storage';

/**
 * Get the current user's local date string formatted as YYYY-MM-DD
 */
export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Secure SHA-256 hash for local auth fallback
 */
export async function hashPassword(plainText) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Basic fallback for environments without subtle crypto
    return btoa(plainText);
  }
}

// Local registry keys
const USERS_REGISTRY_KEY = 'fittrack_app_users';
const ACTIVE_SESSION_KEY = 'fittrack_active_session';
const REMEMBER_ME_KEY = 'fittrack_remember_session';

/**
 * Local database storage helper with strict user partitioning
 */
export const localStore = {
  getUsers() {
    try {
      const data = localStorage.getItem(USERS_REGISTRY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveUsers(users) {
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users registry:', e);
    }
  },

  getSession() {
    try {
      // Check session storage first, then localStorage if remembered
      const sessionData = sessionStorage.getItem(ACTIVE_SESSION_KEY);
      if (sessionData) return JSON.parse(sessionData);

      const localData = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (localData) return JSON.parse(localData);

      return null;
    } catch {
      return null;
    }
  },

  setSession(session, remember = true) {
    try {
      const serialized = JSON.stringify(session);
      sessionStorage.setItem(ACTIVE_SESSION_KEY, serialized);
      if (remember) {
        localStorage.setItem(ACTIVE_SESSION_KEY, serialized);
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch (e) {
      console.error('Failed to set session:', e);
    }
  },

  clearSession() {
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  },

  // User-specific partitioned storage
  getUserKey(userId, category) {
    return `fittrack_u_${userId}_${category}`;
  },

  getUserData(userId, category, defaultValue = []) {
    if (!userId) return defaultValue;
    try {
      const key = this.getUserKey(userId, category);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setUserData(userId, category, data) {
    if (!userId) return;
    try {
      const key = this.getUserKey(userId, category);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${category} for user ${userId}:`, e);
    }
  },
};

/**
 * Unified Multi-User Data Service
 * Supports Supabase Auth & PostgreSQL when configured,
 * and robust isolated local multi-user partitioning when standalone or demo.
 */
export const dataService = {
  // -------------------------------------------------------------
  // USER PROFILES
  // -------------------------------------------------------------
  async getProfile(userId) {
    if (!userId) return null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase profile fetch error:', error.message);
        }
        if (data) return data;
      } catch (err) {
        console.warn('Supabase profile error, falling back to local:', err);
      }
    }

    return localStore.getUserData(userId, 'profile', null);
  },

  async saveProfile(userId, profileData) {
    if (!userId) return null;

    const sanitized = {
      ...profileData,
      id: userId,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(sanitized, { onConflict: 'id' });

        if (error) {
          console.warn('Supabase profile upsert error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase profile save error:', err);
      }
    }

    // Always mirror to local store for fast offline responsiveness
    localStore.setUserData(userId, 'profile', sanitized);

    // Also update current weight in user weight history if provided
    if (profileData.current_weight) {
      await this.logWeight(userId, profileData.current_weight, getLocalDateString());
    }

    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: sanitized }));
    return sanitized;
  },

  // -------------------------------------------------------------
  // NUTRITION & FOOD ENTRIES
  // -------------------------------------------------------------
  async getFoodEntries(userId, date = getLocalDateString()) {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('food_entries')
          .select('*')
          .eq('user_id', userId)
          .eq('consumed_at', date)
          .order('created_at', { ascending: true });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase food fetch error:', err);
      }
    }

    const allFoods = localStore.getUserData(userId, 'food_entries', []);
    return allFoods.filter((entry) => (entry.consumed_at || entry.date) === date);
  },

  async getAllFoodEntries(userId) {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('food_entries')
          .select('*')
          .eq('user_id', userId)
          .order('consumed_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase all foods fetch error:', err);
      }
    }

    return localStore.getUserData(userId, 'food_entries', []);
  },

  async addFoodEntry(userId, entry) {
    if (!userId) return null;

    const newEntry = {
      id: entry.id || generateId(),
      user_id: userId,
      food_name: entry.food_name || entry.name || 'Food Item',
      meal_type: entry.meal_type || entry.mealType || 'snacks',
      quantity: Number(entry.quantity) || 1,
      serving_unit: entry.serving_unit || entry.serving || 'serving',
      calories: Math.max(0, Math.round(Number(entry.calories) || 0)),
      protein: Math.max(0, Math.round((Number(entry.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(entry.carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(entry.fat) || 0) * 10) / 10),
      consumed_at: entry.consumed_at || entry.date || getLocalDateString(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('food_entries').insert(newEntry);
      } catch (err) {
        console.warn('Supabase food insert error:', err);
      }
    }

    const allFoods = localStore.getUserData(userId, 'food_entries', []);
    allFoods.push(newEntry);
    localStore.setUserData(userId, 'food_entries', allFoods);

    window.dispatchEvent(new CustomEvent('nutritionUpdated', { detail: newEntry }));
    return newEntry;
  },

  async deleteFoodEntry(userId, entryId) {
    if (!userId || !entryId) return;

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('food_entries')
          .delete()
          .eq('id', entryId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase food delete error:', err);
      }
    }

    const allFoods = localStore.getUserData(userId, 'food_entries', []);
    const filtered = allFoods.filter((f) => f.id !== entryId);
    localStore.setUserData(userId, 'food_entries', filtered);

    window.dispatchEvent(new CustomEvent('nutritionUpdated', { detail: { deletedId: entryId } }));
  },

  async copyYesterdayFoods(userId, todayDate = getLocalDateString()) {
    if (!userId) return 0;

    const todayObj = new Date(todayDate + 'T00:00:00');
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayDate = getLocalDateString(yesterdayObj);

    const yesterdayFoods = await this.getFoodEntries(userId, yesterdayDate);
    if (!yesterdayFoods || yesterdayFoods.length === 0) return 0;

    let copiedCount = 0;
    for (const food of yesterdayFoods) {
      await this.addFoodEntry(userId, {
        ...food,
        id: generateId(),
        consumed_at: todayDate,
      });
      copiedCount++;
    }

    window.dispatchEvent(new CustomEvent('nutritionUpdated', { detail: { copiedCount } }));
    return copiedCount;
  },

  // -------------------------------------------------------------
  // CUSTOM FOODS
  // -------------------------------------------------------------
  async getCustomFoods(userId) {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('custom_foods')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase custom foods fetch error:', err);
      }
    }

    return localStore.getUserData(userId, 'custom_foods', []);
  },

  async addCustomFood(userId, food) {
    if (!userId) return null;

    const newFood = {
      id: food.id || generateId(),
      user_id: userId,
      name: food.name || 'Custom Food',
      serving_size: food.serving_size || food.serving || '100g',
      calories: Math.max(0, Math.round(Number(food.calories) || 0)),
      protein: Math.max(0, Math.round((Number(food.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(food.carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(food.fat) || 0) * 10) / 10),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('custom_foods').insert(newFood);
      } catch (err) {
        console.warn('Supabase custom food insert error:', err);
      }
    }

    const foods = localStore.getUserData(userId, 'custom_foods', []);
    foods.push(newFood);
    localStore.setUserData(userId, 'custom_foods', foods);

    window.dispatchEvent(new CustomEvent('customFoodsUpdated', { detail: newFood }));
    return newFood;
  },

  // -------------------------------------------------------------
  // WEIGHT & WAIST TRACKING
  // -------------------------------------------------------------
  async getWeightHistory(userId) {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: true });

        if (!error && data) {
          return data.map((d) => ({ date: d.recorded_at, weight: Number(d.weight), id: d.id }));
        }
      } catch (err) {
        console.warn('Supabase weight history fetch error:', err);
      }
    }

    return localStore.getUserData(userId, 'weight_entries', []);
  },

  async logWeight(userId, weightVal, date = getLocalDateString()) {
    if (!userId) return null;
    const weightNum = Number(weightVal);
    if (!weightNum || weightNum <= 0) return null;

    const newEntry = {
      id: generateId(),
      user_id: userId,
      weight: weightNum,
      recorded_at: date,
      date,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('weight_entries').insert({
          id: newEntry.id,
          user_id: userId,
          weight: weightNum,
          recorded_at: date,
        });
      } catch (err) {
        console.warn('Supabase weight insert error:', err);
      }
    }

    const history = localStore.getUserData(userId, 'weight_entries', []);
    // Replace if same date exists, else append and sort
    const existingIndex = history.findIndex((h) => h.date === date);
    if (existingIndex >= 0) {
      history[existingIndex] = { ...history[existingIndex], weight: weightNum };
    } else {
      history.push({ id: newEntry.id, date, weight: weightNum });
    }
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStore.setUserData(userId, 'weight_entries', history);

    // Also update current_weight on profile
    const profile = localStore.getUserData(userId, 'profile', null);
    if (profile) {
      profile.current_weight = weightNum;
      localStore.setUserData(userId, 'profile', profile);
    }

    window.dispatchEvent(new CustomEvent('weightUpdated', { detail: { weight: weightNum, date } }));
    return newEntry;
  },

  async getWaistHistory(userId) {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('waist_entries')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: true });

        if (!error && data) {
          return data.map((d) => ({ date: d.recorded_at, waist: Number(d.waist), id: d.id }));
        }
      } catch (err) {
        console.warn('Supabase waist history fetch error:', err);
      }
    }

    return localStore.getUserData(userId, 'waist_entries', []);
  },

  async logWaist(userId, waistVal, date = getLocalDateString()) {
    if (!userId) return null;
    const waistNum = Number(waistVal);
    if (!waistNum || waistNum <= 0) return null;

    const newEntry = {
      id: generateId(),
      user_id: userId,
      waist: waistNum,
      recorded_at: date,
      date,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('waist_entries').insert({
          id: newEntry.id,
          user_id: userId,
          waist: waistNum,
          recorded_at: date,
        });
      } catch (err) {
        console.warn('Supabase waist insert error:', err);
      }
    }

    const history = localStore.getUserData(userId, 'waist_entries', []);
    const existingIndex = history.findIndex((h) => h.date === date);
    if (existingIndex >= 0) {
      history[existingIndex] = { ...history[existingIndex], waist: waistNum };
    } else {
      history.push({ id: newEntry.id, date, waist: waistNum });
    }
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStore.setUserData(userId, 'waist_entries', history);

    window.dispatchEvent(new CustomEvent('waistUpdated', { detail: { waist: waistNum, date } }));
    return newEntry;
  },

  // -------------------------------------------------------------
  // WORKOUTS & SESSIONS
  // -------------------------------------------------------------
  async getWorkoutHistory(userId) {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase workout history fetch error:', err);
      }
    }

    return localStore.getUserData(userId, 'workout_history', []);
  },

  async saveWorkoutSession(userId, workout) {
    if (!userId) return null;

    const newWorkout = {
      id: workout.id || generateId(),
      user_id: userId,
      name: workout.name || 'Workout Session',
      date: workout.date || getLocalDateString(),
      duration: Number(workout.duration) || 45,
      completed: true,
      notes: workout.notes || '',
      exercises: workout.exercises || [],
      total_volume: Number(workout.total_volume) || Number(workout.volume) || 0,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('workouts').insert({
          id: newWorkout.id,
          user_id: userId,
          name: newWorkout.name,
          date: newWorkout.date,
          duration: newWorkout.duration,
          completed: true,
          notes: newWorkout.notes,
          total_volume: newWorkout.total_volume,
        });
      } catch (err) {
        console.warn('Supabase workout insert error:', err);
      }
    }

    const history = localStore.getUserData(userId, 'workout_history', []);
    history.unshift(newWorkout);
    localStore.setUserData(userId, 'workout_history', history);

    window.dispatchEvent(new CustomEvent('workoutUpdated', { detail: newWorkout }));
    return newWorkout;
  },

  async deleteWorkout(userId, workoutId) {
    if (!userId || !workoutId) return;

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('workouts')
          .delete()
          .eq('id', workoutId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase workout delete error:', err);
      }
    }

    const history = localStore.getUserData(userId, 'workout_history', []);
    const filtered = history.filter((w) => w.id !== workoutId);
    localStore.setUserData(userId, 'workout_history', filtered);

    window.dispatchEvent(new CustomEvent('workoutUpdated', { detail: { deletedId: workoutId } }));
  },

  // -------------------------------------------------------------
  // STRENGTH MILESTONES
  // -------------------------------------------------------------
  async getStrengthData(userId) {
    if (!userId) return {};
    return localStore.getUserData(userId, 'strength_data', {
      benchPress: { name: 'Bench Press', value: 0, unit: 'kg', type: 'weight' },
      squat: { name: 'Squat', value: 0, unit: 'kg', type: 'weight' },
      deadlift: { name: 'Deadlift', value: 0, unit: 'kg', type: 'weight' },
      pullUps: { name: 'Pull-ups', value: 0, unit: 'reps', type: 'reps' },
    });
  },

  async updateStrengthData(userId, strengthObj) {
    if (!userId) return;
    localStore.setUserData(userId, 'strength_data', strengthObj);
    window.dispatchEvent(new CustomEvent('strengthUpdated', { detail: strengthObj }));
  },

  // -------------------------------------------------------------
  // GOALS
  // -------------------------------------------------------------
  async getGoals(userId) {
    if (!userId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase goals fetch error:', err);
      }
    }

    return localStore.getUserData(userId, 'goals', []);
  },

  async addGoal(userId, goal) {
    if (!userId) return null;

    const newGoal = {
      id: goal.id || generateId(),
      user_id: userId,
      title: goal.title || 'New Goal',
      category: goal.category || 'fitness',
      target_value: Number(goal.target_value) || 0,
      current_value: Number(goal.current_value) || 0,
      unit: goal.unit || '',
      deadline: goal.deadline || '',
      status: goal.status || 'in_progress',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('goals').insert(newGoal);
      } catch (err) {
        console.warn('Supabase goal insert error:', err);
      }
    }

    const goals = localStore.getUserData(userId, 'goals', []);
    goals.push(newGoal);
    localStore.setUserData(userId, 'goals', goals);

    window.dispatchEvent(new CustomEvent('goalsListUpdated', { detail: newGoal }));
    return newGoal;
  },

  async deleteGoal(userId, goalId) {
    if (!userId || !goalId) return;

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('goals')
          .delete()
          .eq('id', goalId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase goal delete error:', err);
      }
    }

    const goals = localStore.getUserData(userId, 'goals', []);
    const filtered = goals.filter((g) => g.id !== goalId);
    localStore.setUserData(userId, 'goals', filtered);

    window.dispatchEvent(new CustomEvent('goalsListUpdated', { detail: { deletedId: goalId } }));
  },
};
