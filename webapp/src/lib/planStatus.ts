export type PlanStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'DRAFT'
  | 'REVISION_REQUIRED'
  | 'COMPLETED';

export interface OverallPlanSummary {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  revisionNotes: string | null;
  updatedAt: string;
  createdBy: { id: string; displayName: string } | null;
  approvedBy: { id: string; displayName: string } | null;
  _count: { tasks: number };
}

export const mapPlanStatus = (plan: { status: string } | null | undefined): PlanStatus => {
  if (!plan) return 'DRAFT';
  switch (plan.status) {
    case 'PENDING_APPROVAL':
      return 'PENDING_APPROVAL';
    case 'APPROVED':
      return 'APPROVED';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'REJECTED':
      return 'REVISION_REQUIRED';
    default:
      return 'DRAFT';
  }
};
