import './ProgressBar.css';

export default function ProgressBar({ label, current = 0, target = 100, unit = '', color = '#4f46e5' }) {
  const safeTarget = target > 0 ? target : 1;
  const pct = Math.min((current / safeTarget) * 100, 100);
  const isOver = current > target;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar__header">
        <span className="progress-bar__label">{label}</span>
        <span className="progress-bar__values">
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill ${isOver ? 'progress-bar__fill--over' : ''}`}
          style={{ width: `${Math.max(0, pct)}%`, backgroundColor: isOver ? '#ef4444' : color }}
        />
      </div>
      <div className="progress-bar__remaining">
        {isOver
          ? `Over by ${Math.round(current - target)} ${unit}`
          : `${Math.round(target - current)} ${unit} remaining`}
      </div>
    </div>
  );
}
