import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { BellIcon, CheckIcon, XIcon } from "../icons";

type Tone = "success" | "error" | "info";

interface ToastOptions {
  tone?: Tone;
  action?: { label: string; onClick: () => void };
  duration?: number;
  key?: string;
}

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
  action?: ToastOptions["action"];
  key?: string;
  duration: number;
  pulse: number;
  shownAt: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

const EXIT_GAP_MS = 160;
const ERROR_PROTECT_MS = 2500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });

  const currentRef = useRef<ToastItem | null>(null);
  const queued = useRef<ToastItem | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const remaining = useRef(0);
  const startedAt = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  const dismiss = useCallback(() => {
    clearTimer();
    currentRef.current = null;
    setCurrent(null);
    setPaused(false);
    setDrag({ x: 0, y: 0 });

    const next = queued.current;
    queued.current = null;

    if (next) {
      window.setTimeout(() => present(next), EXIT_GAP_MS);
    }
  }, []);

  function arm(ms: number) {
    clearTimer();
    remaining.current = ms;
    startedAt.current = Date.now();
    timer.current = window.setTimeout(dismiss, ms);
  }

  function present(item: ToastItem) {
    currentRef.current = item;
    setCurrent(item);
    arm(item.duration);
  }

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const tone = options.tone ?? "success";

      const reading = Math.min(
        6500,
        Math.max(2600, 1800 + message.length * 45)
      );

      const duration =
        options.duration ??
        (options.action || tone === "error"
          ? Math.max(5000, reading)
          : reading);

      const now = Date.now();

      const item: ToastItem = {
        id: nextId++,
        message,
        tone,
        action: options.action,
        key: options.key,
        duration,
        pulse: 0,
        shownAt: now,
      };

      const cur = currentRef.current;

      if (cur) {
        if (
          (options.key && cur.key === options.key) ||
          cur.message === message
        ) {
          const updated: ToastItem = {
            ...cur,
            message,
            tone,
            action: options.action,
            key: options.key ?? cur.key,
            duration,
            pulse: cur.pulse + 1,
          };

          currentRef.current = updated;
          setCurrent(updated);
          arm(duration);
          return;
        }

        if (
          cur.tone === "error" &&
          tone !== "error" &&
          now - cur.shownAt < ERROR_PROTECT_MS
        ) {
          queued.current = item;
          return;
        }
      }

      queued.current = null;
      present(item);
    },
    []
  );

  useEffect(() => {
    return () => clearTimer();
  }, []);

  function pause() {
    if (!currentRef.current || timer.current === undefined) return;

    remaining.current = Math.max(
      1200,
      remaining.current - (Date.now() - startedAt.current)
    );

    clearTimer();
    setPaused(true);
  }

  function resume() {
    if (!currentRef.current) return;

    setPaused(false);
    arm(remaining.current || 2000);
  }

  function onTouchStart(e: TouchEvent<HTMLDivElement>) {
    const t0 = e.touches[0];

    if (t0) {
      touch.current = {
        x: t0.clientX,
        y: t0.clientY,
      };
    }

    pause();
  }

  function onTouchMove(e: TouchEvent<HTMLDivElement>) {
    const t0 = e.touches[0];

    if (!t0 || !touch.current) return;

    setDrag({
      x: t0.clientX - touch.current.x,
      y: Math.max(0, t0.clientY - touch.current.y),
    });
  }

  function onTouchEnd() {
    const far = Math.abs(drag.x) > 80 || drag.y > 40;

    touch.current = null;

    if (far) {
      dismiss();
    } else {
      setDrag({ x: 0, y: 0 });
      resume();
    }
  }

  const value = useMemo(
    () => ({
      show,
      dismiss,
    }),
    [show, dismiss]
  );

  const isError = current?.tone === "error";

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-4"
        style={{
          bottom:
            "calc(env(safe-area-inset-bottom, 0px) + var(--nav-h, 0px) + var(--toast-offset, 16px))",
        }}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
      >
        {current && (
          <div
            key={current.id}
            className="toast-in pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-elevated shadow-xl shadow-black/50"
            style={{
              transform:
                drag.x || drag.y
                  ? `translate(${drag.x}px, ${drag.y}px)`
                  : undefined,
              opacity:
                drag.x || drag.y
                  ? Math.max(
                      0.3,
                      1 - (Math.abs(drag.x) + drag.y) / 240
                    )
                  : undefined,
              transition: touch.current
                ? "none"
                : "transform 0.2s, opacity 0.2s",
            }}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onFocus={pause}
            onBlur={resume}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex items-center gap-3 py-2.5 pl-4 pr-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  current.tone === "error"
                    ? "bg-danger/15 text-danger"
                    : current.tone === "info"
                      ? "bg-primary-soft text-primary-text"
                      : "bg-success/15 text-success"
                }`}
              >
                {current.tone === "error" ? (
                  <XIcon width={14} height={14} />
                ) : current.tone === "info" ? (
                  <BellIcon width={14} height={14} />
                ) : (
                  <CheckIcon width={14} height={14} />
                )}
              </span>

              <p
                key={current.pulse}
                className={`line-clamp-2 min-w-0 flex-1 text-sm ${
                  current.pulse ? "pop" : ""
                }`}
              >
                {current.message}
              </p>

              {current.action && (
                <button
                  onClick={() => {
                    current.action?.onClick();
                    dismiss();
                  }}
                  className="press h-9 shrink-0 rounded-lg px-3 text-sm font-bold text-primary-text hover:bg-bg/40"
                >
                  {current.action.label}
                </button>
              )}

              {isError && !current.action && (
                <button
                  onClick={dismiss}
                  aria-label="Fechar"
                  className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:text-ink"
                >
                  <XIcon width={16} height={16} />
                </button>
              )}
            </div>

            {current.action && (
              <span
                key={`${current.id}-${current.pulse}`}
                aria-hidden="true"
                className="toast-progress block h-0.5 origin-left bg-primary/70"
                style={{
                  animationDuration: `${current.duration}ms`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return ctx;
}

export function useBottomBarOffset(
  active: boolean,
  heightPx = 88
) {
  useEffect(() => {
    if (!active) return;

    document.documentElement.style.setProperty(
      "--toast-offset",
      `${heightPx + 8}px`
    );

    return () => {
      document.documentElement.style.removeProperty("--toast-offset");
    };
  }, [active, heightPx]);
}
