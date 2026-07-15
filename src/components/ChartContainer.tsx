"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  Component,
  type ErrorInfo,
  type ReactElement,
} from "react";

type Size = { width: number; height: number };

type Props = {
  height: number;
  className?: string;
  children: (size: Size) => ReactNode;
};

function fallbackWidth(): number {
  if (typeof window === "undefined") return 320;
  return Math.max(280, Math.floor(window.innerWidth - 48));
}

/**
 * Always mounts the chart with a non-zero width.
 * Prefers the container's clientWidth; falls back to the viewport
 * (mobile Safari / flex+RTL often report 0 on first measure).
 */
export function ChartContainer({ height, className = "", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallbackWidth);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const measured =
        el.clientWidth ||
        el.getBoundingClientRect().width ||
        el.parentElement?.clientWidth ||
        0;
      const next = Math.floor(measured) || fallbackWidth();
      setWidth(Math.max(next, 280));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const t1 = window.setTimeout(update, 100);
    const t2 = window.setTimeout(update, 400);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`mt-4 w-full min-w-0 overflow-x-auto outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none ${className}`.trim()}
      style={{ height, maxWidth: "100%" }}
      dir="ltr"
    >
      {children({ width, height })}
    </div>
  );
}

type BoundaryProps = { children: ReactElement; label: string };
type BoundaryState = { error: Error | null };

export class ChartErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[chart:${this.props.label}]`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <p className="mt-4 text-sm text-coral">
          שגיאה בטעינת הגרף: {this.state.error.message}
        </p>
      );
    }
    return this.props.children;
  }
}
