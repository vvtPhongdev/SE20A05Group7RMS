import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DRAFT' | 'REVISION_REQUIRED';

interface Campaign {
  id: string;
  position: string;
  department: string;
  headcount: number;
  status: PlanStatus;
  window: string;
  progress: number;
}

interface CampaignDetail {
  id: string;
  position: string;
  department: string;
  headcount: number;
  status: PlanStatus;
  window: string;
  owner: string;
  ownerAvatar: string;
  budget: string;
  taskCount: number;
  adminNote: {
    author: string;
    timestamp: string;
    message: string;
  };
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const metricCards = [
  { label: 'Plans Draft', value: 12, tone: 'draft' as const },
  { label: 'Pending Approval', value: 4, tone: 'pending' as const },
  { label: 'Approved Active', value: 8, tone: 'approved' as const },
  { label: 'Revision Required', value: 2, tone: 'revision' as const },
];

const campaigns: Campaign[] = [
  {
    id: '#REQ-2024-041',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    headcount: 2,
    status: 'PENDING_APPROVAL',
    window: 'Oct 15 - Nov 30',
    progress: 30,
  },
  {
    id: '#REQ-2024-038',
    position: 'Product Marketing Manager',
    department: 'Marketing',
    headcount: 1,
    status: 'APPROVED',
    window: 'Oct 01 - Nov 15',
    progress: 65,
  },
  {
    id: '#REQ-2024-045',
    position: 'UX Researcher',
    department: 'Design',
    headcount: 1,
    status: 'DRAFT',
    window: 'TBD',
    progress: 10,
  },
  {
    id: '#REQ-2024-032',
    position: 'Sales Director - EMEA',
    department: 'Sales',
    headcount: 1,
    status: 'REVISION_REQUIRED',
    window: 'Sep 15 - Oct 31',
    progress: 45,
  },
];

const campaignDetails: Record<string, CampaignDetail> = {
  '#REQ-2024-041': {
    id: '#REQ-2024-041',
    position: 'Senior Backend Engineer',
    department: 'Engineering',
    headcount: 2,
    status: 'PENDING_APPROVAL',
    window: 'Oct 15 - Nov 30, 2024',
    owner: 'Sarah Jenkins',
    ownerAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTPNKFDlI3GXrlxJ00Ibva3QZxQ8YjlE2o0frtaVYzIsd4Y9kWcuBHdPh6Y97PIvvUAjB0oFPG9PrwlKI1KmxEWLBY09glrwepy5NEAfcIjwsRn2MIPAbNzK-MWp6QRG4FNc4klkWiDAoalJ1zWiU9Up_6z1aa8Pm3v86zf3gs4E_8dPJSDkri8YO-XqqSC5uYB_9oV4qsiT9y4fLHA74d9gtnDogICLu5h3szNUzdnCzMSa5aASp4coH1CvlpA0eYOLXpj8rhDD8',
    budget: '$15,000',
    taskCount: 14,
    adminNote: {
      author: 'David Chen (Admin)',
      timestamp: 'Yesterday, 2:30 PM',
      message:
        '"Please ensure the technical screening phase includes the new security compliance module before submitting for final approval."',
    },
  },
  '#REQ-2024-038': {
    id: '#REQ-2024-038',
    position: 'Product Marketing Manager',
    department: 'Marketing',
    headcount: 1,
    status: 'APPROVED',
    window: 'Oct 01 - Nov 15, 2024',
    owner: 'Sarah Jenkins',
    ownerAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTPNKFDlI3GXrlxJ00Ibva3QZxQ8YjlE2o0frtaVYzIsd4Y9kWcuBHdPh6Y97PIvvUAjB0oFPG9PrwlKI1KmxEWLBY09glrwepy5NEAfcIjwsRn2MIPAbNzK-MWp6QRG4FNc4klkWiDAoalJ1zWiU9Up_6z1aa8Pm3v86zf3gs4E_8dPJSDkri8YO-XqqSC5uYB_9oV4qsiT9y4fLHA74d9gtnDogICLu5h3szNUzdnCzMSa5aASp4coH1CvlpA0eYOLXpj8rhDD8',
    budget: '$8,500',
    taskCount: 10,
    adminNote: {
      author: 'David Chen (Admin)',
      timestamp: '3 days ago, 10:15 AM',
      message: '"Campaign approved. Proceed with job posting and CV collection phases immediately."',
    },
  },
  '#REQ-2024-045': {
    id: '#REQ-2024-045',
    position: 'UX Researcher',
    department: 'Design',
    headcount: 1,
    status: 'DRAFT',
    window: 'TBD',
    owner: 'Sarah Jenkins',
    ownerAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTPNKFDlI3GXrlxJ00Ibva3QZxQ8YjlE2o0frtaVYzIsd4Y9kWcuBHdPh6Y97PIvvUAjB0oFrtaVYzIsd4Y9kWcuBHdPh6Y97PIvvUAjB0oFPG9PrwlKI1KmxEWLBY09glrwepy5NEAfcIjwsRn2MIPAbNzK-MWp6QRG4FNc4klkWiDAoalJ1zWiU9Up_6z1aa8Pm3v86zf3gs4E_8dPJSDkri8YO-XqqSC5uYB_9oV4qsiT9y4fLHA74d9gtnDogICLu5h3szNUzdnCzMSa5aASp4coH1CvlpA0eYOLXpj8rhDD8',
    budget: '$6,000',
    taskCount: 6,
    adminNote: {
      author: 'David Chen (Admin)',
      timestamp: 'N/A',
      message: '"Draft plan not yet submitted for review."',
    },
  },
  '#REQ-2024-032': {
    id: '#REQ-2024-032',
    position: 'Sales Director - EMEA',
    department: 'Sales',
    headcount: 1,
    status: 'REVISION_REQUIRED',
    window: 'Sep 15 - Oct 31, 2024',
    owner: 'Sarah Jenkins',
    ownerAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTPNKFDlI3GXrlxJ00Ibva3QZxQ8YjlE2o0frtaVYzIsd4Y9kWcuBHdPh6Y97PIvvUAjB0oFPG9PrwlKI1KmxEWLBY09glrwepy5NEAfcIjwsRn2MIPAbNzK-MWp6QRG4FNc4klkWiDAoalJ1zWiU9Up_6z1aa8Pm3v86zf3gs4E_8dPJSDkri8YO-XqqSC5uYB_9oV4qsiT9y4fLHA74d9gtnDogICLu5h3szNUzdnCzMSa5aASp4coH1CvlpA0eYOLXpj8rhDD8',
    budget: '$22,000',
    taskCount: 18,
    adminNote: {
      author: 'David Chen (Admin)',
      timestamp: '2 days ago, 4:00 PM',
      message:
        '"The salary range listed does not align with the approved headcount budget. Please revise and resubmit."',
    },
  },
};

// ─── Status Helpers ───────────────────────────────────────────────────────────

const statusConfig: Record<
  PlanStatus,
  { label: string; dot: string; badge: string }
> = {
  PENDING_APPROVAL: {
    label: 'PENDING_APPROVAL',
    dot: 'bg-pending',
    badge: 'bg-pending/10 text-pending border border-pending/20',
  },
  APPROVED: {
    label: 'APPROVED',
    dot: 'bg-approved',
    badge: 'bg-approved/10 text-approved border border-approved/20',
  },
  DRAFT: {
    label: 'DRAFT',
    dot: 'bg-draft',
    badge: 'bg-draft/10 text-draft border border-draft/20',
  },
  REVISION_REQUIRED: {
    label: 'REVISION_REQUIRED',
    dot: 'bg-revision',
    badge: 'bg-revision/10 text-revision border border-revision/20',
  },
};

const progressBarColor: Record<PlanStatus, string> = {
  PENDING_APPROVAL: 'bg-pending',
  APPROVED: 'bg-approved',
  DRAFT: 'bg-draft',
  REVISION_REQUIRED: 'bg-revision',
};

const metricToneClasses: Record<string, { label: string; dot: string; value: string }> = {
  draft: { label: 'text-draft', dot: 'bg-draft', value: 'text-deep-charcoal' },
  pending: { label: 'text-pending', dot: 'bg-pending', value: 'text-deep-charcoal' },
  approved: { label: 'text-approved', dot: 'bg-approved', value: 'text-deep-charcoal' },
  revision: { label: 'text-revision', dot: 'bg-revision', value: 'text-deep-charcoal' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: PlanStatus }> = ({ status }) => {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const HRCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>('#REQ-2024-041');
  const searchQuery = '';

  const detail = selectedId ? campaignDetails[selectedId] : null;

  const filtered = campaigns.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  });

