import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft } from "lucide-react";
import React, { useRef } from "react";
import { cn } from "../lib/utils";

export type OverlayProps = {
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isSheet = variant === "sheet";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-overlay-backdrop=""
          className="overlay-backdrop-enter fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
        />
        <Dialog.Content
          aria-modal="true"
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => {
            if (event.isComposing) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            previousFocusRef.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
            event.preventDefault();
            closeRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            previousFocusRef.current?.focus({ preventScroll: true });
            previousFocusRef.current = null;
          }}
          className={cn(
            "overlay-enter fixed z-[101] flex max-h-[92dvh] w-full flex-col overflow-hidden border border-blue-200/15 bg-[#071425] shadow-2xl shadow-black/60 focus:outline-none",
            isSheet
              ? "inset-x-0 bottom-0 rounded-t-lg md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg"
              : "left-1/2 top-1/2 max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg",
            className,
          )}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-blue-200/10 px-4 py-3 sm:px-5">
            <Dialog.Close asChild>
              <button
                ref={closeRef}
                type="button"
                aria-label={`Close ${title}`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-white/5 hover:text-gold focus:outline-none"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
            <Dialog.Title asChild>
              <h2 className="min-w-0 text-base font-black text-white sm:text-lg">
                {title}
              </h2>
            </Dialog.Title>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
            {children}
          </div>

          {footer ? (
            <footer className="sticky bottom-0 shrink-0 border-t border-gold/15 bg-[#071425]/98 p-4 backdrop-blur-md sm:px-5">
              {footer}
            </footer>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function FocusedDialog(props: OverlayProps) {
  return <OverlayFrame {...props} variant="dialog" />;
}

export function MobileSheet(props: OverlayProps) {
  return <OverlayFrame {...props} variant="sheet" />;
}
