import { useState } from 'react';
import './FoodCard.css';

export default function FoodCard({ food, onAdd }) {
  const [qty, setQty] = useState(1);
  const [showQty, setShowQty] = useState(false);

  const currentQty = Math.max(0.1, Number(qty) || 1);
  const totalCal = Math.round(food.calories * currentQty);
  const totalProtein = Number((food.protein * currentQty).toFixed(1));
  const totalCarbs = Number((food.carbs * currentQty).toFixed(1));
  const totalFat = Number((food.fat * currentQty).toFixed(1));

  const handleAdd = () => {
    onAdd(food, currentQty);
    setQty(1);
    setShowQty(false);
  };

  return (
    <div className="food-card">
      <div className="food-card__info">
        <h4 className="food-card__name">{food.name}</h4>
        <p className="food-card__serving">
          {food.serving} {showQty && currentQty !== 1 ? `(× ${currentQty})` : ''}
        </p>
        <div className="food-card__macros">
          <span className="food-card__macro food-card__macro--cal">{showQty ? totalCal : food.calories} kcal</span>
          <span className="food-card__macro food-card__macro--protein">P: {showQty ? totalProtein : food.protein}g</span>
          <span className="food-card__macro food-card__macro--carbs">C: {showQty ? totalCarbs : food.carbs}g</span>
          <span className="food-card__macro food-card__macro--fat">F: {showQty ? totalFat : food.fat}g</span>
        </div>
      </div>
      {showQty ? (
        <div className="food-card__qty-input">
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={qty}
            onChange={e => setQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="food-card__input"
            autoFocus
          />
          <button onClick={handleAdd} className="food-card__confirm" type="button" title="Add to log">✓</button>
          <button onClick={() => { setShowQty(false); setQty(1); }} className="food-card__cancel" type="button" title="Cancel">✕</button>
        </div>
      ) : (
        <button onClick={() => setShowQty(true)} className="food-card__add-btn" type="button">+ Add</button>
      )}
    </div>
  );
}
