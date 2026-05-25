import { Badge } from './Badge';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  // Readiness Labels
  READY_NOW: 'success',
  READY_WITH_SHORT_RAMP_UP: 'success',
  DOMAIN_SPECIALIST_WITH_TECH_GAP: 'warning',
  STRONG_FUNDAMENTALS_NEEDS_DOMAIN: 'warning',
  SIGNIFICANT_GAPS: 'danger',
  INSUFFICIENT_EVIDENCE: 'info',
  OUT_OF_SCOPE: 'default',

  // Document States
  PENDING: 'info',
  PROCESSING: 'warning',
  PARSED: 'success',
  FAILED_PARSE: 'danger',
  FAILED_VALIDATION: 'danger',

  // Application States
  DRAFT: 'default',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  EVALUATED: 'success',
  REJECTED: 'danger',
  SHORTLISTED: 'success',
  WITHDRAWN: 'default',
};

function formatLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] ?? 'default';
  return (
    <Badge variant={variant} className={className}>
      {formatLabel(status)}
    </Badge>
  );
}
