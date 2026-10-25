import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { dataService, localStore, hashPassword, getLocalDateString } from '../services/dataService';
import { generateId } from '../utils/storage';
import { calculateNutritionTargets } from '../utils/calculator';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth session on mount
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const u = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
              isDemo: false,
            };
            setUser(u);
            const prof = await dataService.getProfile(u.id);
            if (prof && mounted) setProfile(prof);
            setLoading(false);
            return;
          }
        }

        // Check local session
        const localSession = localStore.getSession();
        if (localSession?.user && mounted) {
          setUser(localSession.user);
          const prof = await dataService.getProfile(localSession.user.id);
          if (prof && mounted) {
            setProfile(prof);
          } else if (localSession.profile && mounted) {
            setProfile(localSession.profile);
          }
        }
      } catch (err) {
        console.warn('Session init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    // Listen for profile update events
    const handleProfileUpdated = (e) => {
      if (e?.detail) setProfile((prev) => ({ ...prev, ...e.detail }));
    };
    window.addEventListener('profileUpdated', handleProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

  // Check if current user has completed onboarding
  const isOnboarded = Boolean(
    profile?.full_name &&
    profile?.current_weight &&
    profile?.calorie_target &&
    profile?.goal
  );

  // -------------------------------------------------------------
  // SIGN UP
  // -------------------------------------------------------------
  const signup = async ({ name, email, password }) => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Registration failed. Please try again.');

      const newUser = {
        id: data.user.id,
        email: cleanEmail,
        name: cleanName,
        isDemo: false,
      };

      const initialProfile = {
        id: newUser.id,
        full_name: cleanName,
        email: cleanEmail,
        calorie_target: 2100,
        protein_target: 130,
        carb_target: 240,
        fat_target: 65,
      };

      await dataService.saveProfile(newUser.id, initialProfile);
      setUser(newUser);
      setProfile(initialProfile);
      localStore.setSession({ user: newUser, profile: initialProfile }, true);
      return { user: newUser, profile: initialProfile };
    }

    // Local Multi-User Fallback
    const users = localStore.getUsers();
    const existing = users.find((u) => u.email === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const passwordHash = await hashPassword(password);
    const userId = 'usr_' + generateId();
    const newUser = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      passwordHash,
      isDemo: false,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    localStore.saveUsers(users);

    const initialProfile = {
      id: userId,
      full_name: cleanName,
      email: cleanEmail,
      calorie_target: 2100,
      protein_target: 130,
      carb_target: 240,
      fat_target: 65,
      created_at: new Date().toISOString(),
    };

    await dataService.saveProfile(userId, initialProfile);
    setUser(newUser);
    setProfile(initialProfile);
    localStore.setSession({ user: newUser, profile: initialProfile }, true);

    return { user: newUser, profile: initialProfile };
  };

  // -------------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------------
  const login = async ({ email, password, remember = true }) => {
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Invalid email or password.');

      const loggedInUser = {
        id: data.user.id,
        email: cleanEmail,
        name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
        isDemo: false,
      };

      let prof = await dataService.getProfile(loggedInUser.id);
      if (!prof) {
        prof = {
          id: loggedInUser.id,
          full_name: loggedInUser.name,
          email: cleanEmail,
          calorie_target: 2100,
          protein_target: 130,
          carb_target: 240,
          fat_target: 65,
        };
        await dataService.saveProfile(loggedInUser.id, prof);
      }

      setUser(loggedInUser);
      setProfile(prof);
      localStore.setSession({ user: loggedInUser, profile: prof }, remember);
      return { user: loggedInUser, profile: prof };
    }

    // Local Multi-User Fallback
    const users = localStore.getUsers();
    const foundUser = users.find((u) => u.email === cleanEmail);
    if (!foundUser) {
      throw new Error('No account found with this email. Please check your credentials or sign up.');
    }

    const inputHash = await hashPassword(password);
    if (foundUser.passwordHash !== inputHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    const safeUser = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      isDemo: Boolean(foundUser.isDemo),
    };

    let prof = await dataService.getProfile(safeUser.id);
    if (!prof) {
      prof = {
        id: safeUser.id,
        full_name: safeUser.name,
        email: safeUser.email,
        calorie_target: 2100,
        protein_target: 130,
        carb_target: 240,
        fat_target: 65,
      };
      await dataService.saveProfile(safeUser.id, prof);
    }

    setUser(safeUser);
    setProfile(prof);
    localStore.setSession({ user: safeUser, profile: prof }, remember);

    return { user: safeUser, profile: prof };
  };

  // -------------------------------------------------------------
  // DEMO ACCOUNT LOGIN
  // -------------------------------------------------------------
  const loginAsDemo = async () => {
    const demoId = 'usr_demo_athlete';
    const demoUser = {
      id: demoId,
      email: 'demo@fittrack.app',
      name: 'Alex Morgan',
      isDemo: true,
    };

    let demoProfile = await dataService.getProfile(demoId);
    if (!demoProfile) {
      demoProfile = {
        id: demoId,
        full_name: 'Alex Morgan',
        email: 'demo@fittrack.app',
        age: 26,
        gender: 'female',
        height: 168,
        current_weight: 64,
        activity_level: 'moderate',
        goal: 'build_muscle',
        target_weight: 62,
        calorie_target: 2050,
        protein_target: 135,
        carb_target: 230,
        fat_target: 65,
        workout_frequency: 5,
        isDemo: true,
      };
      await dataService.saveProfile(demoId, demoProfile);

      // Seed sample weight
      const today = getLocalDateString();
      await dataService.logWeight(demoId, 65.5, '2026-09-15');
      await dataService.logWeight(demoId, 64.8, '2026-10-01');
      await dataService.logWeight(demoId, 64.0, today);

      // Seed sample today's food
      await dataService.addFoodEntry(demoId, {
        food_name: 'Oats with Greek Yogurt & Berries',
        meal_type: 'breakfast',
        quantity: 1,
        calories: 420,
        protein: 32,
        carbs: 58,
        fat: 8,
        consumed_at: today,
      });
      await dataService.addFoodEntry(demoId, {
        food_name: 'Grilled Chicken Breast & Quinoa',
        meal_type: 'lunch',
        quantity: 1,
        calories: 550,
        protein: 48,
        carbs: 62,
        fat: 11,
        consumed_at: today,
      });
    }

    setUser(demoUser);
    setProfile(demoProfile);
    localStore.setSession({ user: demoUser, profile: demoProfile }, true);
    return { user: demoUser, profile: demoProfile };
  };

  // -------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signout error:', err);
      }
    }

    localStore.clearSession();
    setUser(null);
    setProfile(null);
  };

  // -------------------------------------------------------------
  // UPDATE PROFILE
  // -------------------------------------------------------------
  const updateProfile = async (updatedFields) => {
    if (!user) return null;
    const merged = { ...profile, ...updatedFields };
    const saved = await dataService.saveProfile(user.id, merged);
    setProfile(saved);
    localStore.setSession({ user, profile: saved }, true);
    return saved;
  };

  // -------------------------------------------------------------
  // SAVE ONBOARDING DATA & CALCULATE TARGETS
  // -------------------------------------------------------------
  const saveOnboarding = async (onboardingData) => {
    if (!user) return null;

    const {
      name,
      age,
      gender,
      height,
      currentWeight,
      activityLevel,
      goal,
      targetWeight,
      weeklyRate,
      customCalories,
      customProtein,
      customCarbs,
      customFat,
    } = onboardingData;

    // Calculate scientifically recommended targets
    const targets = calculateNutritionTargets({
      weight: currentWeight,
      height,
      age,
      gender,
      activityLevel,
      goal,
      weeklyRate,
    });

    const finalProfile = {
      ...profile,
      id: user.id,
      full_name: name || user.name,
      age: Number(age) || 25,
      gender: gender || 'male',
      height: Number(height) || 175,
      current_weight: Number(currentWeight) || 70,
      activity_level: activityLevel || 'moderate',
      goal: goal || 'maintain',
      target_weight: Number(targetWeight) || Number(currentWeight) || 70,
      calorie_target: Number(customCalories) || targets.calories,
      protein_target: Number(customProtein) || targets.protein,
      carb_target: Number(customCarbs) || targets.carbs,
      fat_target: Number(customFat) || targets.fat,
      bmr: targets.bmr,
      tdee: targets.tdee,
      updated_at: new Date().toISOString(),
    };

    const saved = await dataService.saveProfile(user.id, finalProfile);
    setProfile(saved);

    // Initial weight log
    await dataService.logWeight(user.id, Number(currentWeight), getLocalDateString());

    localStore.setSession({ user: { ...user, name: finalProfile.full_name }, profile: saved }, true);
    return saved;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: Boolean(user),
        isOnboarded,
        isDemo: Boolean(user?.isDemo),
        login,
        signup,
        loginAsDemo,
        logout,
        updateProfile,
        saveOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
