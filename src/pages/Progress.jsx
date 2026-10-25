import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService, getLocalDateString } from '../services/dataService';
import { formatDate } from '../utils/storage';
import Modal from '../components/Modal';
import {
  IconScale,
  IconRuler,
  IconSparkles,
  IconPlus,
  IconCheck,
  IconEdit,
  IconTrash,
  IconTrendingUp,
} from '../components/Icons';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import './Progress.css';

const LIFT_ICONS = {
  benchPress: '🏋️‍♂️',
  squat: '🦵',
  deadlift: '⚡',
  pullUps: '🧗',
};

export default function Progress() {
  const { user, profile } = useAuth();
  const today = getLocalDateString();

  // State scoped to user
  const [weightList, setWeightList] = useState([]);
  const [waistList, setWaistList] = useState([]);
  const [strengthData, setStrengthData] = useState({});

  // Modals
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isWaistModalOpen, setIsWaistModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState({ date: today, value: '' });
  const [newWaist, setNewWaist] = useState({ date: today, value: '' });
  const [editingLiftKey, setEditingLiftKey] = useState(null);
  const [editLiftValue, setEditLiftValue] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [weights, waists, strength] = await Promise.all([
        dataService.getWeightHistory(user.id),
        dataService.getWaistHistory(user.id),
        dataService.getStrengthData(user.id),
      ]);

      setWeightList(weights || []);
      setWaistList(waists || []);
      setStrengthData(strength || {});
    } catch (err) {
      console.error('Failed to load progress data:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener('weightUpdated', handleRefresh);
    window.addEventListener('waistUpdated', handleRefresh);
    window.addEventListener('strengthUpdated', handleRefresh);

    return () => {
      window.removeEventListener('weightUpdated', handleRefresh);
      window.removeEventListener('waistUpdated', handleRefresh);
      window.removeEventListener('strengthUpdated', handleRefresh);
    };
  }, [loadData]);

  // Dynamic Weight Metrics
  const weightStats = useMemo(() => {
    if (!weightList || weightList.length === 0) {
      const baseline = profile?.current_weight || 70;
      return { start: baseline, current: baseline, change: 0, count: 0 };
    }
    const start = weightList[0].weight;
    const current = weightList[weightList.length - 1].weight;
    const change = Number((current - start).toFixed(1));
    return { start, current, change, count: weightList.length };
  }, [weightList, profile?.current_weight]);

  // Dynamic Waist Metrics
  const waistStats = useMemo(() => {
    if (!waistList || waistList.length === 0) {
      return { start: null, current: null, change: 0, count: 0 };
    }
    const start = waistList[0].waist;
    const current = waistList[waistList.length - 1].waist;
    const change = Number((current - start).toFixed(1));
    return { start, current, change, count: waistList.length };
  }, [waistList]);

  // Handlers
  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    const val = parseFloat(newWeight.value);
    if (isNaN(val) || val <= 0 || val > 350) return;

    await dataService.logWeight(user.id, val, newWeight.date || today);
    setNewWeight({ date: today, value: '' });
    setIsWeightModalOpen(false);
    showToast(`Weight recorded: ${val} kg`);
  };

  const handleAddWaist = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    const val = parseFloat(newWaist.value);
    if (isNaN(val) || val <= 0 || val > 150) return;

    await dataService.logWaist(user.id, val, newWaist.date || today);
    setNewWaist({ date: today, value: '' });
    setIsWaistModalOpen(false);
    showToast(`Waist recorded: ${val} in`);
  };

  const handleSaveLift = async (key) => {
    if (!user?.id) return;
    const num = parseFloat(editLiftValue);
    if (isNaN(num) || num < 0) return;

    const updated = {
      ...strengthData,
      [key]: {
        ...strengthData[key],
        value: num,
      },
    };

    await dataService.updateStrengthData(user.id, updated);
    setEditingLiftKey(null);
    setEditLiftValue('');
    showToast(`PR updated: ${num} ${strengthData[key]?.unit || 'kg'}`);
  };

  return (
    <div className="ft-progress ft-animate-fade">
      {/* Toast */}
      {toastMessage && (
        <div className="ft-toast ft-animate-slide-up">
          <IconCheck size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="ft-progress__header">
        <div>
          <span className="ft-progress__eyebrow">Transformation Tracking</span>
          <h1 className="ft-progress__title">Body & Strength Progress</h1>
          <p className="ft-progress__subtitle">
            Consistent physical adaptation, body composition shifts, and strength milestones
          </p>
        </div>

        <div className="ft-progress__header-actions">
          <button
            type="button"
            className="ft-btn ft-btn--secondary"
            onClick={() => setIsWaistModalOpen(true)}
          >
            <IconRuler size={16} />
            <span>Log Waist</span>
          </button>
          <button
            type="button"
            className="ft-btn ft-btn--primary"
            onClick={() => setIsWeightModalOpen(true)}
          >
            <IconScale size={16} />
            <span>Log Weight</span>
          </button>
        </div>
      </header>

      {/* Hero Transformation Summary Banner */}
      <section className="ft-transformation-hero">
        <div className="ft-transformation-hero__stat">
          <span className="ft-transformation-hero__label">Starting Weight</span>
          <strong className="ft-transformation-hero__val">
            {weightStats.start} <span className="ft-transformation-hero__unit">kg</span>
          </strong>
          <span className="ft-transformation-hero__note">Initial recorded check-in</span>
        </div>

        <div className="ft-transformation-hero__arrow">→</div>

        <div className="ft-transformation-hero__stat ft-transformation-hero__stat--active">
          <span className="ft-transformation-hero__label">Current Weight</span>
          <strong className="ft-transformation-hero__val">
            {weightStats.current} <span className="ft-transformation-hero__unit">kg</span>
          </strong>
          <span className="ft-transformation-hero__note">Latest check-in</span>
        </div>

        <div className="ft-transformation-hero__stat ft-transformation-hero__stat--change">
          <span className="ft-transformation-hero__label">Total Transformation</span>
          <strong className="ft-transformation-hero__val ft-transformation-hero__val--green">
            {weightStats.count > 1
              ? `${weightStats.change > 0 ? `+${weightStats.change}` : weightStats.change} kg`
              : '0.0 kg'}
          </strong>
          <span className="ft-transformation-hero__badge">
            {weightStats.count > 1
              ? weightStats.change <= 0
                ? 'Lean Reduction'
                : 'Muscle Gain'
              : 'Baseline Established'}
          </span>
        </div>
      </section>

      {/* Weight Chart Card */}
      <section className="ft-chart-card">
        <div
          className="ft-chart-card__header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div>
            <span className="ft-chart-card__eyebrow">Body Composition</span>
            <h3 className="ft-chart-card__title">Weight Progression Curve (kg)</h3>
          </div>
          <button
            type="button"
            className="ft-btn ft-btn--secondary"
            style={{ padding: '6px 14px', fontSize: '13px' }}
            onClick={() => setIsWeightModalOpen(true)}
          >
            <IconPlus size={14} /> Add Weigh-In
          </button>
        </div>

        <div className="ft-chart-card__body">
          {weightList.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weightList} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(d) => {
                    try {
                      const p = d.split('-');
                      return `${p[1]}/${p[2]}`;
                    } catch {
                      return d;
                    }
                  }}
                />
                <YAxis
                  stroke="#94a3b8"
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  unit=" kg"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="ft-custom-tooltip">
                        <span className="ft-custom-tooltip__title">{formatDate(d.date)}</span>
                        <div className="ft-custom-tooltip__row">
                          <span>Weight:</span>
                          <strong style={{ color: '#10b981' }}>{d.weight} kg</strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#weightGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="ft-empty-state" style={{ padding: '40px 20px' }}>
              <IconScale size={32} />
              <h4>No weight check-ins recorded yet</h4>
              <p>Log your daily morning weight to watch your curve develop.</p>
              <button
                type="button"
                className="ft-btn ft-btn--primary"
                onClick={() => setIsWeightModalOpen(true)}
              >
                + Log Weight
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Strength Milestones Grid */}
      <section className="ft-strength-section">
        <div className="ft-strength-header">
          <div>
            <span className="ft-progress__eyebrow">Power & Progression</span>
            <h2>Strength Milestones</h2>
          </div>
        </div>

        <div className="ft-strength-grid">
          {Object.entries(strengthData).map(([key, item]) => {
            const isEditing = editingLiftKey === key;
            return (
              <div key={key} className="ft-strength-card">
                <div className="ft-strength-card__icon">{LIFT_ICONS[key] || '💪'}</div>
                <div className="ft-strength-card__content">
                  <span className="ft-strength-card__label">{item.name}</span>
                  {isEditing ? (
                    <div className="ft-strength-card__edit-row">
                      <input
                        type="number"
                        step="0.5"
                        autoFocus
                        value={editLiftValue}
                        onChange={(e) => setEditLiftValue(e.target.value)}
                        placeholder={item.value?.toString()}
                      />
                      <button
                        type="button"
                        className="ft-btn ft-btn--primary"
                        onClick={() => handleSaveLift(key)}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="ft-strength-card__val-row">
                      <strong>{item.value || '--'}</strong>
                      <span>{item.unit}</span>
                      <button
                        type="button"
                        className="ft-strength-card__edit-btn"
                        onClick={() => {
                          setEditingLiftKey(key);
                          setEditLiftValue(item.value?.toString() || '');
                        }}
                        title="Edit PR"
                      >
                        <IconEdit size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Weight Modal */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Log Scale Weight"
        maxWidth="440px"
      >
        <form onSubmit={handleAddWeight} className="ft-form-stack">
          <div className="ft-form-stack__field">
            <label>Date</label>
            <input
              type="date"
              value={newWeight.date}
              onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
              required
            />
          </div>
          <div className="ft-form-stack__field">
            <label>Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="350"
              placeholder="e.g. 74.5"
              value={newWeight.value}
              onChange={(e) => setNewWeight({ ...newWeight, value: e.target.value })}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="ft-btn ft-btn--primary ft-btn--full">
            <IconCheck size={16} /> Save Weigh-In
          </button>
        </form>
      </Modal>

      {/* Quick Waist Modal */}
      <Modal
        isOpen={isWaistModalOpen}
        onClose={() => setIsWaistModalOpen(false)}
        title="Log Waist Circumference"
        maxWidth="440px"
      >
        <form onSubmit={handleAddWaist} className="ft-form-stack">
          <div className="ft-form-stack__field">
            <label>Date</label>
            <input
              type="date"
              value={newWaist.date}
              onChange={(e) => setNewWaist({ ...newWaist, date: e.target.value })}
              required
            />
          </div>
          <div className="ft-form-stack__field">
            <label>Waist (inches)</label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="150"
              placeholder="e.g. 32.5"
              value={newWaist.value}
              onChange={(e) => setNewWaist({ ...newWaist, value: e.target.value })}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="ft-btn ft-btn--primary ft-btn--full">
            <IconCheck size={16} /> Save Measurement
          </button>
        </form>
      </Modal>
    </div>
  );
}
