import { ArrowLeft } from "lucide-react";
import React, { useEffect, useId, useRef } from "react";
import { cn } from "../lib/utils";

type Focusable = {
  focus: () => void;
};

type OverlayDocument = {
  activeElement: unknown;
  body: { style: { overflow: string } };
  addEventListener: (
    type: "keydown",
    listener: (event: KeyboardEvent) => void,
  ) => void;
  removeEventListener: (
    type: "keydown",
    listener: (event: KeyboardEvent) => void,
  ) => void;
};

type OverlayDialog = {
  querySelectorAll: (selector: string) => ArrayLike<Focusable>;
};

type OverlayInteractionOptions = {
  document: OverlayDocument;
  dialog: OverlayDialog;
  initialFocus: Focusable;
  onClose: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function canFocus(value: unknown): value is Focusable {
  return (
    typeof value === "object" &&
    value !== null &&
    "focus" in value &&
    typeof value.focus === "function"
  );
}

/** @internal Shared imperative behavior used by both overlay components. */
export function setupOverlayInteractions({
  document,
  dialog,
  initialFocus,
  onClose,
}: OverlayInteractionOptions) {
  const previousFocus = canFocus(document.activeElement)
    ? document.activeElement
    : null;
  const previousOverflow = document.body.style.overflow;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      dialog.querySelectorAll(focusableSelector),
    );
    if (focusableElements.length === 0) {
      event.preventDefault();
      initialFocus.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleKeyDown);
  initialFocus.focus();

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus();
  };
}

function useOverlayInteractions(
  open: boolean,
  onClose: () => void,
  dialogRef: React.RefObject<HTMLDivElement | null>,
  closeRef: React.RefObject<HTMLButtonElement | null>,
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const initialFocus = closeRef.current;
    if (!open || !dialog || !initialFocus || typeof document === "undefined") {
      return;
    }

    return setupOverlayInteractions({
      document: document as unknown as OverlayDocument,
      dialog: dialog as unknown as OverlayDialog,
      initialFocus,
      onClose: () => onCloseRef.current(),
    });
  }, [open, dialogRef, closeRef]);
}

type OverlayProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

type OverlayFrameProps = OverlayProps & {
  variant: "dialog" | "sheet";
};

function OverlayFrame({
  open,
  title,
  onClose,
  children,
  footer,
  className,
  variant,
}: OverlayFrameProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useOverlayInteractions(open, onClose, dialogRef, closeRef);

  if (!open) return null;

  const isSheet = variant === "sheet";

  return (
    <div
      className={cn(
        "overlay-backdrop-enter fixed inset-0 z-[100] flex bg-black/80 backdrop-blur-md",
        isSheet
          ? "items-end justify-center md:items-center md:p-4"
          : "items-center justify-center p-4",
      )}
      data-state="open"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "overlay-enter flex max-h-[92dvh] w-full flex-col overflow-hidden border border-blue-200/15 bg-[#071425] shadow-2xl shadow-black/60",
          isSheet
            ? "rounded-t-lg md:max-w-lg md:rounded-lg"
            : "max-w-2xl rounded-lg",
          className,
        )}
        data-state="open"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-blue-200/10 px-4 py-3 sm:px-5">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-white/5 hover:text-gold focus:outline-none"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h2
            id={titleId}
            className="min-w-0 text-base font-black text-white sm:text-lg"
          >
            {title}
          </h2>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {children}
        </div>

        {footer ? (
          <footer className="sticky bottom-0 shrink-0 border-t border-gold/15 bg-[#071425]/98 p-4 backdrop-blur-md sm:px-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function FocusedDialog(props: OverlayProps) {
  return <OverlayFrame {...props} variant="dialog" />;
}

export function MobileSheet(props: OverlayProps) {
  return <OverlayFrame {...props} variant="sheet" />;
}
