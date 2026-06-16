import React from 'react';
import { cn } from '@/lib/utils';

export type HRStatusTone = 'teal' | 'approved' | 'pending' | 'revision' | 'rejected' | 'slate';

const toneClasses: Record<HRStatusTone, string> = {
  teal: 'border-teal-command/20 bg-teal-command/10 text-teal-command',
  approved: 'border-green-200 bg-green-50 text-approved',
  pending: 'border-cyan-200 bg-cyan-50 text-pending',
  revision: 'border-amber-200 bg-amber-50 text-revision',
  rejected: 'border-red-200 bg-red-50 text-rejected',
  slate: 'border-stone-200 bg-stone-100 text-slate-ink',
};

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />
  </svg>
);

export const HRDashboardPage = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn('mx-auto flex max-w-[1440px] flex-col gap-6', className)}>{children}</div>;

export const HRPageHeader = ({
  actions,
  eyebrow = 'HR Management',
  title,
  description,
}: {
  actions?: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
}) => (
  <header className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">{title}</h1>
      {description ? (
        <p className="mt-1 max-w-[70ch] text-sm leading-6 text-slate-ink">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
  </header>
);

export const HRCard = ({
  children,
  className,
  as: Component = 'section',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'section' | 'article' | 'div';
}) => (
  <Component
    className={cn(
      'rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]',
      className,
    )}
  >
    {children}
  </Component>
);

export const HRInlineAlert = ({
  children,
  tone = 'rejected',
}: {
  children: React.ReactNode;
  tone?: HRStatusTone;
}) => (
  <div
    className={cn(
      'rounded-lg border px-4 py-3 text-sm font-semibold',
      toneClasses[tone],
    )}
  >
    {children}
  </div>
);

export const HRLoadingState = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="rounded-lg border border-border-warm bg-clean-surface px-4 py-3 text-sm text-on-surface-variant">
    {label}
  </div>
);

export const HREmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) => (
  <section className="rounded-lg border border-border-warm bg-clean-surface px-6 py-12 text-center">
    <p className="text-sm font-semibold text-deep-charcoal">{title}</p>
    {description ? <p className="mt-1 text-sm text-slate-ink">{description}</p> : null}
  </section>
);

export const HRSearchInput = ({
  label,
  onChange,
  placeholder,
  value,
  className,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  className?: string;
}) => (
  <label className={cn('relative block', className)}>
    <span className="sr-only">{label}</span>
    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
    <input
      className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-3 text-sm text-deep-charcoal outline-none transition placeholder:text-on-surface-variant focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="search"
      value={value}
    />
  </label>
);

export const HRSelectControl = ({
  label,
  onChange,
  options,
  value,
  className,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
  className?: string;
}) => (
  <label className={cn('flex flex-col gap-1.5', className)}>
    <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
    <select
      className="h-10 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export const HRStatusBadge = ({
  children,
  tone = 'slate',
  className,
}: {
  children: React.ReactNode;
  tone?: HRStatusTone;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex rounded-full border px-2.5 py-1 text-xs font-bold',
      toneClasses[tone],
      className,
    )}
  >
    {children}
  </span>
);

export const HRActionButton = ({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
}) => (
  <button
    className={cn(
      'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98]',
      variant === 'primary'
        ? 'bg-teal-command text-white hover:bg-primary'
        : 'border border-border-warm bg-clean-surface text-slate-ink hover:border-teal-command hover:text-teal-command',
    )}
    onClick={onClick}
    type={type}
  >
    {children}
  </button>
);
