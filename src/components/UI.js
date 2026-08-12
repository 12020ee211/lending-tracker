import React, { useEffect, useRef } from "react";

// ── Button ─────────────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", loading, className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-indigo-500 shadow-sm",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100 focus:ring-slate-400",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  const s = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  return <div className={`${s[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />;
}

// ── Input ──────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, icon: Icon, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={16} /></div>}
        <input
          className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed
            ${Icon ? "pl-9" : ""}
            ${error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 bg-white transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50
          ${error ? "border-rose-400" : "border-slate-200"}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-600">⚠ {error}</p>}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        rows={3}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none
          ${error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">⚠ {error}</p>}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, color = "slate" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>;
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  const ref = useRef();
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-150" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── Alert ──────────────────────────────────────────────────────────────────
export function Alert({ type = "info", children, onClose }) {
  const styles = {
    error: "bg-rose-50 border-rose-200 text-rose-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-sky-50 border-sky-200 text-sky-800",
  };
  const icons = { error: "⚠", success: "✓", warning: "⚠", info: "ℹ" };
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${styles[type]}`}>
      <span className="shrink-0 font-bold">{icons[type]}</span>
      <p className="flex-1">{children}</p>
      {onClose && <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">✕</button>}
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="mb-4 rounded-2xl bg-slate-100 p-5 text-slate-400"><Icon size={32} /></div>}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = "indigo" }) {
  const accents = {
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${accents[accent]} p-px shadow-sm`}>
      <div className="rounded-2xl bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// ── ConfirmDialog ──────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", variant = "danger" }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
