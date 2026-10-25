-- ==============================================================================
-- FITTRACK: Multi-User Fitness Tracking Database Schema (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER,
  gender TEXT DEFAULT 'male',
  height NUMERIC(5, 2), -- in cm
  current_weight NUMERIC(5, 2), -- in kg
  activity_level TEXT DEFAULT 'moderate',
  goal TEXT DEFAULT 'maintain',
  target_weight NUMERIC(5, 2),
  calorie_target INTEGER DEFAULT 2100,
  protein_target INTEGER DEFAULT 130,
  carb_target INTEGER DEFAULT 240,
  fat_target INTEGER DEFAULT 65,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Food Entries Table
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snacks'
  quantity NUMERIC(6, 2) DEFAULT 1,
  serving_unit TEXT DEFAULT 'serving',
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(6, 1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fat NUMERIC(6, 1) NOT NULL DEFAULT 0,
  consumed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries(user_id, consumed_at);
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own food entries"
  ON public.food_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Custom Foods Table
CREATE TABLE IF NOT EXISTS public.custom_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(6, 1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fat NUMERIC(6, 1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON public.custom_foods(user_id);
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom foods"
  ON public.custom_foods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Weight Entries Table
CREATE TABLE IF NOT EXISTS public.weight_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC(5, 2) NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON public.weight_entries(user_id, recorded_at);
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own weight entries"
  ON public.weight_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Waist Entries Table
CREATE TABLE IF NOT EXISTS public.waist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waist NUMERIC(5, 2) NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waist_entries_user_date ON public.waist_entries(user_id, recorded_at);
ALTER TABLE public.waist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own waist entries"
  ON public.waist_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Workouts Table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration INTEGER DEFAULT 0, -- in minutes
  completed BOOLEAN DEFAULT TRUE,
  notes TEXT DEFAULT '',
  total_volume NUMERIC(8, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts(user_id, date);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workouts"
  ON public.workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'fitness', -- 'weight', 'nutrition', 'workout', 'strength'
  target_value NUMERIC(8, 2),
  current_value NUMERIC(8, 2) DEFAULT 0,
  unit TEXT DEFAULT '',
  deadline DATE,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
