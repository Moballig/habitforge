"use client";

import type { ComponentType, ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  full,
  type = "button",
  disabled,
  onClick,
  loading,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger-soft";
  full?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${variant} ${full ? "w-full" : ""}`}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

export function PillInput({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  right,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  right?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink/55">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="pill-input"
      />
      {error && <p className="mt-1.5 text-sm font-medium text-rose">{error}</p>}
      {right}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink/55">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
      {error && <p className="mt-1.5 text-sm font-medium text-rose">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  id,
  value,
  options,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pill-input appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; icon?: ComponentType<{ size?: number }> }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-1 rounded-full bg-surface-soft p-1"
    >
      {options.map((o) => {
        const on = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${
              on ? "bg-surface text-ink shadow-card" : "text-ink/50"
            }`}
          >
            {Icon && <Icon size={15} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function StepperInput({
  label,
  value,
  unit,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
}: {
  label: string;
  value: number;
  unit?: string;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink/55">{label}</span>
      <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-2 py-1">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-lg font-bold"
        >
          −
        </button>
        <span className="font-num min-w-16 text-center text-lg font-extrabold tabular">
          {value}
          {unit && <span className="ml-1 text-xs font-semibold text-ink/50">{unit}</span>}
        </span>
        <button
          type="button"
          aria-label="Increase"
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-lg font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-up relative max-h-[85dvh] w-full overflow-y-auto rounded-t-card bg-surface p-5 pb-[calc(20px+env(safe-area-inset-bottom))] md:max-w-lg md:rounded-card"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-surface-soft md:hidden" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-ink/30" onClick={onCancel} aria-label="Cancel" />
      <div role="dialog" aria-modal="true" className="card relative w-full max-w-sm p-6">
        <h2 className="text-lg font-bold">{title}</h2>
        {body && <p className="mt-2 text-sm text-ink/60">{body}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" full onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger-soft" full onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
