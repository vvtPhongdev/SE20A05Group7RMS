import React, { useMemo, useState, useEffect } from 'react';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Draft';
type Priority = 'High' | 'Medium' | 'Low';
type FilterKey = 'All' | ApprovalStatus;

interface ApprovalRequest {
  id: string;
  position: string;
  department: string;
  requestedBy: string;
  headcount: number;
  priority: Priority;
  status: ApprovalStatus;
  submitted: string;
  salaryRange: string;
  description: string;
  documents: string[];
}

const initialRequests: ApprovalRequest[] = [
  {
    id: 'RMS-9421',
    position: 'Senior Frontend Engineer',
    department: 'Phòng Kỹ Thuật',
    requestedBy: 'Nguyễn Văn B',
    headcount: 2,
    priority: 'High',
    status: 'Pending',
    submitted: 'Oct 24, 2023',
    salaryRange: '$2,500 - $3,800 USD',
    description:
      'We are looking for a Senior Frontend Engineer to lead the migration of our enterprise dashboard to a modern tech stack. Requires 5+ years of experience with React, TypeScript, and high-performance UI optimization.',
    documents: ['JD_Senior_Frontend_Final.pdf', 'Budget_Approval_Q4.xlsx'],
  },
  {
    id: 'RMS-9420',
    position: 'Creative Content Lead',
    department: 'Phòng Marketing',
    requestedBy: 'Trần Thị C',
    headcount: 1,
    priority: 'Medium',
    status: 'Approved',
    submitted: 'Oct 23, 2023',
    salaryRange: '$1,500 - $2,200 USD',
    description:
      'Lead our creative content team. Drive content strategy across all digital channels, manage content pipeline, and collaborate with product/design teams.',
    documents: ['JD_Creative_Lead.pdf'],
  },
  {
    id: 'RMS-9418',
    position: 'Recruitment Coordinator',
    department: 'Phòng Nhân Sự',
    requestedBy: 'Phạm Minh D',
    headcount: 1,
    priority: 'Low',
    status: 'Draft',
    submitted: 'Oct 22, 2023',
    salaryRange: '$1,000 - $1,500 USD',
    description:
      'Coordinate interview scheduling, communicate with candidates, manage applicant tracking system updates, and support onboarding logistics.',
    documents: ['JD_Recruiter_Coord.pdf'],
  },
  {
    id: 'RMS-9415',
    position: 'DevOps Architect',
    department: 'Phòng Kỹ Thuật',
    requestedBy: 'Lê Hoàng E',
    headcount: 1,
    priority: 'High',
    status: 'Pending',
    submitted: 'Oct 21, 2023',
    salaryRange: '$3,500 - $5,000 USD',
    description:
      'Design and optimize our multi-region AWS cloud infrastructure. Automate CI/CD pipelines, ensure high availability, and lead security compliance audits.',
    documents: ['JD_DevOps_Architect.pdf', 'Infra_Budget_2024.xlsx'],
  },
];

