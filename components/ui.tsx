import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* Shared building blocks. Colors come from the theme tokens in globals.css,
   so each piece re-themes under data-theme="classical" / "contemporary". */

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

type ButtonVariant = "primary" | "outline" | "outline-on-deep" | "light";
type ButtonSize = "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold uppercase whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-button text-on-button hover:bg-button-hover",
  outline: "border border-rule text-accent hover:border-button hover:bg-button hover:text-on-button",
  "outline-on-deep": "border border-on-deep/40 text-on-deep hover:border-on-deep hover:bg-on-deep hover:text-deep",
  light: "bg-white text-brand hover:bg-hero-ink", // on the hero photo
};

const buttonSizes: Record<ButtonSize, string> = {
  md: "h-10 px-5 text-xs tracking-[0.16em]",
  lg: "h-14 px-10 text-sm tracking-[0.2em]",
};

type ButtonStyleProps = { variant?: ButtonVariant; size?: ButtonSize };

function buttonClass({ variant = "primary", size = "lg" }: ButtonStyleProps, className?: string) {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & ButtonStyleProps) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}

const headlineSizes = {
  lg: "text-4xl sm:text-5xl lg:text-6xl",
  xl: "text-5xl sm:text-6xl lg:text-7xl",
};

type HeadlineProps = {
  as?: "h1" | "h2" | "h3";
  size?: keyof typeof headlineSizes;
  children: ReactNode;
  className?: string;
};

export function Headline({ as: Tag = "h2", size = "lg", children, className }: HeadlineProps) {
  return (
    <Tag
      className={cx(
        "font-extrabold uppercase leading-[0.95] tracking-tight text-balance",
        headlineSizes[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type SectionHeaderProps = {
  title: ReactNode;
  children?: ReactNode; // the short paragraph
  action?: ReactNode; // the section's one button
  className?: string;
};

export function SectionHeader({ title, children, action, className }: SectionHeaderProps) {
  return (
    <div className={cx("grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-16", className)}>
      <Headline>{title}</Headline>
      {(children || action) && (
        <div className="flex flex-col items-start gap-6">
          {children && <p className="max-w-xl text-lg leading-relaxed text-muted">{children}</p>}
          {action}
        </div>
      )}
    </div>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={cx("size-4", className)}>
      <path d="M3 10h13m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Five faint staff lines, used as decoration. */
export function StaffLines({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("pointer-events-none flex flex-col justify-between", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="block h-px w-full bg-current" />
      ))}
    </div>
  );
}
