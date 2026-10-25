import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconUtensils, IconDumbbell, IconScale, IconCopy } from './Icons';
import './QuickActions.css';

export default function QuickActions({
  onOpenFoodModal,
  onOpenWeightModal,
  onCopyYesterday,
  todayWorkoutName = 'Today\'s Workout',
  isWorkoutCompleted = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      {/* Primary Log Food Button */}
      <button
        type="button"
        className="quick-action-btn quick-action-btn--primary"
        onClick={onOpenFoodModal}
      >
        <span className="quick-action-btn__icon-wrap quick-action-btn__icon-wrap--emerald">
          <IconPlus size={16} />
        </span>
        <div className="quick-action-btn__text">
          <span className="quick-action-btn__label">Log Food</span>
          <span className="quick-action-btn__sub">Track meal or snack</span>
        </div>
      </button>

      {/* Start / Continue Workout */}
      <button
        type="button"
        className="quick-action-btn"
        onClick={() => navigate('/workout')}
      >
        <span className="quick-action-btn__icon-wrap">
          <IconDumbbell size={16} />
        </span>
        <div className="quick-action-btn__text">
          <span className="quick-action-btn__label">
            {isWorkoutCompleted ? 'View Workout' : 'Start Workout'}
          </span>
          <span className="quick-action-btn__sub">{todayWorkoutName}</span>
        </div>
      </button>

      {/* Quick Add Weight */}
      <button
        type="button"
        className="quick-action-btn"
        onClick={onOpenWeightModal}
      >
        <span className="quick-action-btn__icon-wrap">
          <IconScale size={16} />
        </span>
        <div className="quick-action-btn__text">
          <span className="quick-action-btn__label">Log Weight</span>
          <span className="quick-action-btn__sub">Daily body weigh-in</span>
        </div>
      </button>

      {/* Copy Yesterday */}
      <button
        type="button"
        className="quick-action-btn"
        onClick={onCopyYesterday}
      >
        <span className="quick-action-btn__icon-wrap">
          <IconCopy size={16} />
        </span>
        <div className="quick-action-btn__text">
          <span className="quick-action-btn__label">Copy Yesterday</span>
          <span className="quick-action-btn__sub">Repeat yesterday's diet</span>
        </div>
      </button>
    </div>
  );
}
