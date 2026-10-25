import React from 'react';
import './CalorieRing.css';
import { IconFlame, IconCheck } from './Icons';

export default function CalorieRing({ consumed = 0, target = 2100, size = 210 }) {
  const safeTarget = Math.max(target, 1);
  const remaining = safeTarget - consumed;
  const isOver = consumed > safeTarget;
  const isTargetMet = !isOver && consumed >= safeTarget * 0.95 && consumed <= safeTarget;
  const isApproaching = !isOver && consumed >= safeTarget * 0.85 && consumed < safeTarget * 0.95;

  const pct = Math.min(Math.max((consumed / safeTarget) * 100, 0), 100);

  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  let ringStateClass = 'calorie-ring--normal';
  let gradientStart = '#10b981';
  let gradientEnd = '#059669';

  if (isOver) {
    ringStateClass = 'calorie-ring--over';
    gradientStart = '#f43f5e';
    gradientEnd = '#e11d48';
  } else if (isTargetMet) {
    ringStateClass = 'calorie-ring--met';
    gradientStart = '#10b981';
    gradientEnd = '#34d399';
  } else if (isApproaching) {
    ringStateClass = 'calorie-ring--approaching';
    gradientStart = '#f59e0b';
    gradientEnd = '#d97706';
  }

  return (
    <div className={`calorie-ring ${ringStateClass}`} style={{ width: size, height: size }}>
      <svg className="calorie-ring__svg" width={size} height={size}>
        <defs>
          <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
          <filter id="calorieGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={gradientStart} floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Track background */}
        <circle
          className="calorie-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Arc */}
        <circle
          className="calorie-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#calorieGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#calorieGlow)"
        />
      </svg>

      {/* Ring Content inside */}
      <div className="calorie-ring__content">
        <div className="calorie-ring__badge">
          {isOver ? (
            <span className="calorie-ring__badge-pill calorie-ring__badge-pill--over">Limit Exceeded</span>
          ) : isTargetMet ? (
            <span className="calorie-ring__badge-pill calorie-ring__badge-pill--met">
              <IconCheck size={12} /> Target Reached
            </span>
          ) : (
            <span className="calorie-ring__badge-pill">
              <IconFlame size={12} /> Calories
            </span>
          )}
        </div>

        <div className="calorie-ring__main-num">
          {isOver ? Math.round(Math.abs(remaining)) : Math.max(0, Math.round(remaining))}
        </div>

        <div className="calorie-ring__subtext">
          {isOver ? 'kcal over limit' : 'kcal remaining'}
        </div>

        <div className="calorie-ring__consumed">
          <strong>{Math.round(consumed).toLocaleString()}</strong>
          <span> / {safeTarget.toLocaleString()} kcal</span>
        </div>
      </div>
    </div>
  );
}
