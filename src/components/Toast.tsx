'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  icon?: string;
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    const el = document.getElementById(`toast-${id}`);
    if (el) {
      el.classList.add('hiding');
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    } else {
      setToasts(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-3), { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

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
          <div
            key={t.id}
            id={`toast-${t.id}`}
            className={`toast toast-${t.type}`}
            onClick={() => removeToast(t.id)}
            style={{ cursor: 'pointer' }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{ICONS[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <span style={{ opacity: 0.7, fontSize: 18, flexShrink: 0 }}>×</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
