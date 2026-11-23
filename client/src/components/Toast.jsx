import { createContext, useCallback, useContext, useState } from 'react';

// Small on-page notifications that replace browser alert() pop-ups.
// Usage: const toast = useToast(); toast.success('Saved'); toast.error('Failed');
const ToastContext = createContext(null);

const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};
const ICONS = { success: '✅', error: '⚠️', info: 'ℹ️' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type, text, ms = 4500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, type, text }]);
    setTimeout(() => dismiss(id), ms);
  }, [dismiss]);

  const api = {
    success: (text) => push('success', text),
    error: (text) => push('error', text, 7000),
    info: (text) => push('info', text)
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg text-sm font-semibold ${STYLES[t.type]}`}>
            <span aria-hidden="true">{ICONS[t.type]}</span>
            <span className="flex-1">{t.text}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100 min-w-6 min-h-6">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// eslint-disable-next-line react-refresh/only-export-components
export const errMsg = (err, fallback = 'Something went wrong.') => err?.response?.data?.message || fallback;
