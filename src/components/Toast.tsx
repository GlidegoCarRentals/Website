'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

// ─────────────────────────────────────────────
// Helper — remove toast with animation
// ─────────────────────────────────────────────
function animateAndRemove(id: string, setToasts: React.Dispatch<React.SetStateAction<Toast[]>>) {
  const el = document.getElementById(`toast-${id}`);
  if (el) {
    el.classList.add('hiding');
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  } else {
    setToasts(prev => prev.filter(t => t.id !== id));
  }
}

function createToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.round(performance.now())}`;
}

// ─────────────────────────────────────────────
// Single Toast Item
// ─────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      id={`toast-${toast.id}`}
      className={`toast toast-${toast.type}`}
      onClick={() => onRemove(toast.id)}
      style={{ cursor: 'pointer' }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{ICONS[toast.type]}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <span style={{ opacity: 0.7, fontSize: 18, flexShrink: 0 }}>×</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Toast Provider
// ─────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    animateAndRemove(id, setToasts);
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = createToastId();
    setToasts(prev => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => animateAndRemove(id, setToasts), 4000);
  }, []);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (m) => addToast(m, 'success'),
    error:   (m) => addToast(m, 'error'),
    info:    (m) => addToast(m, 'info'),
    warning: (m) => addToast(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
