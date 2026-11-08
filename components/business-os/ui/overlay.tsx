"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CheckCircleIcon, CloseIcon, XCircleIcon } from "@/components/business-os/ui/icons";
import { Button, cx } from "@/components/business-os/ui/primitives";

/* ---------- Media ---------- */

function subscribeMedia(query: string) {
  return (callback: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", callback);
    return () => list.removeEventListener("change", callback);
  };
}

/** Server and first paint assume desktop; the client corrects after hydration. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");

/* ---------- Sheet / dialog ---------- */

const SheetCloseContext = createContext<() => void>(() => {});
export const useSheetClose = () => useContext(SheetCloseContext);
/** True inside a sheet, where an absolutely positioned popover would be clipped by the scrolling body. */
const InSheetContext = createContext(false);

export function Sheet({
  open,
  onClose,
  title,
  kind = "sheet",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  kind?: "sheet" | "dialog";
  footer?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedOnScrim = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the field marked autoFocus, else the panel itself, so the close button is not pre-focused.
      const target = dialog.querySelector<HTMLElement>("[autofocus]") ?? dialog.querySelector<HTMLElement>(".bos-sheet__panel");
      target?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="bos-sheet"
      data-kind={kind}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        pressedOnScrim.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        // Close on a press that starts and ends on the scrim, not on a text drag released over it.
        if (event.target === event.currentTarget && pressedOnScrim.current) onClose();
        pressedOnScrim.current = false;
      }}
    >
      {open ? (
        <SheetCloseContext.Provider value={onClose}>
          <InSheetContext.Provider value={true}>
            <div className="bos-sheet__panel" tabIndex={-1}>
              <span className="bos-sheet__grab" aria-hidden />
              <header className="bos-sheet__head">
                <h2 id={titleId} className="bos-sheet__title">
                  {title}
                </h2>
                <Button variant="ghost" iconOnly aria-label="Close" onClick={onClose}>
                  <CloseIcon />
                </Button>
              </header>
              <div className="bos-sheet__body">{children}</div>
              {footer ? <footer className="bos-sheet__foot">{footer}</footer> : null}
            </div>
          </InSheetContext.Provider>
        </SheetCloseContext.Provider>
      ) : null}
    </dialog>
  );
}

/** A button that owns its sheet. Server components pass the content as children. */
export function SheetButton({
  label,
  title,
  kind,
  footer,
  children,
  ...button
}: {
  label: ReactNode;
  title: ReactNode;
  kind?: "sheet" | "dialog";
  footer?: ReactNode;
  children: ReactNode;
} & Omit<Parameters<typeof Button>[0], "title" | "children" | "onClick">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button {...button} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title} kind={kind} footer={footer}>
        {children}
      </Sheet>
    </>
  );
}

/* ---------- Popover (sheet on phones) ---------- */

export function Popover({
  label,
  title,
  align = "start",
  children,
  buttonClassName,
  variant = "secondary",
  size,
  ariaLabel,
  iconOnly,
  buttonId,
}: {
  buttonId?: string;
  label: ReactNode;
  title: string;
  align?: "start" | "end";
  children: ReactNode;
  buttonClassName?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const phone = useIsMobile();
  const inSheet = useContext(InSheetContext);
  const mobile = phone || inSheet;
  const anchor = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open || mobile) return;
    function onPointer(event: PointerEvent) {
      if (anchor.current && !anchor.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Swallow it so an enclosing sheet does not close too.
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        anchor.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, mobile]);

  useEffect(() => {
    if (!open || mobile) return;
    anchor.current?.querySelector<HTMLElement>(`#${CSS.escape(panelId)} a, #${CSS.escape(panelId)} button, #${CSS.escape(panelId)} input, #${CSS.escape(panelId)} select`)?.focus();
  }, [open, mobile, panelId]);

  return (
    <div className="bos-pop-anchor" ref={anchor}>
      <Button
        id={buttonId}
        variant={variant}
        size={size}
        iconOnly={iconOnly}
        className={buttonClassName}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </Button>
      {open && !mobile ? (
        <SheetCloseContext.Provider value={close}>
          <div id={panelId} className="bos-pop" data-align={align} role="dialog" aria-label={title}>
            {children}
          </div>
        </SheetCloseContext.Provider>
      ) : null}
      {mobile ? (
        <Sheet open={open} onClose={close} title={title}>
          {children}
        </Sheet>
      ) : null}
    </div>
  );
}

export function MenuLink({ href, children, current, icon }: { href: string; children: ReactNode; current?: boolean; icon?: ReactNode }) {
  return (
    <a className="bos-menu-item" href={href} role="menuitemradio" aria-checked={current ?? false}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </a>
  );
}

/* ---------- Toast ---------- */

type Toast = { id: number; tone: "ok" | "bad"; text: string };
type ToastApi = (text: string, tone?: "ok" | "bad") => void;

const ToastContext = createContext<ToastApi>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const push = useCallback<ToastApi>((text, tone = "ok") => {
    counter.current += 1;
    const id = counter.current;
    setToasts((list) => [...list.slice(-2), { id, tone, text }]);
    window.setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), tone === "bad" ? 7000 : 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="bos-toasts" aria-live="polite" role="status">
        {toasts.map((toast) => (
          <div key={toast.id} className={cx("bos-toast")} data-tone={toast.tone}>
            {toast.tone === "ok" ? <CheckCircleIcon /> : <XCircleIcon />}
            <span className="min-w-0 flex-1">{toast.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
