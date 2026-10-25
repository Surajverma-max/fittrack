import React from 'react';
import './MacroCards.css';

export default function MacroCards({ totals = {}, goals = {} }) {
  const macros = [
    {
      key: 'protein',
      label: 'Protein',
      consumed: totals.protein || 0,
      target: goals.protein || 125,
      unit: 'g',
      color: '#10b981',
      bgLight: '#ecfdf5',
      borderLight: '#a7f3d0',
      isPrimary: true,
      tag: 'Muscle & Repair',
    },
    {
      key: 'carbs',
      label: 'Carbs',
      consumed: totals.carbs || 0,
      target: goals.carbs || 250,
      unit: 'g',
      color: '#f59e0b',
      bgLight: '#fffbeb',
      borderLight: '#fde68a',
      isPrimary: false,
      tag: 'Energy',
    },
    {
      key: 'fat',
      label: 'Fat',
      consumed: totals.fat || 0,
      target: goals.fat || 70,
      unit: 'g',
      color: '#6366f1',
      bgLight: '#eef2ff',
      borderLight: '#c7d2fe',
      isPrimary: false,
      tag: 'Hormones',
    },
  ];

  return (
    <div className="macro-cards">
      {macros.map(m => {
        const safeTarget = Math.max(m.target, 1);
        const remaining = safeTarget - m.consumed;
        const isOver = m.consumed > safeTarget;
        const pct = Math.min(Math.max((m.consumed / safeTarget) * 100, 0), 100);

        return (
          <div
            key={m.key}
            className={`macro-card ${m.isPrimary ? 'macro-card--primary' : ''}`}
          >
            <div className="macro-card__header">
              <div className="macro-card__title-group">
                <span className="macro-card__name">{m.label}</span>
                {m.isPrimary && <span className="macro-card__tag">Priority</span>}
              </div>
              <span className="macro-card__pct">{Math.round(pct)}%</span>
            </div>

            <div className="macro-card__values">
              <span className="macro-card__current">{Math.round(m.consumed)}</span>
              <span className="macro-card__target"> / {m.target} {m.unit}</span>
            </div>

            <div className="macro-card__track">
              <div
                className="macro-card__fill"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isOver ? '#ef4444' : m.color,
                }}
              />
            </div>

            <div className="macro-card__footer">
              <span className={`macro-card__remaining ${isOver ? 'macro-card__remaining--over' : ''}`}>
                {isOver
                  ? `Over by ${Math.round(m.consumed - safeTarget)} ${m.unit}`
                  : `${Math.max(0, Math.round(remaining))} ${m.unit} remaining`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
