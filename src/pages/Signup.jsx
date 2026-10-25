import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconFlame, IconCheck } from '../components/Icons';
import './AuthForms.css';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginAsDemo } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      await signup({ name, email, password });
      // New user goes straight to onboarding to configure their stats & calorie calculation
      navigate('/onboarding');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    try {
      setLoading(true);
      await loginAsDemo();
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Failed to start demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ft-auth-page">
      <div className="ft-auth-card ft-animate-slide-up">
        {/* Brand */}
        <Link to="/" className="ft-auth-brand">
          <div className="ft-auth-logo-mark">
            <IconFlame size={22} />
          </div>
          <div>
            <span className="ft-auth-brand-name">FITTRACK</span>
            <span className="ft-auth-brand-tag">TRAIN. TRACK. TRANSFORM.</span>
          </div>
        </Link>

        <div className="ft-auth-header">
          <h1 className="ft-auth-title">Create your account</h1>
          <p className="ft-auth-subtitle">Join FitTrack to start your personalized fitness & nutrition journey</p>
        </div>

        {errorMsg && (
          <div className="ft-auth-error">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ft-auth-form">
          <div className="ft-auth-field">
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="ft-auth-field">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="ft-auth-field">
            <label htmlFor="signup-password">Password (min 6 characters)</label>
            <input
              id="signup-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="ft-auth-field">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="ft-btn ft-btn--emerald ft-auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account & Continue'}
          </button>
        </form>

        <div className="ft-auth-divider">
          <span>or explore first</span>
        </div>

        <button
          type="button"
          onClick={handleDemo}
          className="ft-btn ft-btn--secondary ft-auth-demo-btn"
          disabled={loading}
        >
          <span>Try Demo Account (Alex Morgan)</span>
        </button>

        <p className="ft-auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="ft-auth-link-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