// Generate the rest programmatically to reach exactly 45 total to match the HTML design stats
const generateMockRequests = (): ApprovalRequest[] => {
  const base = [...initialRequests];
  const departments = [
    'Phòng Kỹ Thuật',
    'Phòng Marketing',
    'Phòng Nhân Sự',
    'Phòng Tài Chính',
    'Phòng Kinh Doanh',
  ];
  const positions = [
    'Backend Engineer',
    'Product Manager',
    'UX/UI Designer',
    'QA Engineer',
    'SEO Specialist',
    'HR Business Partner',
    'Financial Analyst',
    'Sales Executive',
  ];
  const names = ['Nguyễn Văn X', 'Lê Thị Y', 'Trần Minh Z', 'Phạm Hoàng W', 'Vũ Đức V'];

  let pendingNeeded = 3 - base.filter((r) => r.status === 'Pending').length; // 1
  let approvedNeeded = 12 - base.filter((r) => r.status === 'Approved').length; // 11
  let rejectedNeeded = 2 - base.filter((r) => r.status === 'Rejected').length; // 2
  let draftNeeded = 28 - base.filter((r) => r.status === 'Draft').length; // 27

  let idCounter = 9414;
  while (pendingNeeded > 0 || approvedNeeded > 0 || rejectedNeeded > 0 || draftNeeded > 0) {
    let status: ApprovalStatus = 'Draft';
    if (pendingNeeded > 0) {
      status = 'Pending';
      pendingNeeded--;
    } else if (approvedNeeded > 0) {
      status = 'Approved';
      approvedNeeded--;
    } else if (rejectedNeeded > 0) {
      status = 'Rejected';
      rejectedNeeded--;
    } else if (draftNeeded > 0) {
      status = 'Draft';
      draftNeeded--;
    }

    const priority: Priority =
      idCounter % 3 === 0 ? 'High' : idCounter % 3 === 1 ? 'Medium' : 'Low';
    const dept = departments[idCounter % departments.length];
    const pos = positions[idCounter % positions.length];
    const name = names[idCounter % names.length];
    const headcount = (idCounter % 3) + 1;
    const date = `Oct ${Math.max(1, idCounter % 28)}, 2023`;

    base.push({
      id: `RMS-${idCounter}`,
      position: pos,
      department: dept,
      requestedBy: name,
      headcount,
      priority,
      status,
      submitted: date,
      salaryRange: `$${1500 + (idCounter % 5) * 400} - $${2500 + (idCounter % 5) * 500} USD`,
      description: `We are looking for a qualified ${pos} to join our team. Responsibilities include working on core platforms, optimizing workflow, and contributing to overall product quality.`,
      documents: [`JD_${pos.replace(/ /g, '_')}_v1.pdf`],
    });

    idCounter--;
  }

  // Sort by id descending
  return base.sort((a, b) => b.id.localeCompare(a.id));
};

const filters: FilterKey[] = ['All', 'Pending', 'Approved', 'Rejected', 'Draft'];

