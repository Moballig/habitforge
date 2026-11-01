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

const typeStyles: Record<ToastType, { icon: typeof CheckCircle2; color: string }> = {
  success: {
    icon: CheckCircle2,
    color: 'text-primary',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
  },
  info: {
    icon: Info,
    color: 'text-primary',
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
          const { icon: Icon, color } = typeStyles[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl card animate-toast-in max-w-[calc(100vw-2rem)] sm:max-w-sm`}
            >
              <Icon className={`w-4.5 h-4.5 ${color} flex-shrink-0`} aria-hidden="true" />
              <p className="text-sm font-bold text-foreground">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
                className="ml-1 p-1 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
