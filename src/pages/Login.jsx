import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconFlame, IconCheck, IconChevronRight } from '../components/Icons';
import './AuthForms.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAsDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { profile } = await login({ email, password, remember });
      if (!profile?.current_weight || !profile?.goal) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to log in. Please check your credentials.');
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
        {/* Logo */}
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
          <h1 className="ft-auth-title">Welcome back</h1>
          <p className="ft-auth-subtitle">Sign in to your account to continue tracking your fitness</p>
        </div>

        {errorMsg && (
          <div className="ft-auth-error">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ft-auth-form">
          <div className="ft-auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="ft-auth-field">
            <div className="ft-auth-field__header">
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className="ft-auth-link">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="ft-auth-remember">
            <label className="ft-checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember my session</span>
            </label>
          </div>

          <button
            type="submit"
            className="ft-btn ft-btn--primary ft-auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="ft-auth-divider">
          <span>or explore</span>
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
          Don't have an account yet?{' '}
          <Link to="/signup" className="ft-auth-link-bold">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
