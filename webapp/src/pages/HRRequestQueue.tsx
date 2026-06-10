import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestUrgency = 'Critical' | 'High' | 'Normal' | 'Low';
type QueueStatus = 'PENDING' | 'UNDER_REVIEW' | 'FORWARDED' | 'RETURNED';

interface RecruitmentRequest {
  id: string;
  position: string;
  department: string;
  requestedBy: string;
  submittedDate: string;
  headcount: number;
  type: string;          // e.g. "Full-time", "Internship"
  budget: string;        // e.g. "₫25M/person"
  budgetLabel: string;   // e.g. "Monthly Budget", "Monthly Stipend"
  urgency: RequestUrgency;
  status: QueueStatus;
  justification: string;
  skillsRequired: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialRequests: RecruitmentRequest[] = [
  {
    id: '#REQ-2024-041',
    position: 'Senior Backend Engineer',
    department: 'IT Dept',
    requestedBy: 'Dr. Nguyen Van B.',
    submittedDate: 'May 27',
    headcount: 2,
    type: 'Full-time',
    budget: '₫25M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Critical',
    status: 'PENDING',
    justification: 'Critical backfill needed to support the upcoming microservice migration phase. The candidate will own database optimization and API gateway security compliance.',
    skillsRequired: ['Go', 'Rust', 'Kubernetes', 'gRPC'],
  },
  {
    id: '#REQ-2024-045',
    position: 'Product Designer',
    department: 'Design & UX Dept',
    requestedBy: 'Ms. Tran Thi C.',
    submittedDate: 'May 27',
    headcount: 1,
    type: 'Full-time',
    budget: '₫22M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'High',
    status: 'PENDING',
    justification: 'Required for applicant portal redesign. The designer will collaborate closely with engineering teams to conduct usability testings and design components.',
    skillsRequired: ['Figma', 'Design Systems', 'Usability Testing', 'Prototyping'],
  },
  {
    id: '#REQ-2024-049',
    position: 'Marketing Specialist',
    department: 'Marketing Dept',
    requestedBy: 'Mr. Vu Huy D.',
    submittedDate: 'May 26',
    headcount: 1,
    type: 'Full-time',
    budget: '₫18M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'PENDING',
    justification: 'Drive growth campaigns and manage social branding across local and regional channels.',
    skillsRequired: ['SEO', 'Content Writing', 'Google Ads', 'Analytics'],
  },
  {
    id: '#REQ-2024-052',
    position: 'HR Coordinator',
    department: 'Human Resources',
    requestedBy: 'Ms. Ly Minh E.',
    submittedDate: 'May 25',
    headcount: 1,
    type: 'Full-time',
    budget: '₫15M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'PENDING',
    justification: 'Manage onboarding documentation, interview scheduling coordination, and employee records maintenance.',
    skillsRequired: ['HR Administration', 'Onboarding', 'Communication', 'Scheduling'],
  },
  {
    id: '#REQ-2024-055',
    position: 'Data Analyst Intern',
    department: 'Data Intelligence',
    requestedBy: 'Mr. Pham Minh F.',
    submittedDate: 'May 24',
    headcount: 3,
    type: 'Internship',
    budget: '₫6M/person',
    budgetLabel: 'Monthly Stipend',
    urgency: 'Low',
    status: 'PENDING',
    justification: 'Support data cleaning and dashboard building for department performance reporting.',
    skillsRequired: ['SQL', 'Excel', 'Tableau', 'Data Cleaning'],
  },
  {
    id: '#REQ-2024-056',
    position: 'DevOps Engineer',
    department: 'Infrastructure',
    requestedBy: 'Mr. Hoang Van G.',
    submittedDate: 'May 28',
    headcount: 1,
    type: 'Full-time',
    budget: '₫28M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'High',
    status: 'PENDING',
    justification: 'Own CI/CD pipeline automation and maintain cloud orchestration infrastructure consistency.',
    skillsRequired: ['Terraform', 'AWS', 'Docker', 'Jenkins'],
  },
  {
    id: '#REQ-2024-057',
    position: 'Sales Development Representative',
    department: 'Sales & Growth',
    requestedBy: 'Mr. Le Huy H.',
    submittedDate: 'May 27',
    headcount: 2,
    type: 'Full-time',
    budget: '₫16M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'PENDING',
    justification: 'Outbound prospecting and lead generation to fuel enterprise sales pipelines.',
    skillsRequired: ['Lead Generation', 'Cold Calling', 'Salesforce', 'Negotiation'],
  },
  {
    id: '#REQ-2024-058',
    position: 'Office Administrator',
    department: 'Operations',
    requestedBy: 'Mrs. Doan Thu K.',
    submittedDate: 'May 26',
    headcount: 1,
    type: 'Full-time',
    budget: '₫12M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Low',
    status: 'PENDING',
    justification: 'Manage front desk, vendor coordination, and general facilities maintenance.',
    skillsRequired: ['Vendor Management', 'Office Software', 'Coordination'],
  },
  // Under Review Mock Requests
  {
    id: '#REQ-2024-039',
    position: 'Fullstack Developer',
    department: 'IT Dept',
    requestedBy: 'Dr. Nguyen Van B.',
    submittedDate: 'May 20',
    headcount: 1,
    type: 'Full-time',
    budget: '₫24M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'High',
    status: 'UNDER_REVIEW',
    justification: 'Required to build frontend dashboards and connect backend services for the RMS project.',
    skillsRequired: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  },
  {
    id: '#REQ-2024-040',
    position: 'Content Creator',
    department: 'Marketing Dept',
    requestedBy: 'Mr. Vu Huy D.',
    submittedDate: 'May 19',
    headcount: 1,
    type: 'Full-time',
    budget: '₫15M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'UNDER_REVIEW',
    justification: 'Create high-engagement visual assets and videos to support product marketing campaigns.',
    skillsRequired: ['Photoshop', 'Premiere Pro', 'Videography', 'Copywriting'],
  },
  {
    id: '#REQ-2024-042',
    position: 'Solutions Architect',
    department: 'Infrastructure',
    requestedBy: 'Mr. Hoang Van G.',
    submittedDate: 'May 21',
    headcount: 1,
    type: 'Full-time',
    budget: '₫35M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Critical',
    status: 'UNDER_REVIEW',
    justification: 'Design highly available, distributed cloud architecture matching security frameworks.',
    skillsRequired: ['AWS Certified', 'Enterprise Architecture', 'Terraform', 'Kubernetes'],
  },
  // Forwarded to Admin Mock Requests
  {
    id: '#REQ-2024-030',
    position: 'Security Auditor',
    department: 'Compliance',
    requestedBy: 'Mr. Tran Van X.',
    submittedDate: 'May 15',
    headcount: 1,
    type: 'Full-time',
    budget: '₫30M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'High',
    status: 'FORWARDED',
    justification: 'Verify regulatory compliance frameworks and run internal vulnerability auditing.',
    skillsRequired: ['CISSP', 'Network Security', 'ISO 27001', 'Penetration Testing'],
  },
  {
    id: '#REQ-2024-031',
    position: 'Product Owner',
    department: 'Product Strategy',
    requestedBy: 'Ms. Le Thi Y.',
    submittedDate: 'May 16',
    headcount: 1,
    type: 'Full-time',
    budget: '₫26M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'FORWARDED',
    justification: 'Define features backlog and coordinate sprint planning and releases across engineering pods.',
    skillsRequired: ['Agile', 'Scrum', 'Jira', 'Product Roadmap'],
  },
  {
    id: '#REQ-2024-033',
    position: 'Infrastructure Lead',
    department: 'Infrastructure',
    requestedBy: 'Mr. Hoang Van G.',
    submittedDate: 'May 17',
    headcount: 1,
    type: 'Full-time',
    budget: '₫40M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Critical',
    status: 'FORWARDED',
    justification: 'Team lead to direct infrastructural automation, scaling guidelines and disaster recovery.',
    skillsRequired: ['AWS', 'Orchestration', 'Leadership', 'CI/CD Automation'],
  },
  {
    id: '#REQ-2024-035',
    position: 'BI Engineer',
    department: 'Data Intelligence',
    requestedBy: 'Mr. Pham Minh F.',
    submittedDate: 'May 18',
    headcount: 1,
    type: 'Full-time',
    budget: '₫20M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'FORWARDED',
    justification: 'Build ETL pipelines and automate data sync warehouses for executive metrics tracking dashboards.',
    skillsRequired: ['ETL', 'SQL', 'Data Warehousing', 'PowerBI'],
  },
  {
    id: '#REQ-2024-037',
    position: 'Legal Specialist',
    department: 'Legal Operations',
    requestedBy: 'Mrs. Nguyen Thi L.',
    submittedDate: 'May 18',
    headcount: 1,
    type: 'Full-time',
    budget: '₫22M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Low',
    status: 'FORWARDED',
    justification: 'Review commercial contracts, vendor agreements and handle data protection compliance checks.',
    skillsRequired: ['Contract Law', 'GDPR', 'Corporate Governance', 'Legal Writing'],
  },
  // Returned Mock Requests
  {
    id: '#REQ-2024-025',
    position: 'Graphic Designer',
    department: 'Design & UX Dept',
    requestedBy: 'Ms. Tran Thi C.',
    submittedDate: 'May 10',
    headcount: 2,
    type: 'Full-time',
    budget: '₫15M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Normal',
    status: 'RETURNED',
    justification: 'Create graphic designs for marketing web collateral. Returned because the salary budget range was outside design benchmarks.',
    skillsRequired: ['Illustrator', 'Photoshop', 'Typography'],
  },
  {
    id: '#REQ-2024-026',
    position: 'Technical Writer',
    department: 'IT Dept',
    requestedBy: 'Dr. Nguyen Van B.',
    submittedDate: 'May 11',
    headcount: 1,
    type: 'Full-time',
    budget: '₫14M/person',
    budgetLabel: 'Monthly Budget',
    urgency: 'Low',
    status: 'RETURNED',
    justification: 'Write API documentation and setup guides. Returned because justification needs detail on workload alignment.',
    skillsRequired: ['Markdown', 'Git', 'API Documentation'],
  },
];

// ─── Urgency Styles ───────────────────────────────────────────────────────────

const urgencyConfig: Record<RequestUrgency, { label: string; badge: string; sidebarBorder: string }> = {
  Critical: {
    label: 'Critical Priority',
    badge: 'bg-rejected/10 text-rejected border-rejected/20',
    sidebarBorder: 'bg-rejected',
  },
  High: {
    label: 'High Priority',
    badge: 'bg-revision/10 text-revision border-revision/20',
    sidebarBorder: 'bg-revision',
  },
  Normal: {
    label: 'Normal Priority',
    badge: 'bg-teal-command/10 text-teal-command border-teal-command/20',
    sidebarBorder: 'bg-teal-command',
  },
  Low: {
    label: 'Low Priority',
    badge: 'bg-slate-ink/10 text-slate-ink border-slate-ink/20',
    sidebarBorder: 'bg-slate-ink',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const HRRequestQueue: React.FC = () => {
  const navigate = useNavigate();
  const [requestsList, setRequestsList] = useState<RecruitmentRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<QueueStatus>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Modals/Drawers
  const [selectedRequest, setSelectedRequest] = useState<RecruitmentRequest | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [revisionFeedback, setRevisionFeedback] = useState<string>('');

  // Live Count Calculations
  const counts = useMemo(() => ({
    PENDING: requestsList.filter((r) => r.status === 'PENDING').length,
    UNDER_REVIEW: requestsList.filter((r) => r.status === 'UNDER_REVIEW').length,
    FORWARDED: requestsList.filter((r) => r.status === 'FORWARDED').length,
    RETURNED: requestsList.filter((r) => r.status === 'RETURNED').length,
  }), [requestsList]);

  // Filtering Logic
  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return requestsList.filter((r) => {
      const matchStatus = r.status === activeTab;
      const matchSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.requestedBy.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [requestsList, activeTab, searchQuery]);

  // Handle Review action
  const handleOpenReview = (request: RecruitmentRequest) => {
    setSelectedRequest(request);
    // Automatically transition to UNDER_REVIEW when opened for review (if it was pending)
    if (request.status === 'PENDING') {
      setRequestsList((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: 'UNDER_REVIEW' } : r))
      );
    }
  };

  // Actions inside Review Detail modal
  const handleForwardToAdmin = (id: string) => {
    setRequestsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'FORWARDED' } : r))
    );
    setSelectedRequest(null);
  };

  const handleCreateCampaign = (request: RecruitmentRequest) => {
    console.log('Approve and create campaign for request:', request.id);
    // Navigate straight to Create Plan / Campaigns flow
    navigate('/hr/campaigns');
  };

  const handleReturnRevision = (id: string) => {
    if (!revisionFeedback.trim()) return;
    setRequestsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'RETURNED', justification: `${r.justification} [HR Feedback: ${revisionFeedback}]` } : r))
    );
    setShowRevisionModal(false);
    setSelectedRequest(null);
    setRevisionFeedback('');
  };

  return (
    <div className="-m-8 flex min-h-full bg-workflow-ivory flex-col">
      {/* Top Header Section */}
      <header className="flex items-center justify-between h-20 px-8 bg-workflow-ivory border-b border-border-warm sticky top-0 z-20">
        <div className="flex flex-col">
          <h2 className="font-headline-lg text-headline-lg text-deep-charcoal">Request Queue</h2>
          <p className="text-secondary font-body-sm text-body-sm">HR Manager Portal • Incoming recruitment requests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-outline">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-clean-surface border border-border-warm rounded-lg focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none transition-all w-64 text-label-md"
              placeholder="Search requests..."
              type="text"
            />
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            {counts.PENDING > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full" />
            )}
          </button>
          <button
            onClick={() => navigate('/hr/campaigns')}
            className="px-4 py-2 bg-teal-command text-white rounded-lg font-label-md text-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Requisition
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="p-8 flex gap-6 max-w-[1440px] mx-auto w-full flex-1">
        {/* Center List Column */}
        <div className="flex-1 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex items-center justify-between">
            <nav className="flex gap-8 border-b border-border-warm w-full">
              {[
                { key: 'PENDING' as QueueStatus, label: `Pending Review (${counts.PENDING})` },
                { key: 'UNDER_REVIEW' as QueueStatus, label: `Under Review (${counts.UNDER_REVIEW})` },
                { key: 'FORWARDED' as QueueStatus, label: `Forwarded to Admin (${counts.FORWARDED})` },
                { key: 'RETURNED' as QueueStatus, label: `Returned (${counts.RETURNED})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 px-1 border-b-2 text-label-md transition-colors ${
                    activeTab === tab.key
                      ? 'border-teal-command text-teal-command font-bold'
                      : 'border-transparent text-secondary hover:text-teal-command font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            {counts.PENDING > 0 && activeTab === 'PENDING' && (
              <div className="flex items-center gap-2 bg-revision/10 border border-revision/20 text-revision px-3 py-1 rounded-full whitespace-nowrap ml-4">
                <span className="w-2 h-2 bg-revision rounded-full animate-pulse"></span>
                <span className="font-label-sm text-label-sm font-bold">{counts.PENDING} pending review</span>
              </div>
            )}
          </div>

          {/* Request Cards Stack */}
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const cfg = urgencyConfig[request.urgency];
              return (
                <div
                  key={request.id}
                  className="bg-clean-surface border border-border-warm p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-teal-command/40 hover:-translate-y-0.5 transition-all duration-200 rounded-lg cursor-pointer"
                  onClick={() => handleOpenReview(request)}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.sidebarBorder}`}></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-secondary text-label-sm">• ID: {request.id}</span>
                      </div>
                      <h3 className="font-headline-md text-headline-md text-deep-charcoal group-hover:text-teal-command transition-colors mt-1">
                        {request.position}
                      </h3>
                      <p className="text-secondary font-body-sm text-body-sm mt-1">
                        {request.department} • Requested by: <span className="font-medium text-on-surface">{request.requestedBy}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-data-mono text-data-mono text-secondary mb-1">Submitted: {request.submittedDate}</p>
                      <div className="flex gap-2 justify-end">
                        <span className="bg-workflow-ivory border border-border-warm px-3 py-1 rounded text-label-sm font-medium">
                          Headcount: {request.headcount}
                        </span>
                        <span className="bg-workflow-ivory border border-border-warm px-3 py-1 rounded text-label-sm font-medium">
                          {request.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border-warm/40" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-[18px]">payments</span>
                      <span className="text-label-md font-bold text-on-surface">{request.budget}</span>
                      <span className="text-secondary font-label-sm">{request.budgetLabel}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRevisionModal(true);
                        }}
                        className="px-6 py-2 border border-teal-command text-teal-command hover:bg-teal-command hover:text-white rounded-lg font-label-md text-label-md transition-all active:scale-95"
                      >
                        Return for Revision
                      </button>
                      <button
                        onClick={() => handleOpenReview(request)}
                        className="px-8 py-2 bg-teal-command text-white hover:brightness-110 rounded-lg font-label-md text-label-md transition-all active:scale-95 shadow-sm shadow-teal-command/20"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="bg-clean-surface border border-border-warm rounded-xl p-12 text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30 mb-4">inbox</span>
                <h4 className="text-sm font-semibold text-deep-charcoal">No requests found</h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-[40ch]">
                  Try clearing your search query or switching to a different review queue tab.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <aside className="w-[300px] flex flex-col gap-6 flex-shrink-0">
          {/* Queue Summary Card */}
          <div className="bg-clean-surface border border-border-warm p-6 shadow-sm rounded-lg">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-teal-command">dashboard_customize</span>
              <h4 className="font-headline-md text-headline-md text-deep-charcoal">Queue Summary</h4>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-secondary font-label-sm text-label-sm">Average Review Time</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-headline-xl font-headline-xl font-bold text-on-surface">2.3</span>
                  <span className="text-secondary font-label-md">days</span>
                </div>
                <div className="w-full bg-workflow-ivory h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-command h-full w-[65%]" title="Efficiency Rate"></div>
                </div>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-revision/5 rounded-lg border border-revision/10">
                <span className="text-secondary font-label-sm text-label-sm">Oldest Pending Request</span>
                <div className="flex items-center justify-between">
                  <span className="text-headline-md font-headline-md font-bold text-revision">5 days</span>
                  <span className="material-symbols-outlined text-revision animate-bounce">priority_high</span>
                </div>
                <p className="text-[11px] text-revision/80 mt-1 italic font-medium">Action recommended for SLAs</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border-warm/40">
                <h5 className="text-on-surface font-label-md text-label-md font-bold uppercase tracking-wider text-[11px]">This Week Performance</h5>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-approved"></div>
                    <span className="text-secondary text-body-sm">Reviewed</span>
                  </div>
                  <span className="font-bold text-on-surface">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pending"></div>
                    <span className="text-secondary text-body-sm">Forwarded</span>
                  </div>
                  <span className="font-bold text-on-surface">2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights Card */}
          <div className="bg-clean-surface border border-border-warm p-6 shadow-sm rounded-lg">
            <h4 className="font-label-md text-label-md font-bold text-deep-charcoal mb-4">Request Distribution</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-workflow-ivory flex items-center justify-center text-teal-command flex-shrink-0">
                  <span className="material-symbols-outlined">computer</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-label-sm font-medium text-deep-charcoal">IT & Eng</span>
                    <span className="text-label-sm text-secondary font-semibold">42%</span>
                  </div>
                  <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-teal-command h-full w-[42%]"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-workflow-ivory flex items-center justify-center text-teal-command flex-shrink-0">
                  <span className="material-symbols-outlined">palette</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-label-sm font-medium text-deep-charcoal">Design</span>
                    <span className="text-label-sm text-secondary font-semibold">28%</span>
                  </div>
                  <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-teal-command h-full w-[28%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="relative overflow-hidden bg-teal-command h-32 group cursor-pointer rounded-lg shadow-sm">
            <img
              alt="Atrium"
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6emTQiHCoi08N1Z4rqLfXD7Weu5-durGi3ttQH49sL13n0vQX7QFae0B1o1iNzvdxzLpsc6ezFd6l_pJCMjYbcM9xTT4qVQwDVTQqAx_qemDJh33ZeELe-Mv7uDqfQrs9sXi6F1n1Gj44U0uY6m_rLlrfEjXvYvHzskEEJAczIe0cX02S_gfgj0HlJxrO4vI1rbiEAi6o_89mGbhIOvAvU1vVoeNqqWR83-v8WAoSk-CJkxjlL34XMyVQnzMRf8vZ6yxsQO9C8zQ"
            />
            <div className="absolute inset-0 p-5 flex flex-col justify-end bg-gradient-to-t from-teal-command/80 to-transparent">
              <span className="text-white font-bold text-label-md">Need assistance?</span>
              <p className="text-teal-100 text-[12px] mt-0.5 leading-snug">Schedule a sync with the recruitment admin team.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Detailed Review Modal/Drawer ─────────────────────────────────── */}
      {selectedRequest && !showRevisionModal && (
        <div className="fixed inset-0 bg-deep-charcoal/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-clean-surface w-full max-w-[500px] h-full shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-warm flex justify-between items-center bg-workflow-ivory/50">
              <div>
                <span className="font-mono text-xs text-teal-command font-semibold">{selectedRequest.id}</span>
                <h3 className="text-base font-semibold text-deep-charcoal mt-0.5">Recruitment Requisition</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 text-on-surface-variant hover:text-deep-charcoal rounded-full hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${urgencyConfig[selectedRequest.urgency].badge}`}>
                  {selectedRequest.urgency} Priority
                </span>
                <h2 className="text-xl font-bold text-deep-charcoal mt-2">{selectedRequest.position}</h2>
                <p className="text-xs text-secondary mt-1">
                  Department: <span className="font-semibold text-on-surface">{selectedRequest.department}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-workflow-ivory rounded-lg border border-border-warm">
                <div>
                  <span className="block text-[11px] text-secondary font-medium">Requested By</span>
                  <span className="text-sm font-semibold text-deep-charcoal">{selectedRequest.requestedBy}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-secondary font-medium">Headcount Plan</span>
                  <span className="text-sm font-semibold text-deep-charcoal">{selectedRequest.headcount} candidates</span>
                </div>
                <div>
                  <span className="block text-[11px] text-secondary font-medium">Job Category</span>
                  <span className="text-sm font-semibold text-deep-charcoal">{selectedRequest.type}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-secondary font-medium">Monthly Allocation</span>
                  <span className="text-sm font-semibold text-deep-charcoal">{selectedRequest.budget}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-deep-charcoal uppercase tracking-wider mb-2">Justification & Sourcing Brief</h4>
                <p className="text-sm text-slate-ink leading-relaxed bg-workflow-ivory/40 p-4 rounded-lg border border-border-warm/60">
                  {selectedRequest.justification}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-deep-charcoal uppercase tracking-wider mb-3">Key Technical Competencies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full border border-teal-command/20 bg-teal-command/5 text-teal-command font-medium text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border-warm bg-workflow-ivory/50 flex flex-col gap-2.5">
              <button
                onClick={() => handleCreateCampaign(selectedRequest)}
                className="w-full bg-teal-command text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                Approve & Create Campaign Plan
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="flex-1 border border-border-warm text-slate-ink hover:text-teal-command hover:border-teal-command/40 font-semibold py-2 bg-clean-surface rounded-lg transition-all"
                >
                  Return for Revision
                </button>
                {selectedRequest.status !== 'FORWARDED' && (
                  <button
                    onClick={() => handleForwardToAdmin(selectedRequest.id)}
                    className="flex-1 bg-deep-charcoal text-white font-semibold py-2 rounded-lg hover:bg-slate-ink transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Forward to Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Revision Feedback Modal ─────────────────────────────────────── */}
      {showRevisionModal && selectedRequest && (
        <div className="fixed inset-0 bg-deep-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-clean-surface w-full max-w-[480px] rounded-xl shadow-2xl border border-border-warm overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-border-warm bg-workflow-ivory/50 flex justify-between items-center">
              <h3 className="font-bold text-deep-charcoal">Return Requisition for Revision</h3>
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setRevisionFeedback('');
                }}
                className="p-1 text-on-surface-variant hover:text-deep-charcoal rounded-full hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-secondary leading-normal">
                Please provide clear instructions for the Department Head outlining what details require correction or refinement before HR planning.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-deep-charcoal uppercase tracking-wider mb-2">Revision Feedback Notes</label>
                <textarea
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  placeholder="e.g. Budget range is higher than standard department benchmark. Please realign..."
                  rows={4}
                  className="w-full border border-border-warm rounded-lg bg-clean-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-command/30 focus:border-teal-command outline-none resize-none placeholder:text-on-surface-variant"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-workflow-ivory/50 border-t border-border-warm flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setRevisionFeedback('');
                }}
                className="px-4 py-2 border border-border-warm text-secondary rounded-lg text-xs font-semibold hover:bg-surface-variant/40"
              >
                Cancel
              </button>
              <button
                disabled={!revisionFeedback.trim()}
                onClick={() => handleReturnRevision(selectedRequest.id)}
                className="px-5 py-2 bg-rejected text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Return to Dept Head
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
