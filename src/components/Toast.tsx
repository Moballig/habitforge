'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const typeStyles: Record<ToastType, { icon: typeof CheckCircle2; color: string; ring: string }> = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    ring: 'border-emerald-200 dark:border-emerald-800',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    ring: 'border-red-200 dark:border-red-800',
  },
  info: {
    icon: Info,
    color: 'text-indigo-500',
    ring: 'border-indigo-200 dark:border-indigo-800',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Live region for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const { icon: Icon, color, ring } = typeStyles[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border ${ring} shadow-lg animate-toast-in max-w-[calc(100vw-2rem)] sm:max-w-sm`}
            >
              <Icon className={`w-4.5 h-4.5 ${color} flex-shrink-0`} />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
                className="ml-1 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
