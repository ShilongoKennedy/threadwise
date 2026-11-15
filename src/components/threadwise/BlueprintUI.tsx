import { useEffect, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function bpButtonClass({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}) {
  return cn(
    "bp-button",
    `bp-button--${variant}`,
    `bp-button--${size}`,
    block && "bp-button--block",
    className,
  );
}

export function BPButton({
  variant = "primary",
  size = "md",
  block = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}) {
  return (
    <button className={bpButtonClass({ variant, size, block, className })} {...props}>
      {children}
    </button>
  );
}

export function BPCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bp-card", className)} {...props}>
      {children}
    </div>
  );
}

export function BPCardHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bp-card__header">
      <div>
        {eyebrow ? <p className="bp-card__eyebrow">{eyebrow}</p> : null}
        {title ? <p className="bp-card__title">{title}</p> : null}
      </div>
      {action ? <div className="bp-card__action">{action}</div> : null}
    </div>
  );
}

export function BPCardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bp-card__body", className)} {...props}>
      {children}
    </div>
  );
}

export function BPCardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bp-card__footer", className)} {...props}>
      {children}
    </div>
  );
}

export function BPField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("bp-field", className)}>
      <span className="bp-field__label">{label}</span>
      {children}
      {hint ? <span className="bp-field__hint">{hint}</span> : null}
    </label>
  );
}

export function BPBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("bp-badge", className)}>{children}</span>;
}

export function BPEmptyState({
  eyebrow,
  title,
  body,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bp-empty", className)}>
      {eyebrow ? <p className="bp-empty__eyebrow">{eyebrow}</p> : null}
      <h2 className="bp-empty__title">{title}</h2>
      {body ? <p className="bp-empty__body">{body}</p> : null}
      {action ? <div className="bp-empty__action">{action}</div> : null}
      {children}
    </section>
  );
}

export function BPRecordRow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bp-row", className)} {...props}>
      {children}
    </div>
  );
}


export function ReadingFocusToggle({ className }: { className?: string }) {
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    const enabled = window.localStorage.getItem("threadwise:reading-focus") === "1";
    setFocus(enabled);
    document.documentElement.classList.toggle("reading-focus", enabled);
  }, []);

  const toggle = () => {
    const next = !focus;
    setFocus(next);
    document.documentElement.classList.toggle("reading-focus", next);
    window.localStorage.setItem("threadwise:reading-focus", next ? "1" : "0");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={focus}
      className={cn("bp-button bp-button--secondary bp-button--sm", className)}
    >
      {focus ? "Exit focus" : "Focus mode"}
    </button>
  );
}

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / max)));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden="true">
      <span style={{ width: `${progress * 100}%` }} />
    </div>
  );
}


export function ReadingCallout({
  eyebrow,
  title,
  children,
  tone = "claim",
  className,
}: {
  eyebrow: string;
  title?: string;
  children: ReactNode;
  tone?: "claim" | "counter" | "evidence" | "falsifier";
  className?: string;
}) {
  return (
    <aside className={cn("reading-callout", `reading-callout--${tone}`, className)}>
      <p className="reading-callout__eyebrow">{eyebrow}</p>
      {title ? <p className="reading-callout__title">{title}</p> : null}
      <div className="reading-callout__body">{children}</div>
    </aside>
  );
}


export function ReadingSection({
  id,
  number,
  eyebrow,
  title,
  aside,
  children,
  className,
}: {
  id?: string;
  number: string;
  eyebrow: string;
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("reading-section", className)}>
      <div className="reading-section__head">
        <div className="reading-section__meta">
          <span className="reading-section__number">{number}</span>
          <span className="reading-section__eyebrow">{eyebrow}</span>
        </div>
        {aside ? <div className="reading-section__aside">{aside}</div> : null}
      </div>
      {title ? <h2 className="reading-section__title">{title}</h2> : null}
      <div className="reading-section__rule" />
      <div className="reading-section__body">{children}</div>
    </section>
  );
}