  const handleRowClick = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const closeDrawer = () => setSelectedId(null);

  return (
    /* Escape the Layout's p-8 so we can control our own padding */
    <div className="-m-8 flex min-h-full">
      {/* ── Main scrollable area ────────────────────────────────────────── */}
      <div className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${detail ? 'mr-[400px]' : ''}`}>
        {/* Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-deep-charcoal mb-1">
              Recruitment Campaigns
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Build and maintain Overall Plans for Admin-approved recruitment requests.
            </p>
          </div>
          <button className="bg-teal-command text-white px-4 py-2.5 font-label-md text-label-md hover:bg-teal-700 transition-colors flex items-center gap-2 rounded-lg">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Create Overall Plan
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {metricCards.map((card) => {
            const tone = metricToneClasses[card.tone];
            return (
              <div
                key={card.label}
                className="bg-clean-surface border border-border-warm p-6 flex flex-col rounded-lg"
              >
                <span
                  className={`font-label-sm text-label-sm ${tone.label} uppercase tracking-wider mb-2 flex items-center gap-1`}
                >
                  <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                  {card.label}
                </span>
                <span className="font-headline-xl text-headline-xl text-deep-charcoal mt-auto">
                  {card.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Table Card */}
        <div className="bg-clean-surface border border-border-warm overflow-hidden flex flex-col rounded-lg">
          {/* Table Header */}
          <div className="px-6 py-3 border-b border-border-warm bg-workflow-ivory/50 flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-deep-charcoal">
              Active Campaigns
            </h3>
            <div className="flex gap-2">
              <button className="p-1.5 text-on-surface-variant hover:text-teal-command rounded transition-colors">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </button>
              <button className="p-1.5 text-on-surface-variant hover:text-teal-command rounded transition-colors">
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-workflow-ivory border-b border-border-warm z-10">
                <tr>
                  {['Request ID', 'Position', 'Department', 'HC', 'Plan Status', 'Campaign Window', 'Progress'].map(
                    (col) => (
                      <th
                        key={col}
                        className="py-3 px-4 first:pl-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filtered.map((campaign) => {
                  const isSelected = selectedId === campaign.id;
                  return (
                    <tr
                      key={campaign.id}
                      onClick={() => handleRowClick(campaign.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-teal-command/5 hover:bg-teal-command/10'
                          : 'hover:bg-workflow-ivory'
                      }`}
                    >
                      <td
                        className={`py-3 px-4 pl-6 font-data-mono text-data-mono ${
                          isSelected ? 'text-teal-command' : 'text-slate-ink'
                        }`}
                      >
                        {campaign.id}
                      </td>
                      <td className="py-3 px-4 font-body-sm text-body-sm text-deep-charcoal font-semibold">
                        {campaign.position}
                      </td>
                      <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                        {campaign.department}
                      </td>
                      <td className="py-3 px-4 font-data-mono text-data-mono text-on-surface-variant">
                        {campaign.headcount}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">
                        {campaign.window}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden w-24">
                            <div
                              className={`h-full ${progressBarColor[campaign.status]} rounded-full`}
                              style={{ width: `${campaign.progress}%` }}
                            />
                          </div>
                          <span className="font-data-mono text-data-mono text-on-surface-variant text-[12px]">
                            {campaign.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-on-surface-variant">
                      No campaigns match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3 border-t border-border-warm bg-workflow-ivory/50 flex justify-between items-center text-sm text-on-surface-variant">
            <span>Showing {filtered.length} of {campaigns.length} entries</span>
            <div className="flex gap-1">
              <button className="p-1 border border-border-warm rounded bg-clean-surface hover:bg-surface-variant disabled:opacity-50 transition-colors">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button className="p-1 border border-border-warm rounded bg-clean-surface hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Details Drawer (fixed to viewport right) ────────────── */}
      <aside
        className={`fixed top-[60px] right-0 bottom-0 bg-clean-surface border-l border-border-warm shadow-[-4px_0_24px_rgba(0,0,0,0.06)] flex flex-col transform transition-all duration-300 z-30 w-[400px] ${
          detail ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {detail && (
          <>
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-border-warm flex justify-between items-center bg-workflow-ivory/30 flex-shrink-0">
              <div>
                <span className="font-data-mono text-data-mono text-teal-command text-sm">
                  {detail.id}
                </span>
                <h3 className="font-headline-md text-headline-md text-deep-charcoal">
                  Campaign Details
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 text-on-surface-variant hover:text-deep-charcoal rounded-full hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Position Info */}
              <div>
                <h2 className="font-headline-lg text-headline-lg text-deep-charcoal mb-1">
                  {detail.position}
                </h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {detail.department} Dept.
                  </span>
                  <span className="text-on-surface-variant opacity-40">•</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    Headcount: {detail.headcount}
                  </span>
                </div>
                <StatusBadge status={detail.status} />
              </div>

              {/* Warning callout — only for PENDING_APPROVAL */}
              {detail.status === 'PENDING_APPROVAL' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">
                    lock
                  </span>
                  <div>
                    <p className="font-label-sm text-label-sm text-amber-800 font-semibold mb-0.5">
                      Plan-locked
                    </p>
                    <p className="text-[12px] text-amber-700 leading-tight">
                      Execution stays locked until Admin approves the plan. Tasks cannot be
                      activated.
                    </p>
                  </div>
                </div>
              )}

              {/* Revision callout */}
              {detail.status === 'REVISION_REQUIRED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">
                    edit_note
                  </span>
                  <div>
                    <p className="font-label-sm text-label-sm text-amber-800 font-semibold mb-0.5">
                      Revision Required
                    </p>
                    <p className="text-[12px] text-amber-700 leading-tight">
                      Admin has requested changes. Review the notes below and resubmit.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Campaign Window
                  </span>
                  <span className="font-body-sm text-body-sm text-deep-charcoal font-semibold">
                    {detail.window}
                  </span>
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Owner
                  </span>
                  <div className="flex items-center gap-2">
                    <img
                      alt="Owner"
                      className="w-5 h-5 rounded-full"
                      src={detail.ownerAvatar}
                    />
                    <span className="font-body-sm text-body-sm text-deep-charcoal">
                      {detail.owner}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Budget Allocation
                  </span>
                  <span className="font-data-mono text-data-mono text-deep-charcoal">
                    {detail.budget}
                  </span>
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Task Count
                  </span>
                  <span className="font-body-sm text-body-sm text-deep-charcoal flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-teal-command">
                      checklist
                    </span>
                    {detail.taskCount} Tasks configured
                  </span>
                </div>
              </div>

              <hr className="border-border-warm" />

              {/* Admin Notes */}
              <div>
                <h4 className="font-label-md text-label-md text-deep-charcoal font-semibold mb-2">
                  Admin Notes (Latest)
                </h4>
                <div className="bg-workflow-ivory border border-border-warm rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-sm text-label-sm text-deep-charcoal font-semibold">
                      {detail.adminNote.author}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {detail.adminNote.timestamp}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                    {detail.adminNote.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-border-warm bg-workflow-ivory/50 flex flex-col gap-3 flex-shrink-0">
              {detail.status !== 'APPROVED' && (
                <button className="w-full bg-teal-command text-white font-label-md text-label-md py-2.5 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {detail.status === 'REVISION_REQUIRED' ? 'Resubmit for Approval' : 'Submit for Approval'}
                </button>
              )}
              <div className="flex gap-3">
                <button className="flex-1 bg-transparent border border-teal-command text-teal-command font-label-md text-label-md py-2 hover:bg-teal-command/5 transition-colors rounded-lg">
                  Edit Plan
                </button>
                <button
                  onClick={() => navigate(`/hr/campaigns/${encodeURIComponent(detail.id.replace('#', ''))}`)}
                  className="flex-1 text-teal-command font-label-md text-label-md py-2 hover:underline flex items-center justify-center gap-1 rounded-lg"
                >
                  Open Detail{' '}
                  <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};
