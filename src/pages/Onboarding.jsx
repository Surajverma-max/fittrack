import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  calculateNutritionTargets,
  ACTIVITY_LEVELS,
  FITNESS_GOALS,
} from '../utils/calculator';
import {
  IconFlame,
  IconDumbbell,
  IconScale,
  IconCheck,
  IconChevronRight,
  IconTrendingUp,
  IconSparkles,
} from '../components/Icons';
import './Onboarding.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, saveOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState(profile?.full_name || user?.name || '');
  const [age, setAge] = useState(profile?.age || 25);
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [height, setHeight] = useState(profile?.height || 175);
  const [currentWeight, setCurrentWeight] = useState(profile?.current_weight || 75);

  const [activityLevel, setActivityLevel] = useState(profile?.activity_level || 'moderate');
  const [goal, setGoal] = useState(profile?.goal || 'maintain');
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight || currentWeight);
  const [weeklyRate, setWeeklyRate] = useState(0);

  // Custom macro overrides (optional)
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  // Live Scientific Calculation
  const recommended = useMemo(() => {
    return calculateNutritionTargets({
      weight: currentWeight,
      height,
      age,
      gender,
      activityLevel,
      goal,
      weeklyRate: goal === 'lose' ? -0.5 : goal === 'gain' ? 0.35 : 0,
    });
  }, [currentWeight, height, age, gender, activityLevel, goal]);

  const activeCalories = customCalories !== '' ? Number(customCalories) : recommended.calories;
  const activeProtein = customProtein !== '' ? Number(customProtein) : recommended.protein;
  const activeCarbs = customCarbs !== '' ? Number(customCarbs) : recommended.carbs;
  const activeFat = customFat !== '' ? Number(customFat) : recommended.fat;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await saveOnboarding({
        name,
        age: Number(age),
        gender,
        height: Number(height),
        currentWeight: Number(currentWeight),
        activityLevel,
        goal,
        targetWeight: Number(targetWeight) || Number(currentWeight),
        weeklyRate,
        customCalories: activeCalories,
        customProtein: activeProtein,
        customCarbs: activeCarbs,
        customFat: activeFat,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      alert('Unable to save onboarding profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ft-onboarding-page">
      <div className="ft-onboarding-container ft-animate-slide-up">
        {/* Progress Bar Header */}
        <header className="ft-onboarding-header">
          <div className="ft-onboarding-steps">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`ft-step-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
              >
                {s < step ? <IconCheck size={12} /> : s}
              </div>
            ))}
          </div>
          <span className="ft-onboarding-step-label">Step {step} of 4</span>
        </header>

        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="ft-onboarding-step">
            <span className="ft-onboarding-eyebrow">Personal Baselines</span>
            <h2 className="ft-onboarding-title">Tell us about yourself</h2>
            <p className="ft-onboarding-desc">
              We use standard biometric formulas (Mifflin-St Jeor) to compute your Basal Metabolic Rate accurately.
            </p>

            <div className="ft-onboarding-form">
              <div className="ft-form-group">
                <label>Preferred Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="ft-form-row">
                <div className="ft-form-group">
                  <label>Age (years)</label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div className="ft-form-group">
                  <label>Biological Sex</label>
                  <div className="ft-radio-pills">
                    <button
                      type="button"
                      className={`ft-pill-btn ${gender === 'male' ? 'active' : ''}`}
                      onClick={() => setGender('male')}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={`ft-pill-btn ${gender === 'female' ? 'active' : ''}`}
                      onClick={() => setGender('female')}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>

              <div className="ft-form-row">
                <div className="ft-form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>

                <div className="ft-form-group">
                  <label>Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={currentWeight}
                    onChange={(e) => {
                      setCurrentWeight(e.target.value);
                      if (!targetWeight) setTargetWeight(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="ft-onboarding-actions">
              <div></div>
              <button
                type="button"
                className="ft-btn ft-btn--primary ft-onboarding-next-btn"
                onClick={handleNext}
                disabled={!name || !currentWeight || !height || !age}
              >
                <span>Continue to Activity</span>
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Activity Level */}
        {step === 2 && (
          <div className="ft-onboarding-step">
            <span className="ft-onboarding-eyebrow">Daily Movement</span>
            <h2 className="ft-onboarding-title">How active are you?</h2>
            <p className="ft-onboarding-desc">
              Your activity level determines your Total Daily Energy Expenditure (TDEE).
            </p>

            <div className="ft-options-stack">
              {Object.values(ACTIVITY_LEVELS).map((lvl) => (
                <div
                  key={lvl.id}
                  className={`ft-option-card ${activityLevel === lvl.id ? 'active' : ''}`}
                  onClick={() => setActivityLevel(lvl.id)}
                >
                  <div className="ft-option-card__radio">
                    <div className="dot"></div>
                  </div>
                  <div className="ft-option-card__content">
                    <div className="ft-option-card__title">
                      <strong>{lvl.label}</strong>
                      <span className="badge">{lvl.multiplier}x BMR</span>
                    </div>
                    <p className="ft-option-card__desc">{lvl.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="ft-onboarding-actions">
              <button type="button" className="ft-btn ft-btn--secondary" onClick={handleBack}>
                Back
              </button>
              <button
                type="button"
                className="ft-btn ft-btn--primary ft-onboarding-next-btn"
                onClick={handleNext}
              >
                <span>Continue to Goal</span>
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Fitness Goal */}
        {step === 3 && (
          <div className="ft-onboarding-step">
            <span className="ft-onboarding-eyebrow">Transformation Objective</span>
            <h2 className="ft-onboarding-title">What is your primary goal?</h2>
            <p className="ft-onboarding-desc">
              FitTrack will adjust your caloric target and protein split to match your goal.
            </p>

            <div className="ft-options-stack">
              {Object.values(FITNESS_GOALS).map((g) => (
                <div
                  key={g.id}
                  className={`ft-option-card ${goal === g.id ? 'active' : ''}`}
                  onClick={() => setGoal(g.id)}
                >
                  <div className="ft-option-card__radio">
                    <div className="dot"></div>
                  </div>
                  <div className="ft-option-card__content">
                    <div className="ft-option-card__title">
                      <strong>{g.label}</strong>
                      <span className="badge">
                        {g.deficit > 0
                          ? `-${g.deficit} kcal deficit`
                          : g.deficit < 0
                          ? `+${Math.abs(g.deficit)} kcal surplus`
                          : 'Maintenance'}
                      </span>
                    </div>
                    <p className="ft-option-card__desc">{g.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="ft-onboarding-actions">
              <button type="button" className="ft-btn ft-btn--secondary" onClick={handleBack}>
                Back
              </button>
              <button
                type="button"
                className="ft-btn ft-btn--primary ft-onboarding-next-btn"
                onClick={handleNext}
              >
                <span>Review Targets</span>
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Target & Calorie Calculation */}
        {step === 4 && (
          <div className="ft-onboarding-step">
            <span className="ft-onboarding-eyebrow">Personalized Blueprint</span>
            <h2 className="ft-onboarding-title">Your Recommended Fuel Plan</h2>
            <p className="ft-onboarding-desc">
              Based on Mifflin-St Jeor: your BMR is <strong>{recommended.bmr} kcal</strong> and your maintenance TDEE is <strong>{recommended.tdee} kcal</strong>.
            </p>

            {/* Target Weight Card */}
            <div className="ft-target-card">
              <div className="ft-form-row">
                <div className="ft-form-group">
                  <label>Target Scale Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="30"
                    max="300"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                  />
                  <small>Currently: {currentWeight} kg</small>
                </div>

                <div className="ft-form-group">
                  <label>Daily Energy Ceiling</label>
                  <div className="ft-calorie-badge">
                    <strong>{activeCalories}</strong>
                    <span>kcal / day</span>
                  </div>
                  <small>Calculated for {FITNESS_GOALS[goal]?.label}</small>
                </div>
              </div>
            </div>

            {/* Recommended Macro Splits */}
            <div className="ft-macro-preview-grid">
              <div className="ft-macro-preview-card ft-macro-preview-card--protein">
                <span className="label">PROTEIN</span>
                <div className="val-row">
                  <input
                    type="number"
                    value={activeProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                  />
                  <span className="unit">grams</span>
                </div>
                <span className="sub">{(activeProtein * 4)} kcal · muscle retention</span>
              </div>

              <div className="ft-macro-preview-card">
                <span className="label">CARBOHYDRATES</span>
                <div className="val-row">
                  <input
                    type="number"
                    value={activeCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                  />
                  <span className="unit">grams</span>
                </div>
                <span className="sub">{(activeCarbs * 4)} kcal · energy & training</span>
              </div>

              <div className="ft-macro-preview-card">
                <span className="label">HEALTHY FATS</span>
                <div className="val-row">
                  <input
                    type="number"
                    value={activeFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                  />
                  <span className="unit">grams</span>
                </div>
                <span className="sub">{(activeFat * 9)} kcal · hormone balance</span>
              </div>
            </div>

            <div className="ft-onboarding-actions">
              <button type="button" className="ft-btn ft-btn--secondary" onClick={handleBack}>
                Back
              </button>
              <button
                type="button"
                className="ft-btn ft-btn--emerald ft-onboarding-next-btn"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? 'Creating Your Dashboard...' : 'Launch FitTrack Dashboard'}
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
