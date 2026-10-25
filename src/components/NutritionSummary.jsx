import React from 'react';
import CalorieRing from './CalorieRing';
import MacroCards from './MacroCards';
import './NutritionSummary.css';

export default function NutritionSummary({ totals = {}, goals = {} }) {
  return (
    <div className="nutrition-summary">
      <div className="nutrition-summary__ring-col">
        <CalorieRing
          consumed={totals.calories || 0}
          target={goals.calories || 2100}
          size={210}
        />
      </div>

      <div className="nutrition-summary__macros-col">
        <div className="nutrition-summary__macros-header">
          <span className="nutrition-summary__eyebrow">Daily Targets</span>
          <h3 className="nutrition-summary__heading">Macronutrient Fuel</h3>
        </div>
        <MacroCards totals={totals} goals={goals} />
      </div>
    </div>
  );
}
