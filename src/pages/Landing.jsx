import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconFlame,
  IconDumbbell,
  IconTrendingUp,
  IconCheck,
  IconSparkles,
  IconChevronRight,
  IconScale,
  IconAward,
} from '../components/Icons';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();

  const handleDemo = async () => {
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } catch (e) {
      console.error('Demo error:', e);
    }
  };

  return (
    <div className="ft-landing">
      {/* Top Navbar */}
      <nav className="ft-landing__nav">
        <div className="ft-landing__nav-container">
          <Link to="/" className="ft-landing__brand">
            <div className="ft-landing__logo-mark">
              <IconFlame size={20} />
            </div>
            <div className="ft-landing__brand-text">
              <span className="ft-landing__brand-name">FITTRACK</span>
              <span className="ft-landing__brand-tag">TRAIN. TRACK. TRANSFORM.</span>
            </div>
          </Link>

          <div className="ft-landing__nav-links">
            <Link to="/login" className="ft-landing__nav-login">
              Log In
            </Link>
            <Link to="/signup" className="ft-btn ft-btn--primary ft-landing__nav-cta">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="ft-landing__hero">
        <div className="ft-landing__hero-badge">
          <IconSparkles size={14} />
          <span>Multi-User Fitness Platform</span>
        </div>

        <h1 className="ft-landing__hero-title">
          Every body is different. <br />
          <span className="ft-landing__hero-highlight">Your tracker should be too.</span>
        </h1>

        <p className="ft-landing__hero-desc">
          FitTrack calculates your personal BMR and TDEE, tracks daily calories and macros,
          logs progressive workouts with interactive steppers, and visualizes your body transformation
          — tailored entirely to your unique targets.
        </p>

        <div className="ft-landing__hero-actions">
          <Link to="/signup" className="ft-btn ft-btn--emerald ft-landing__hero-btn">
            <span>Create Your Account</span>
            <IconChevronRight size={18} />
          </Link>

          <button
            type="button"
            onClick={handleDemo}
            className="ft-btn ft-btn--secondary ft-landing__hero-btn-demo"
          >
            Try Live Demo
          </button>
        </div>

        {/* Dashboard Preview Visual */}
        <div className="ft-landing__preview-card">
          <div className="ft-landing__preview-header">
            <div className="ft-landing__preview-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <span className="ft-landing__preview-title">fittrack.app / dashboard</span>
          </div>

          <div className="ft-landing__preview-body">
            <div className="ft-preview-row">
              <div className="ft-preview-stat">
                <span className="ft-preview-stat__label">TODAY'S CALORIES</span>
                <span className="ft-preview-stat__val">1,850 <small>/ 2,400 kcal</small></span>
                <span className="ft-preview-stat__sub text-emerald">550 kcal remaining</span>
              </div>
              <div className="ft-preview-stat">
                <span className="ft-preview-stat__label">PROTEIN TARGET</span>
                <span className="ft-preview-stat__val">142 <small>/ 160 g</small></span>
                <span className="ft-preview-stat__sub">88% of daily goal</span>
              </div>
              <div className="ft-preview-stat">
                <span className="ft-preview-stat__label">TODAY'S WORKOUT</span>
                <span className="ft-preview-stat__val">Push A</span>
                <span className="ft-preview-stat__sub text-emerald">Completed · 5,420 kg vol</span>
              </div>
              <div className="ft-preview-stat">
                <span className="ft-preview-stat__label">CURRENT WEIGHT</span>
                <span className="ft-preview-stat__val">78.4 <small>kg</small></span>
                <span className="ft-preview-stat__sub text-emerald">-3.6 kg total loss</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="ft-landing__features">
        <div className="ft-landing__section-header">
          <span className="ft-landing__section-eyebrow">DESIGNED FOR DISCIPLINE</span>
          <h2 className="ft-landing__section-title">Everything you need to transform</h2>
          <p className="ft-landing__section-subtitle">
            Zero bloat, zero intrusive social distractions. Pure focus on your personal nutrition,
            strength progression, and body composition.
          </p>
        </div>

        <div className="ft-landing__grid">
          <div className="ft-feature-card">
            <div className="ft-feature-card__icon ft-feature-card__icon--emerald">
              <IconFlame size={24} />
            </div>
            <h3 className="ft-feature-card__title">Scientific Calorie Engine</h3>
            <p className="ft-feature-card__desc">
              Automatic Mifflin-St Jeor BMR and TDEE calculations personalized to your age, sex,
              height, weight, activity level, and weight rate goal.
            </p>
          </div>

          <div className="ft-feature-card">
            <div className="ft-feature-card__icon ft-feature-card__icon--charcoal">
              <IconDumbbell size={24} />
            </div>
            <h3 className="ft-feature-card__title">Progressive Workout Tracking</h3>
            <p className="ft-feature-card__desc">
              Interactive set logs with quick ±2.5 kg weight and rep steppers, volume metrics,
              automatic personal record detection, and workout history.
            </p>
          </div>

          <div className="ft-feature-card">
            <div className="ft-feature-card__icon ft-feature-card__icon--indigo">
              <IconTrendingUp size={24} />
            </div>
            <h3 className="ft-feature-card__title">Body Composition Trends</h3>
            <p className="ft-feature-card__desc">
              Log daily morning weigh-ins and waist measurements. Visual interactive charts chart
              your rate of change against your target goals.
            </p>
          </div>

          <div className="ft-feature-card">
            <div className="ft-feature-card__icon ft-feature-card__icon--emerald">
              <IconAward size={24} />
            </div>
            <h3 className="ft-feature-card__title">100% Private & Multi-User</h3>
            <p className="ft-feature-card__desc">
              Your data belongs strictly to you. With Row Level Security and isolated accounts,
              your history is private and accessible across all your devices.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="ft-landing__cta-banner">
        <h2 className="ft-landing__cta-title">Ready to take control of your fitness?</h2>
        <p className="ft-landing__cta-desc">
          Create your account in 30 seconds. Onboard your personal stats and see your personalized dashboard immediately.
        </p>
        <Link to="/signup" className="ft-btn ft-btn--emerald ft-landing__cta-btn">
          <span>Get Started Free</span>
          <IconChevronRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="ft-landing__footer">
        <div className="ft-landing__footer-container">
          <div className="ft-landing__footer-brand">
            <strong>FITTRACK</strong>
            <span>Train. Track. Transform.</span>
          </div>
          <p className="ft-landing__footer-copy">
            © {new Date().getFullYear()} FitTrack. Multi-User Fitness & Nutrition Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
