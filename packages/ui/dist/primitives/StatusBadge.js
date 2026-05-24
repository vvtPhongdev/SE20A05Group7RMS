import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from './Badge';
const STATUS_VARIANTS = {
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
function formatLabel(status) {
    return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
export function StatusBadge({ status, className }) {
    const variant = STATUS_VARIANTS[status] ?? 'default';
    return (_jsx(Badge, { variant: variant, className: className, children: formatLabel(status) }));
}
//# sourceMappingURL=StatusBadge.js.map