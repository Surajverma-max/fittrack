import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconFlame, IconCheck } from '../components/Icons';
import './AuthForms.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="ft-auth-page">
      <div className="ft-auth-card ft-animate-slide-up">
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
          <h1 className="ft-auth-title">Reset your password</h1>
          <p className="ft-auth-subtitle">
            Enter the email associated with your account and we'll send you recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="ft-auth-success">
            <div className="ft-auth-success__icon">
              <IconCheck size={20} />
            </div>
            <h3>Check your inbox</h3>
            <p>
              We have sent password reset instructions to <strong>{email}</strong>.
            </p>
            <Link to="/login" className="ft-btn ft-btn--primary ft-auth-submit-btn" style={{ marginTop: '16px' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ft-auth-form">
            <div className="ft-auth-field">
              <label htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="ft-btn ft-btn--primary ft-auth-submit-btn">
              Send Reset Link
            </button>
          </form>
        )}

        <p className="ft-auth-footer">
          Remember your password?{' '}
          <Link to="/login" className="ft-auth-link-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
