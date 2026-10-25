import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { IconSearch, IconPlus, IconCheck, IconFlame, IconClose } from './Icons';
import './FoodLogModal.css';

export default function FoodLogModal({
  isOpen,
  onClose,
  onAddFood,
  recentFoods = [],
  commonFoods = [],
  customFoods = [],
  onSaveCustomFood,
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'recent', 'custom', 'new'
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // New custom food form state
  const [customForm, setCustomForm] = useState({
    name: '',
    serving: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  // Filtered food list
  const filteredList = useMemo(() => {
    let source = [];
    if (filterTab === 'recent') {
      source = recentFoods;
    } else if (filterTab === 'custom') {
      source = customFoods;
    } else {
      source = [...commonFoods, ...customFoods];
    }

    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(f => f.name.toLowerCase().includes(q) || (f.serving && f.serving.toLowerCase().includes(q)));
  }, [filterTab, search, recentFoods, commonFoods, customFoods]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  const handleConfirmAdd = () => {
    if (!selectedFood) return;
    const qty = Math.max(0.1, Number(quantity) || 1);
    onAddFood(selectedFood, qty);
    setSelectedFood(null);
    setQuantity(1);
    onClose();
  };

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customForm.name.trim() || !customForm.calories) return;
    const food = {
      id: 'custom_' + Date.now().toString(36),
      name: customForm.name.trim(),
      serving: customForm.serving.trim() || '1 serving',
      calories: parseFloat(customForm.calories) || 0,
      protein: parseFloat(customForm.protein) || 0,
      carbs: parseFloat(customForm.carbs) || 0,
      fat: parseFloat(customForm.fat) || 0,
    };
    if (onSaveCustomFood) {
      onSaveCustomFood(food);
    }
    onAddFood(food, 1);
    setCustomForm({ name: '', serving: '', calories: '', protein: '', carbs: '', fat: '' });
    setFilterTab('all');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Food & Nutrition" maxWidth="620px">
      <div className="food-log-modal">
        {/* Search Bar */}
        <div className="food-log-modal__search-wrap">
          <IconSearch size={18} className="food-log-modal__search-icon" />
          <input
            type="text"
            className="food-log-modal__search-input"
            placeholder="Search egg, chicken, oats, rice, paneer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              className="food-log-modal__search-clear"
              onClick={() => setSearch('')}
            >
              <IconClose size={16} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="food-log-modal__tabs">
          <button
            type="button"
            className={`food-log-modal__tab ${filterTab === 'all' ? 'food-log-modal__tab--active' : ''}`}
            onClick={() => { setFilterTab('all'); setSelectedFood(null); }}
          >
            All Foods ({commonFoods.length})
          </button>
          <button
            type="button"
            className={`food-log-modal__tab ${filterTab === 'recent' ? 'food-log-modal__tab--active' : ''}`}
            onClick={() => { setFilterTab('recent'); setSelectedFood(null); }}
          >
            Recent ({recentFoods.length})
          </button>
          <button
            type="button"
            className={`food-log-modal__tab ${filterTab === 'custom' ? 'food-log-modal__tab--active' : ''}`}
            onClick={() => { setFilterTab('custom'); setSelectedFood(null); }}
          >
            My Foods ({customFoods.length})
          </button>
          <button
            type="button"
            className={`food-log-modal__tab ${filterTab === 'new' ? 'food-log-modal__tab--active' : ''}`}
            onClick={() => { setFilterTab('new'); setSelectedFood(null); }}
          >
            + Custom Food
          </button>
        </div>

        {/* Custom Food Creation Tab */}
        {filterTab === 'new' ? (
          <form onSubmit={handleCreateCustom} className="food-log-modal__custom-form">
            <h4 className="food-log-modal__section-title">Create & Log Custom Food</h4>
            <div className="food-log-modal__grid-fields">
              <div className="food-log-modal__field">
                <label>Food Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greek Yogurt 0% Fat"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                />
              </div>
              <div className="food-log-modal__field">
                <label>Serving Measurement</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 cup (~170 g)"
                  value={customForm.serving}
                  onChange={(e) => setCustomForm({ ...customForm, serving: e.target.value })}
                />
              </div>
              <div className="food-log-modal__field">
                <label>Calories (kcal)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="100"
                  value={customForm.calories}
                  onChange={(e) => setCustomForm({ ...customForm, calories: e.target.value })}
                />
              </div>
              <div className="food-log-modal__field">
                <label>Protein (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  placeholder="17"
                  value={customForm.protein}
                  onChange={(e) => setCustomForm({ ...customForm, protein: e.target.value })}
                />
              </div>
              <div className="food-log-modal__field">
                <label>Carbs (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  placeholder="6"
                  value={customForm.carbs}
                  onChange={(e) => setCustomForm({ ...customForm, carbs: e.target.value })}
                />
              </div>
              <div className="food-log-modal__field">
                <label>Fat (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  placeholder="0"
                  value={customForm.fat}
                  onChange={(e) => setCustomForm({ ...customForm, fat: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="food-log-modal__btn food-log-modal__btn--primary">
              <IconCheck size={16} /> Save & Log Food
            </button>
          </form>
        ) : (
          /* Food List */
          <div className="food-log-modal__list">
            {filteredList.length === 0 ? (
              <div className="food-log-modal__empty">
                <p>No matching foods found for "{search}".</p>
                <button
                  type="button"
                  className="food-log-modal__btn-text"
                  onClick={() => { setFilterTab('new'); setCustomForm(prev => ({ ...prev, name: search })); }}
                >
                  Create "{search}" as custom food →
                </button>
              </div>
            ) : (
              filteredList.map((food) => {
                const isSelected = selectedFood && (selectedFood.id === food.id || selectedFood.name === food.name);
                const currentQty = isSelected ? Math.max(0.1, Number(quantity) || 1) : 1;
                const totalCal = Math.round(food.calories * currentQty);
                const totalPro = Number((food.protein * currentQty).toFixed(1));

                return (
                  <div
                    key={food.id || food.name}
                    className={`food-log-modal__item ${isSelected ? 'food-log-modal__item--selected' : ''}`}
                  >
                    <div className="food-log-modal__item-info" onClick={() => handleSelectFood(food)}>
                      <div className="food-log-modal__item-title">
                        <span className="food-log-modal__food-name">{food.name}</span>
                        <span className="food-log-modal__serving">{food.serving}</span>
                      </div>
                      <div className="food-log-modal__item-macros">
                        <span className="food-log-modal__macro-badge food-log-modal__macro-badge--cal">
                          <IconFlame size={12} /> {totalCal} kcal
                        </span>
                        <span className="food-log-modal__macro-badge food-log-modal__macro-badge--pro">
                          {totalPro}g Protein
                        </span>
                        <span className="food-log-modal__macro-sub">
                          C: {Number(((food.carbs || 0) * currentQty).toFixed(1))}g · F: {Number(((food.fat || 0) * currentQty).toFixed(1))}g
                        </span>
                      </div>
                    </div>

                    <div className="food-log-modal__item-actions">
                      {isSelected ? (
                        <div className="food-log-modal__stepper">
                          <button
                            type="button"
                            className="food-log-modal__step-btn"
                            onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                          >
                            –
                          </button>
                          <input
                            type="number"
                            className="food-log-modal__step-input"
                            value={quantity}
                            step="0.5"
                            min="0.5"
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                          />
                          <button
                            type="button"
                            className="food-log-modal__step-btn"
                            onClick={() => setQuantity(quantity + 0.5)}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="food-log-modal__confirm-btn"
                            onClick={handleConfirmAdd}
                            title="Add to today's log"
                          >
                            <IconCheck size={16} /> Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="food-log-modal__add-btn"
                          onClick={() => handleSelectFood(food)}
                        >
                          <IconPlus size={14} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
