import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
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
