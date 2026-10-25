import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconDashboard,
  IconDumbbell,
  IconHistory,
  IconUtensils,
  IconTrendingUp,
  IconTarget,
  IconLogo,
} from './Icons';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: <IconDashboard size={19} />, label: 'Dashboard' },
  { to: '/workout', icon: <IconDumbbell size={19} />, label: 'Workout' },
  { to: '/history', icon: <IconHistory size={19} />, label: 'Workout History' },
  { to: '/nutrition', icon: <IconUtensils size={19} />, label: 'Nutrition' },
  { to: '/progress', icon: <IconTrendingUp size={19} />, label: 'Progress' },
  { to: '/goals', icon: <IconTarget size={19} />, label: 'Goals' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, profile, isDemo, logout } = useAuth();

  const displayName = profile?.full_name || user?.name || 'Athlete';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async (e) => {
    e.stopPropagation();
    if (window.confirm('Sign out of FitTrack?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <aside className="ft-sidebar">
      {/* Brand & Logo */}
      <div className="ft-sidebar__brand">
        <div className="ft-sidebar__logo-wrap" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <IconLogo size={32} />
          <div>
            <h1 className="ft-sidebar__logo-title">FITTRACK</h1>
            <p className="ft-sidebar__logo-tagline">Train. Track. Transform.</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="ft-sidebar__nav">
        <span className="ft-sidebar__nav-heading">Menu</span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `ft-sidebar__link ${isActive ? 'ft-sidebar__link--active' : ''}`
            }
          >
            <span className="ft-sidebar__icon">{item.icon}</span>
            <span className="ft-sidebar__label">{item.label}</span>
          </NavLink>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `ft-sidebar__link ${isActive ? 'ft-sidebar__link--active' : ''}`
            }
          >
            <span className="ft-sidebar__icon">⚙️</span>
            <span className="ft-sidebar__label">Profile & Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="ft-sidebar__footer" onClick={() => navigate('/profile')} title="View profile & settings">
        <div className="ft-sidebar__user">
          <div className="ft-sidebar__avatar">{initials}</div>
          <div className="ft-sidebar__user-info">
            <span className="ft-sidebar__user-name">{displayName}</span>
            <span className="ft-sidebar__user-status">
              {isDemo ? 'Demo Account' : (profile?.goal ? profile.goal.replace('_', ' ') : 'Active Athlete')}
            </span>
          </div>

          <button
            type="button"
            className="ft-sidebar__logout-mini"
            onClick={handleLogout}
            title="Log Out"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
