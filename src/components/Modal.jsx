import React, { useEffect } from 'react';
import './Modal.css';
import { IconClose } from './Icons';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '560px' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ft-modal-overlay" onClick={onClose}>
      <div
        className="ft-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="ft-modal-sheet-handle" />

        <div className="ft-modal-header">
          {title && <h3 className="ft-modal-title">{title}</h3>}
          <button
            type="button"
            className="ft-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="ft-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
