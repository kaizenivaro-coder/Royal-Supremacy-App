import React from "react";
import { cn } from "../lib/utils";

export function Card({
  className,
  children,
  glass = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return (
    <div
      className={cn(
        glass
          ? "glass-card"
          : "bg-surface border border-white/5 rounded-2xl p-6 shadow-xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  size = "default",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold";
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const base =
    "inline-flex items-center justify-center font-bold transition-all rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider";
  const variants = {
    primary:
      "bg-purple-royal hover:bg-purple-light text-white shadow-lg shadow-purple-royal/20 border border-white/10",
    secondary:
      "bg-surface-hover hover:bg-white/10 text-white border border-white/10",
    gold: "bg-gold hover:bg-gold-muted text-background shadow-lg shadow-gold/20",
    danger:
      "bg-danger/20 text-danger hover:bg-danger/30 border border-danger/20",
    ghost: "bg-transparent hover:bg-white/5 text-text-muted hover:text-white",
  };
  const sizes = {
    sm: "h-8 px-3 text-[10px]",
    default: "h-11 px-5 text-sm",
    lg: "h-14 px-8 text-base",
    icon: "h-10 w-10 p-2",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  className,
  variant = "default",
  children,
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "gold" | "purple" | "success" | "danger" | "warning";
}) {
  const variants = {
    default: "bg-white/5 text-text-muted border border-white/10",
    gold: "bg-gold/10 text-gold border border-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]",
    purple:
      "bg-purple-royal/20 text-purple-light border border-purple-royal/30",
    success: "bg-success/10 text-success border border-success/30",
    danger: "bg-danger/10 text-danger border border-danger/30",
    warning: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-surface-hover/50 px-4 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-white/10 bg-surface-hover/50 px-4 py-2 text-sm text-white placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border border-white/10 bg-surface-hover/50 px-4 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 block",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 text-left">
      <div>
        <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-2 tracking-tighter uppercase shrink-0">
          <span className="gold-gradient-text">{title}</span>
        </h1>
        {description && (
          <p className="text-text-muted text-sm font-medium">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">{children}</div>
      )}
    </div>
  );
}
