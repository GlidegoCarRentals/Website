'use client';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, maxWidth = 500 }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-text-muted)', lineHeight: 1, padding: 4 }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmDanger = false, loading = false }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{confirmDanger ? '⚠️' : '❓'}</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10, fontFamily: 'var(--font-heading)' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', lineHeight: 1.6, marginBottom: 28 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} className="btn btn-ghost btn-full">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn btn-full ${confirmDanger ? 'btn-danger' : 'btn-primary'}`}
            style={confirmDanger ? { background: 'var(--color-danger)', color: 'white', border: 'none' } : {}}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
