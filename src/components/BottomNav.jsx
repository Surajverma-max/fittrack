import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconDashboard,
  IconDumbbell,
  IconUtensils,
  IconTrendingUp,
  IconMore,
  IconHistory,
  IconTarget,
  IconClose,
} from './Icons';
import './BottomNav.css';

export default function BottomNav() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navigate = useNavigate();
  const { user, profile, isDemo, logout } = useAuth();

  const displayName = profile?.full_name || user?.name || 'Athlete';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setShowMoreMenu(false);
    if (window.confirm('Sign out of FitTrack?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <>
      <nav className="ft-bottom-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `ft-bottom-nav__item ${isActive ? 'ft-bottom-nav__item--active' : ''}`
          }
          onClick={() => setShowMoreMenu(false)}
        >
          <IconDashboard size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/workout"
          className={({ isActive }) =>
            `ft-bottom-nav__item ${isActive ? 'ft-bottom-nav__item--active' : ''}`
          }
          onClick={() => setShowMoreMenu(false)}
        >
          <IconDumbbell size={20} />
          <span>Workout</span>
        </NavLink>

        <NavLink
          to="/nutrition"
          className={({ isActive }) =>
            `ft-bottom-nav__item ${isActive ? 'ft-bottom-nav__item--active' : ''}`
          }
          onClick={() => setShowMoreMenu(false)}
        >
          <IconUtensils size={20} />
          <span>Nutrition</span>
        </NavLink>

        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `ft-bottom-nav__item ${isActive ? 'ft-bottom-nav__item--active' : ''}`
          }
          onClick={() => setShowMoreMenu(false)}
        >
          <IconTrendingUp size={20} />
          <span>Progress</span>
        </NavLink>

        <button
          type="button"
          className={`ft-bottom-nav__item ${showMoreMenu ? 'ft-bottom-nav__item--active' : ''}`}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          aria-label="More navigation options"
        >
          <IconMore size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-over sheet for secondary navigation */}
      {showMoreMenu && (
        <div className="ft-bottom-menu-overlay" onClick={() => setShowMoreMenu(false)}>
          <div className="ft-bottom-menu" onClick={(e) => e.stopPropagation()}>
            <div className="ft-bottom-menu__header">
              <span className="ft-bottom-menu__title">FitTrack Menu</span>
              <button
                type="button"
                className="ft-bottom-menu__close"
                onClick={() => setShowMoreMenu(false)}
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="ft-bottom-menu__links">
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `ft-bottom-menu__link ${isActive ? 'ft-bottom-menu__link--active' : ''}`
                }
                onClick={() => setShowMoreMenu(false)}
              >
                <div className="ft-bottom-menu__icon-box">
                  <IconHistory size={20} />
                </div>
                <div className="ft-bottom-menu__text">
                  <strong>Workout History</strong>
                  <span>Past sessions, exercise logs, and volume</span>
                </div>
              </NavLink>

              <NavLink
                to="/goals"
                className={({ isActive }) =>
                  `ft-bottom-menu__link ${isActive ? 'ft-bottom-menu__link--active' : ''}`
                }
                onClick={() => setShowMoreMenu(false)}
              >
                <div className="ft-bottom-menu__icon-box">
                  <IconTarget size={20} />
                </div>
                <div className="ft-bottom-menu__text">
                  <strong>Goals & Targets</strong>
                  <span>Calorie targets, macros, weight & waist</span>
                </div>
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `ft-bottom-menu__link ${isActive ? 'ft-bottom-menu__link--active' : ''}`
                }
                onClick={() => setShowMoreMenu(false)}
              >
                <div className="ft-bottom-menu__icon-box">
                  <span style={{ fontSize: '18px' }}>⚙️</span>
                </div>
                <div className="ft-bottom-menu__text">
                  <strong>Profile & Biometrics</strong>
                  <span>Recalculate targets, biometrics & settings</span>
                </div>
              </NavLink>
            </div>

            <div
              className="ft-bottom-menu__user-footer"
              onClick={() => {
                setShowMoreMenu(false);
                navigate('/profile');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="ft-bottom-menu__avatar">{initials}</div>
              <div style={{ flex: 1 }}>
                <strong>{displayName}</strong>
                <p>{isDemo ? 'Demo Account' : (profile?.email || 'FitTrack Athlete')}</p>
              </div>
              <button
                type="button"
                className="ft-btn ft-btn--secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
