import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  calculateNutritionTargets,
  ACTIVITY_LEVELS,
  FITNESS_GOALS,
} from '../utils/calculator';
import {
  IconCheck,
  IconFlame,
  IconScale,
  IconDumbbell,
  IconSparkles,
} from '../components/Icons';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, logout, isDemo } = useAuth();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [targetWeight, setTargetWeight] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');
  const [carbTarget, setCarbTarget] = useState('');
  const [fatTarget, setFatTarget] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || user?.name || '');
      setAge(profile.age || 25);
      setGender(profile.gender || 'male');
      setHeight(profile.height || 175);
      setCurrentWeight(profile.current_weight || 72);
      setActivityLevel(profile.activity_level || 'moderate');
      setGoal(profile.goal || 'maintain');
      setTargetWeight(profile.target_weight || profile.current_weight || 72);
      setCalorieTarget(profile.calorie_target || 2100);
      setProteinTarget(profile.protein_target || 130);
      setCarbTarget(profile.carb_target || 240);
      setFatTarget(profile.fat_target || 65);
    }
  }, [profile, user]);

  const handleRecalculate = () => {
    const recommended = calculateNutritionTargets({
      weight: currentWeight,
      height,
      age,
      gender,
      activityLevel,
      goal,
    });

    setCalorieTarget(recommended.calories);
    setProteinTarget(recommended.protein);
    setCarbTarget(recommended.carbs);
    setFatTarget(recommended.fat);
    setSavedSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        full_name: fullName,
        age: Number(age),
        gender,
        height: Number(height),
        current_weight: Number(currentWeight),
        activity_level: activityLevel,
        goal,
        target_weight: Number(targetWeight),
        calorie_target: Number(calorieTarget),
        protein_target: Number(proteinTarget),
        carb_target: Number(carbTarget),
        fat_target: Number(fatTarget),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Error saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/login');
    }
  };

  const initials = (fullName || user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="ft-profile-page ft-animate-fade">
      {savedSuccess && (
        <div className="ft-toast ft-animate-slide-up">
          <IconCheck size={16} />
          <span>Profile and daily targets updated successfully!</span>
        </div>
      )}

      {/* Header */}
      <header className="ft-profile-header">
        <div>
          <span className="ft-profile-eyebrow">Account & Settings</span>
          <h1 className="ft-profile-title">Profile & Biometrics</h1>
          <p className="ft-profile-subtitle">
            Manage your personal data, biometric parameters, and custom caloric targets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="ft-btn ft-btn--secondary ft-profile-logout-btn"
        >
          Sign Out
        </button>
      </header>

      {/* User Hero Badge */}
      <div className="ft-profile-hero-card">
        <div className="ft-profile-avatar">
          <span>{initials}</span>
        </div>
        <div className="ft-profile-info">
          <div className="ft-profile-name-row">
            <h2>{fullName || 'FitTrack Athlete'}</h2>
            {isDemo && <span className="ft-demo-pill">Demo Account</span>}
          </div>
          <span className="ft-profile-email">{user?.email || 'user@fittrack.app'}</span>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="ft-profile-form">
        {/* Biometrics Card */}
        <div className="ft-profile-card">
          <div className="ft-profile-card__header">
            <div className="ft-profile-card__icon ft-profile-card__icon--emerald">
              <IconScale size={20} />
            </div>
            <div>
              <h3>Biometrics & Lifestyle</h3>
              <p>Your physical attributes are used for BMR and TDEE formulas</p>
            </div>
          </div>

          <div className="ft-profile-grid">
            <div className="ft-field">
              <label>Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="ft-field">
              <label>Biological Sex</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="ft-field">
              <label>Age (years)</label>
              <input
                type="number"
                min="12"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div className="ft-field">
              <label>Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>

            <div className="ft-field">
              <label>Current Scale Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
              />
            </div>

            <div className="ft-field">
              <label>Target Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="300"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
              />
            </div>

            <div className="ft-field">
              <label>Activity Level</label>
              <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                {Object.values(ACTIVITY_LEVELS).map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.label} ({lvl.multiplier}x)
                  </option>
                ))}
              </select>
            </div>

            <div className="ft-field">
              <label>Fitness Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                {Object.values(FITNESS_GOALS).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Nutrition Targets Card */}
        <div className="ft-profile-card">
          <div className="ft-profile-card__header">
            <div className="ft-profile-card__icon ft-profile-card__icon--indigo">
              <IconFlame size={20} />
            </div>
            <div className="ft-profile-card__header-flex">
              <div>
                <h3>Daily Calorie & Macro Ceiling</h3>
                <p>Targets calculated based on Mifflin-St Jeor or customized manually</p>
              </div>
              <button
                type="button"
                className="ft-btn ft-btn--secondary ft-recalc-btn"
                onClick={handleRecalculate}
              >
                <IconSparkles size={14} />
                <span>Auto-Calculate from Biometrics</span>
              </button>
            </div>
          </div>

          <div className="ft-profile-grid">
            <div className="ft-field">
              <label>Daily Calories</label>
              <div className="ft-input-unit">
                <input
                  type="number"
                  min="800"
                  max="10000"
                  step="50"
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(e.target.value)}
                />
                <span className="unit">kcal</span>
              </div>
            </div>

            <div className="ft-field ft-field--primary">
              <label>Daily Protein</label>
              <div className="ft-input-unit">
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={proteinTarget}
                  onChange={(e) => setProteinTarget(e.target.value)}
                />
                <span className="unit">grams</span>
              </div>
            </div>

            <div className="ft-field">
              <label>Daily Carbohydrates</label>
              <div className="ft-input-unit">
                <input
                  type="number"
                  min="0"
                  max="800"
                  value={carbTarget}
                  onChange={(e) => setCarbTarget(e.target.value)}
                />
                <span className="unit">grams</span>
              </div>
            </div>

            <div className="ft-field">
              <label>Daily Healthy Fats</label>
              <div className="ft-input-unit">
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={fatTarget}
                  onChange={(e) => setFatTarget(e.target.value)}
                />
                <span className="unit">grams</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="ft-profile-save-bar">
          <button
            type="submit"
            className="ft-btn ft-btn--primary ft-profile-save-btn"
            disabled={isSaving}
          >
            <IconCheck size={18} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
