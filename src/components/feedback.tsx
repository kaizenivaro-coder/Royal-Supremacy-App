import type { LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "../lib/utils";

export type StatusTone = "info" | "success" | "warning" | "error";

type StatusBannerProps = Omit<React.HTMLAttributes<HTMLDivElement>, "role"> & {
  tone?: StatusTone;
  icon?: LucideIcon;
};

const statusToneClasses: Record<StatusTone, string> = {
  info: "border-blue-300/25 bg-blue-400/10 text-purple-light",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-gold/35 bg-gold/10 text-gold",
  error: "border-danger/30 bg-danger/10 text-danger",
};

export function StatusBanner({
  tone = "info",
  icon: Icon,
  className,
  children,
  ...props
}: StatusBannerProps) {
  const isError = tone === "error";

  return (
    <div
      {...props}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold",
        statusToneClasses[tone],
        className,
      )}
    >
      {Icon ? (
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      ) : null}
      <div className="min-w-0 flex-1 text-current">{children}</div>
    </div>
  );
}

type EmptyStateProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-blue-200/15 bg-black/20 px-5 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      ) : null}
      <h2 className="text-base font-black text-white">{title}</h2>
      {description ? (
        <div className="mt-2 max-w-md text-sm leading-6 text-text-muted">
          {description}
        </div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

type ToastRegionProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-live" | "role"
> & {
  label?: string;
  politeness?: "polite" | "assertive";
};

export function ToastRegion({
  label = "Notifications",
  politeness = "polite",
  className,
  children,
  ...props
}: ToastRegionProps) {
  return (
    <div
      {...props}
      role="region"
      aria-label={label}
      aria-live={politeness}
      aria-atomic="false"
      aria-relevant="additions text"
      className={cn(
        "pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-end gap-2 sm:left-auto sm:w-full sm:max-w-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
