import './StatCard.css';

export default function StatCard({ label, value, subtitle, color, icon }) {
  return (
    <div className="stat-card" style={color ? { borderTop: `3px solid ${color}` } : {}}>
      {icon && <div className="stat-card__icon">{icon}</div>}
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
    </div>
  );
}
