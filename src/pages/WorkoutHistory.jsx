import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { formatDate } from '../utils/storage';
import Modal from '../components/Modal';
import {
  IconHistory,
  IconDumbbell,
  IconAward,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
} from '../components/Icons';
import './WorkoutHistory.css';

export default function WorkoutHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'month', 'week'
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    const items = await dataService.getWorkoutHistory(user.id);
    setHistory(items || []);
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
    const handleRefresh = () => loadHistory();
    window.addEventListener('workoutUpdated', handleRefresh);
    return () => window.removeEventListener('workoutUpdated', handleRefresh);
  }, [loadHistory]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!deleteTargetId || !user?.id) return;
    await dataService.deleteWorkout(user.id, deleteTargetId);
    setDeleteTargetId(null);
  };

  // Filtered sessions
  const filteredHistory = history.filter((w) => {
    if (filterPeriod === 'all') return true;
    const wDate = new Date(w.date + 'T00:00:00');
    const now = new Date();
    const diffDays = (now - wDate) / (1000 * 60 * 60 * 24);
    if (filterPeriod === 'week') return diffDays <= 7;
    if (filterPeriod === 'month') return diffDays <= 30;
    return true;
  });

  return (
    <div className="ft-history ft-animate-fade">
      {/* Header */}
      <header className="ft-history__header">
        <div>
          <span className="ft-history__eyebrow">Training Archive</span>
          <h1 className="ft-history__title">Workout History</h1>
          <p className="ft-history__subtitle">
            {history.length} completed session{history.length !== 1 ? 's' : ''} logged in your account
          </p>
        </div>

        <div className="ft-history__actions">
          <div className="ft-filter-pills">
            <button
              type="button"
              className={`ft-filter-pill ${filterPeriod === 'all' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`ft-filter-pill ${filterPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('month')}
            >
              Past Month
            </button>
            <button
              type="button"
              className={`ft-filter-pill ${filterPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('week')}
            >
              This Week
            </button>
          </div>

          <button
            type="button"
            className="ft-btn ft-btn--primary"
            onClick={() => navigate('/workout')}
          >
            <IconPlus size={16} />
            <span>Start Session</span>
          </button>
        </div>
      </header>

      {/* History Timeline */}
      {filteredHistory.length === 0 ? (
        <div className="ft-empty-state ft-history__empty">
          <IconHistory size={48} />
          <h3>No workouts recorded {filterPeriod !== 'all' ? 'in this timeframe' : 'yet'}</h3>
          <p>
            Complete your scheduled workout today and it will automatically show up here with full volume & PR analytics.
          </p>
          <button
            type="button"
            className="ft-btn ft-btn--primary"
            onClick={() => navigate('/workout')}
          >
            <IconDumbbell size={16} />
            <span>Go to Workout Tracker</span>
          </button>
        </div>
      ) : (
        <div className="ft-history__timeline">
          {filteredHistory.map((item) => {
            const isExpanded = expandedIds.has(item.id);
            const volumeVal = Number(item.total_volume) || Number(item.totalVolume) || 0;

            return (
              <div key={item.id} className="ft-history-card">
                <div
                  className="ft-history-card__header"
                  onClick={() => toggleExpand(item.id)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <div className="ft-history-card__left">
                    <div className="ft-history-card__icon-wrap">
                      <IconDumbbell size={20} />
                    </div>
                    <div>
                      <div className="ft-history-card__title-row">
                        <h3 className="ft-history-card__name">{item.name}</h3>
                        <span className="ft-history-card__day-tag">{item.day || 'Session'}</span>
                      </div>
                      <span className="ft-history-card__date">
                        {formatDate(item.date)} {item.time && `· ${item.time}`}
                      </span>
                    </div>
                  </div>

                  <div className="ft-history-card__right">
                    <div className="ft-history-card__metrics">
                      <span className="ft-history-card__metric">
                        <strong>{item.totalExercises || item.exercises?.length || 0}</strong> exercises
                      </span>
                      <span className="ft-history-card__metric-dot">·</span>
                      <span className="ft-history-card__metric">
                        <strong>{volumeVal.toLocaleString()} kg</strong> volume
                      </span>
                    </div>

                    <button
                      type="button"
                      className="ft-history-card__toggle-btn"
                      aria-label={isExpanded ? 'Collapse exercises' : 'Expand exercises'}
                    >
                      {isExpanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                    </button>
                  </div>
                </div>

                {/* PR Badges */}
                {item.newPRs && item.newPRs.length > 0 && (
                  <div className="ft-history-card__prs">
                    <IconAward size={14} />
                    <span>Personal Record: <strong>{item.newPRs.join(', ')}</strong></span>
                  </div>
                )}

                {/* Expanded Exercise Breakdown */}
                {isExpanded && item.exercises && item.exercises.length > 0 && (
                  <div className="ft-history-card__expanded ft-animate-fade">
                    <div className="ft-history-card__table-wrap">
                      <table className="ft-history-table">
                        <thead>
                          <tr>
                            <th>Exercise</th>
                            <th>Muscle</th>
                            <th>Sets</th>
                            <th>Reps</th>
                            <th>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.exercises.map((ex, idx) => (
                            <tr key={idx}>
                              <td><strong>{ex.name}</strong></td>
                              <td><span className="ft-muscle-tag">{ex.muscle || 'General'}</span></td>
                              <td>{ex.sets}</td>
                              <td>{ex.reps}</td>
                              <td>
                                {ex.isCardio ? (
                                  <span className="ft-cardio-tag">Cardio</span>
                                ) : (
                                  <strong>{ex.weight} kg</strong>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="ft-history-card__footer">
                      <button
                        type="button"
                        className="ft-btn ft-btn--secondary ft-history-card__del-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(item.id);
                        }}
                      >
                        <IconTrash size={14} />
                        <span>Delete Session Record</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Workout Session?"
        maxWidth="440px"
      >
        <div className="ft-form-stack">
          <p className="ft-form-stack__desc">
            Are you sure you want to permanently remove this workout session? This action cannot be undone.
          </p>
          <div className="ft-modal-actions">
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ft-btn ft-btn--primary"
              style={{ background: 'var(--ft-rose)' }}
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