export const AdminApprovalQueue: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [department, setDepartment] = useState('All');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected request for detail drawer
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initialize mock data
  useEffect(() => {
    setRequests(generateMockRequests());
  }, []);

  // Reset page when filter, query, or department changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, query, department]);

  const departments = useMemo(() => {
    return ['All', ...Array.from(new Set(requests.map((r) => r.department)))];
  }, [requests]);

  const counts = useMemo(() => {
    return {
      All: requests.length,
      Pending: requests.filter((r) => r.status === 'Pending').length,
      Approved: requests.filter((r) => r.status === 'Approved').length,
      Rejected: requests.filter((r) => r.status === 'Rejected').length,
      Draft: requests.filter((r) => r.status === 'Draft').length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesFilter = filter === 'All' || request.status === filter;
      const matchesDepartment = department === 'All' || request.department === department;
      const matchesQuery =
        !normalizedQuery ||
        request.id.toLowerCase().includes(normalizedQuery) ||
        request.position.toLowerCase().includes(normalizedQuery) ||
        request.department.toLowerCase().includes(normalizedQuery) ||
        request.requestedBy.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesDepartment && matchesQuery;
    });
  }, [department, filter, query, requests]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const handleOpenDrawer = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r)));
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'Approved' } : null));
    }
    setIsDrawerOpen(false);
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Rejected' } : r)));
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: 'Rejected' } : null));
    }
    setIsDrawerOpen(false);
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 p-4 md:p-6 bg-workflow-ivory text-on-surface antialiased">
      {/* Local Page Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border-warm pb-4">
        <div className="flex items-center gap-4">
          <h2 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Director Portal
          </h2>
          <div className="h-6 w-[1px] bg-border-warm"></div>
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Admin Approval Queue
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              className="bg-clean-surface border border-border-warm rounded-full pl-10 pr-4 py-1.5 text-body-sm w-64 focus:ring-2 focus:ring-teal-command outline-none transition-all"
              placeholder="Search requests..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="relative cursor-pointer hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center text-on-surface-variant">
            <span className="material-symbols-outlined">notifications</span>
            {counts.Pending > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rejected rounded-full border-2 border-background"></span>
            )}
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Pending */}
        <div className="bg-clean-surface p-6 rounded-lg border border-border-warm flex items-start justify-between shadow-sm">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Pending
            </p>
            <h3 className="font-headline-xl text-headline-xl text-pending mt-1 font-semibold">
              {String(counts.Pending).padStart(2, '0')}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Requires immediate review
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-pending">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pending_actions
            </span>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-clean-surface p-6 rounded-lg border border-border-warm flex items-start justify-between shadow-sm">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Approved
            </p>
            <h3 className="font-headline-xl text-headline-xl text-approved mt-1 font-semibold">
              {String(counts.Approved).padStart(2, '0')}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Processed this week
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-approved">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-clean-surface p-6 rounded-lg border border-border-warm flex items-start justify-between shadow-sm">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Rejected
            </p>
            <h3 className="font-headline-xl text-headline-xl text-rejected mt-1 font-semibold">
              {String(counts.Rejected).padStart(2, '0')}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Failed requirements
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-rejected">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cancel
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="bg-clean-surface p-6 rounded-lg border border-border-warm flex items-start justify-between shadow-sm">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Total Requests
            </p>
            <h3 className="font-headline-xl text-headline-xl text-teal-command mt-1 font-semibold">
              {String(counts.All).padStart(2, '0')}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              All-time volume
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-teal-command">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              analytics
            </span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-clean-surface rounded-lg border border-border-warm overflow-hidden shadow-sm flex flex-col">
        {/* Table Action Bar */}
        <div className="px-6 py-4 border-b border-border-warm flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center bg-workflow-ivory/50">
          {/* Tab Filter Navigation */}
          <div className="flex flex-wrap gap-1">
            {filters.map((item) => (
              <button
                key={item}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition active:scale-[0.98] ${
                  filter === item
                    ? 'bg-teal-command text-white shadow-sm'
                    : 'text-slate-ink hover:bg-surface-container-high'
                }`}
                type="button"
                onClick={() => setFilter(item)}
              >
                {item === 'All' ? 'All Requests' : item}
                <span
                  className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${
                    filter === item
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-container-highest text-slate-ink'
                  }`}
                >
                  {counts[item as keyof typeof counts] ?? counts.All}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 self-end sm:self-auto">
            {/* Department Dropdown */}
            <select
              className="bg-white border border-border-warm rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-teal-command"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments
                .filter((d) => d !== 'All')
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>

            <button className="px-4 py-2 bg-white border border-border-warm rounded-lg text-on-surface-variant font-label-md flex items-center gap-2 hover:bg-surface-container-high transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">download</span> Export
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border-b border-border-warm">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Request ID</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-body-sm text-body-sm">
              {paginatedRequests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:shadow-[inset_4px_0_0_0_#0D9488] hover:bg-surface-container-low/40 transition-all cursor-pointer group"
                  onClick={() => handleOpenDrawer(request)}
                >
                  <td className="px-6 py-4 font-data-mono text-data-mono text-teal-command font-semibold">
                    #{request.id}
                  </td>
                  <td className="px-6 py-4">{request.department}</td>
                  <td className="px-6 py-4 font-medium text-deep-charcoal">{request.position}</td>
                  <td className="px-6 py-4 font-semibold">
                    {String(request.headcount).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 w-fit ${
                        request.priority === 'High'
                          ? 'bg-error-container text-rejected'
                          : 'bg-tertiary-container/10 text-tertiary'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          request.priority === 'High' ? 'bg-rejected' : 'bg-tertiary'
                        }`}
                      ></span>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 w-fit ${
                        request.status === 'Approved'
                          ? 'bg-surface-container-high text-approved'
                          : request.status === 'Rejected'
                            ? 'bg-surface-container-high text-rejected'
                            : request.status === 'Pending'
                              ? 'bg-surface-container-high text-pending'
                              : 'bg-surface-container-high text-draft'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          request.status === 'Approved'
                            ? 'bg-approved'
                            : request.status === 'Rejected'
                              ? 'bg-rejected'
                              : request.status === 'Pending'
                                ? 'bg-pending'
                                : 'bg-draft'
                        }`}
                      ></span>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{request.submitted}</td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {request.status === 'Pending' || request.status === 'Draft' ? (
                      <button
                        className="px-4 py-1.5 border border-teal-command text-teal-command rounded-lg font-label-md hover:bg-teal-command hover:text-white transition-all font-semibold"
                        onClick={() => handleOpenDrawer(request)}
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        className="px-4 py-1.5 border border-border-warm text-slate-ink rounded-lg font-label-md opacity-50 cursor-not-allowed font-semibold"
                        disabled
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-slate-ink">
                      search_off
                    </span>
                    No requests found matching the current search parameters and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-surface-container-low border-t border-border-warm flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Showing {filteredRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{' '}
            {filteredRequests.length} requests
          </p>
          <div className="flex gap-1 justify-center">
            <button
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`w-10 h-10 rounded-lg font-label-md font-semibold transition ${
                  currentPage === idx + 1
                    ? 'bg-teal-command text-white shadow-sm'
                    : 'hover:bg-surface-container-high text-on-surface-variant'
                }`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* NavigationDrawer (Right Detail View) */}
      <div
        className={`fixed right-0 top-0 h-screen w-full sm:w-[400px] bg-clean-surface border-l border-border-warm shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        id="detailDrawer"
      >
        <div className="p-6 border-b border-border-warm flex justify-between items-center bg-workflow-ivory/50">
          <h3 className="font-headline-md text-headline-md font-semibold text-deep-charcoal">
            Request Details
          </h3>
          <button
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center"
            onClick={handleCloseDrawer}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {selectedRequest && (
          <>
            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* Department Block */}
              <div className="flex items-center gap-4 p-4 bg-workflow-ivory rounded-lg border border-border-warm shadow-sm">
                <div className="p-3 bg-teal-command/10 text-teal-command rounded-lg">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                    Requesting Department
                  </p>
                  <p className="font-headline-md text-headline-md font-semibold text-deep-charcoal">
                    {selectedRequest.department}
                  </p>
                </div>
              </div>

              {/* Position Title */}
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Position Title
                </label>
                <p className="font-body-md text-body-md font-semibold text-deep-charcoal">
                  {selectedRequest.position}
                </p>
              </div>

              {/* Quantity and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                    Quantity
                  </label>
                  <p className="font-body-md text-body-md text-deep-charcoal font-semibold">
                    {String(selectedRequest.headcount).padStart(2, '0')} Persons
                  </p>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                    Priority
                  </label>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg font-label-sm text-label-sm inline-flex items-center gap-1.5 ${
                      selectedRequest.priority === 'High'
                        ? 'bg-error-container text-rejected'
                        : 'bg-tertiary-container/10 text-tertiary'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedRequest.priority === 'High' ? 'bg-rejected' : 'bg-tertiary'
                      }`}
                    ></span>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Expected Salary Range
                </label>
                <p className="font-data-mono text-data-mono font-semibold text-teal-command">
                  {selectedRequest.salaryRange}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-semibold uppercase">
                  Job Description Overview
                </label>
                <p className="font-body-sm text-body-sm text-slate-ink leading-relaxed">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Attachments */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div className="p-4 bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                  <p className="font-label-md text-label-md mb-3 flex items-center gap-2 font-semibold text-deep-charcoal">
                    <span className="material-symbols-outlined text-[18px]">attachment</span>{' '}
                    Attached Documents
                  </p>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-body-sm py-2 px-3 bg-white rounded border border-border-warm shadow-sm"
                      >
                        <span className="truncate text-slate-ink font-medium">{doc}</span>
                        <span className="material-symbols-outlined text-teal-command cursor-pointer hover:text-primary transition-colors">
                          download
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Review */}
            <div className="p-6 border-t border-border-warm bg-workflow-ivory flex flex-col gap-3">
              {selectedRequest.status === 'Pending' || selectedRequest.status === 'Draft' ? (
                <>
                  <button
                    className="w-full bg-teal-command hover:bg-primary text-white py-3 rounded-lg font-label-md font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                    type="button"
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
                    <span className="material-symbols-outlined">check</span>
                    Approve Request
                  </button>
                  <button
                    className="w-full border border-rejected hover:bg-error-container text-rejected py-3 rounded-lg font-label-md font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    type="button"
                    onClick={() => handleReject(selectedRequest.id)}
                  >
                    <span className="material-symbols-outlined">close</span>
                    Reject Request
                  </button>
                </>
              ) : (
                <div className="text-center py-2 text-on-surface-variant font-medium text-sm">
                  This request has been{' '}
                  <span className="font-bold uppercase">{selectedRequest.status}</span> and cannot
                  be modified.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Backdrop for Drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-deep-charcoal/40 backdrop-blur-sm z-40 transition-opacity duration-300 opacity-100"
          id="drawerOverlay"
          onClick={handleCloseDrawer}
        ></div>
      )}
    </div>
  );
};
