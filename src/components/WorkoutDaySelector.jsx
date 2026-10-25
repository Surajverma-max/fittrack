import './WorkoutDaySelector.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_MAP = { MON: 'monday', TUE: 'tuesday', WED: 'wednesday', THU: 'thursday', FRI: 'friday', SAT: 'saturday', SUN: 'sunday' };

export default function WorkoutDaySelector({ selected, onSelect, todayIndex }) {
  return (
    <div className="day-selector">
      {DAYS.map((day, i) => {
        const dayKey = DAY_MAP[day];
        const isSelected = selected === dayKey;
        const isToday = i === todayIndex;
        return (
          <button
            key={day}
            type="button"
            className={`day-selector__btn ${isSelected ? 'day-selector__btn--selected' : ''} ${isToday ? 'day-selector__btn--today' : ''}`}
            onClick={() => onSelect(dayKey)}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}
