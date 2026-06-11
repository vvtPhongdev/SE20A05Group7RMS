import React, { useState, useMemo } from 'react';

// SVG Icons definition to match high-fidelity design without depending on external fonts
const Icons = {
  unread: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-secondary shrink-0"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
      <circle cx="18" cy="18" r="3" className="fill-teal-command stroke-none" />
    </svg>
  ),
  mailRead: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  calendar: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-secondary shrink-0"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  ),
  briefcase: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-secondary shrink-0"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  system: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-secondary shrink-0"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  archive: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  ),
  chevronRight: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  clock: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  video: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  checkCircle: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

interface AlertItem {
  id: string;
  type: 'Interview' | 'Application' | 'System';
  title: string;
  sender: string;
  senderInitials: string;
  content: string;
  receivedText: string;
  unread: boolean;
  date?: string;
  time?: string;
  format?: string;
  relatedJob?: string;
  attendanceConfirmed?: boolean;
}

export const CandidateNotifications: React.FC = () => {
  // Alert Data State
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alert-1',
      type: 'Interview',
      title: 'Interview Invitation: TechCorp VN',
      sender: 'TechCorp VN',
      senderInitials: 'TC',
      content: `Dear Tran Ngoc Mai,\n\nThank you for taking the time to apply for the Senior Frontend Developer position at TechCorp VN. We were impressed by your background and would like to invite you to an initial technical interview with our engineering team.\n\nThis session will focus on your experience with React, state management patterns, and system design for enterprise web applications.`,
      receivedText: '2 hours ago',
      unread: true,
      date: 'Oct 28, 2023',
      time: '10:00 AM (ICT)',
      format: 'Google Meet (Link will be provided upon confirmation)',
      relatedJob: 'Senior Frontend Developer',
      attendanceConfirmed: false,
    },
    {
      id: 'alert-2',
      type: 'Application',
      title: 'Application Under Review: FinTech Solutions',
      sender: 'FinTech Solutions',
      senderInitials: 'FS',
      content: `Hi Tran Ngoc Mai,\n\nYour application for the Senior Frontend Developer role at FinTech Solutions has been received and is currently under review by our recruitment team.\n\nWe will update you as soon as we complete the initial screening process. Thank you for your patience.`,
      receivedText: 'Yesterday',
      unread: false,
      relatedJob: 'Senior Frontend Developer',
    },
    {
      id: 'alert-3',
      type: 'Application',
      title: 'Status Update: Global E-commerce',
      sender: 'Global E-commerce',
      senderInitials: 'GE',
      content: `Hello Tran Ngoc Mai,\n\nCongratulations! We are pleased to inform you that you have successfully passed the CV screening phase for the Frontend Developer role at Global E-commerce.\n\nYou have moved to the next stage of the evaluation process. Our HR coordinator will contact you shortly to arrange a scheduling slot.`,
      receivedText: 'Oct 26',
      unread: true,
      relatedJob: 'Frontend Developer',
    },
    {
      id: 'alert-4',
      type: 'System',
      title: 'Maintenance Notice',
      sender: 'System Admin',
      senderInitials: 'SA',
      content: `Dear Candidates,\n\nPlease note that the Candidate Portal will undergo scheduled maintenance on Sunday, November 1st, from 02:00 AM to 04:00 AM (ICT).\n\nDuring this window, some features, including CV uploads, may be temporarily unavailable. We apologize for any inconvenience caused.`,
      receivedText: 'Oct 20',
      unread: false,
    },
  ]);

  // Selected Alert ID State
  const [selectedAlertId, setSelectedAlertId] = useState<string>('alert-1');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'All' | 'Unread' | 'Interviews' | 'Applications' | 'System'
  >('All');

  // Active Selected Alert Object
  const selectedAlert = useMemo(() => {
    return alerts.find((alert) => alert.id === selectedAlertId) || null;
  }, [alerts, selectedAlertId]);

  // Handle selecting an alert
  const handleSelectAlert = (id: string) => {
    setSelectedAlertId(id);
    // Auto-mark as read when clicked
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) => (alert.id === id ? { ...alert, unread: false } : alert)),
    );
  };

  // Toggle Read/Unread Status
  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) => (alert.id === id ? { ...alert, unread: !alert.unread } : alert)),
    );
  };

  // Archive (Delete) Alert
  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedAlerts = alerts.filter((alert) => alert.id !== id);
    setAlerts(updatedAlerts);
    // If the archived alert was selected, select the next available one
    if (selectedAlertId === id && updatedAlerts.length > 0) {
      setSelectedAlertId(updatedAlerts[0].id);
    }
  };

  // Confirm Attendance
  const handleConfirmAttendance = (id: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === id ? { ...alert, attendanceConfirmed: true } : alert,
      ),
    );
  };

  // Dynamic Metrics based on alert state
  const metrics = useMemo(() => {
    return {
      unread: alerts.filter((a) => a.unread).length,
      interviews: alerts.filter((a) => a.type === 'Interview').length,
      applications: alerts.filter((a) => a.type === 'Application').length,
      systems: alerts.filter((a) => a.type === 'System').length,
    };
  }, [alerts]);

  // Filtered list of alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Apply Search Filter
      const matchesSearch =
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.sender.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply Category Filter
      if (activeFilter === 'Unread') return matchesSearch && alert.unread;
      if (activeFilter === 'Interviews') return matchesSearch && alert.type === 'Interview';
      if (activeFilter === 'Applications') return matchesSearch && alert.type === 'Application';
      if (activeFilter === 'System') return matchesSearch && alert.type === 'System';

      return matchesSearch;
    });
  }, [alerts, searchQuery, activeFilter]);

  return (
    <div className="mx-auto max-w-[1440px] flex flex-col h-[calc(100vh-100px)]">
      {/* Top Search bar inside view (mobile header compatibility) */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-deep-charcoal mb-1">
            Inbox Alerts
          </h1>
          <p className="text-sm text-slate-ink">
            Check incoming notifications, interview invitations, and status updates.
          </p>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            className="w-full text-xs pl-9 pr-4 py-2 border border-border-warm rounded-lg focus:ring-1 focus:ring-teal-command outline-none bg-white placeholder:text-outline"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-ink text-sm">
            🔍
          </span>
        </div>
      </header>

      {/* Summary Header Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" aria-label="Inbox Summary">
        {/* Unread Card */}
        <div
          onClick={() => setActiveFilter('Unread')}
          className={`bg-white border p-4 flex flex-col gap-1 relative overflow-hidden group cursor-pointer hover:border-teal-command transition-all rounded-lg ${
            activeFilter === 'Unread'
              ? 'border-teal-command ring-1 ring-teal-command/20 shadow-sm'
              : 'border-border-warm shadow-sm'
          }`}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-teal-command/5 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center gap-2 text-slate-ink">
            <span className="text-xs font-semibold">Unread</span>
          </div>
          <span className="text-2xl font-semibold text-deep-charcoal">{metrics.unread}</span>
        </div>

        {/* Interviews Card */}
        <div
          onClick={() => setActiveFilter('Interviews')}
          className={`bg-white border p-4 flex flex-col gap-1 relative overflow-hidden group cursor-pointer hover:border-approved transition-all rounded-lg ${
            activeFilter === 'Interviews'
              ? 'border-approved ring-1 ring-approved/20 shadow-sm'
              : 'border-border-warm shadow-sm'
          }`}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-approved/5 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center gap-2 text-slate-ink">
            <span className="text-xs font-semibold">Interview Invites</span>
          </div>
          <span className="text-2xl font-semibold text-deep-charcoal">{metrics.interviews}</span>
        </div>

        {/* Applications Card */}
        <div
          onClick={() => setActiveFilter('Applications')}
          className={`bg-white border p-4 flex flex-col gap-1 relative overflow-hidden group cursor-pointer hover:border-pending transition-all rounded-lg ${
            activeFilter === 'Applications'
              ? 'border-pending ring-1 ring-pending/20 shadow-sm'
              : 'border-border-warm shadow-sm'
          }`}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-pending/5 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center gap-2 text-slate-ink">
            <span className="text-xs font-semibold">Application Updates</span>
          </div>
          <span className="text-2xl font-semibold text-deep-charcoal">{metrics.applications}</span>
        </div>

        {/* Systems Card */}
        <div
          onClick={() => setActiveFilter('System')}
          className={`bg-white border p-4 flex flex-col gap-1 relative overflow-hidden group cursor-pointer hover:border-tertiary transition-all rounded-lg ${
            activeFilter === 'System'
              ? 'border-tertiary ring-1 ring-tertiary/20 shadow-sm'
              : 'border-border-warm shadow-sm'
          }`}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-tertiary/5 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
          <div className="flex items-center gap-2 text-slate-ink">
            <span className="text-xs font-semibold">System Notices</span>
          </div>
          <span className="text-2xl font-semibold text-deep-charcoal">{metrics.systems}</span>
        </div>
      </section>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 min-h-0 bg-white border border-border-warm overflow-hidden rounded-lg shadow-sm">
        {/* Left Column: List */}
        <div className="w-full md:w-[40%] flex flex-col border-r border-border-warm bg-workflow-ivory/30 h-full overflow-hidden">
          {/* Filter Pills */}
          <div className="p-3 border-b border-border-warm bg-white shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {(['All', 'Unread', 'Interviews', 'Applications', 'System'] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      activeFilter === filter
                        ? 'bg-teal-command text-white shadow-sm'
                        : 'border border-border-warm text-slate-ink bg-white hover:bg-surface-container-low'
                    }`}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-warm">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const isActive = alert.id === selectedAlertId;
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleSelectAlert(alert.id)}
                    className={`p-4 border-l-4 cursor-pointer relative transition-all duration-150 ${
                      isActive
                        ? 'border-teal-command bg-white'
                        : 'border-transparent hover:bg-white bg-workflow-ivory/20'
                    }`}
                  >
                    {alert.unread && (
                      <div className="absolute left-2.5 top-5 w-2 h-2 rounded-full bg-teal-command"></div>
                    )}
                    <div className="pl-3 flex flex-col gap-1">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wide ${
                            alert.type === 'Interview'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                              : alert.type === 'Application'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200/50'
                                : 'bg-stone-50 text-stone-700 border border-stone-200/50'
                          }`}
                        >
                          {alert.type}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-ink shrink-0">
                          {alert.receivedText}
                        </span>
                      </div>

                      <h3
                        className={`text-sm text-deep-charcoal truncate ${alert.unread ? 'font-bold' : 'font-semibold'}`}
                      >
                        {alert.title}
                      </h3>
                      <p className="text-xs text-slate-ink truncate leading-relaxed">
                        {alert.content.replace(/\n/g, ' ')}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-ink text-xs font-semibold">
                No alerts found matching this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detail Panel */}
        <div className="w-full md:w-[60%] flex flex-col bg-white h-full overflow-hidden">
          {selectedAlert ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="p-6 border-b border-border-warm flex justify-between items-start shrink-0 bg-workflow-ivory/10">
                <div className="flex flex-col gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold text-xs border w-fit ${
                      selectedAlert.type === 'Interview'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedAlert.type === 'Application'
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span className="mr-1.5">
                      {selectedAlert.type === 'Interview' && '📅'}
                      {selectedAlert.type === 'Application' && '💼'}
                      {selectedAlert.type === 'System' && '⚙️'}
                    </span>
                    {selectedAlert.type}
                  </span>

                  <h2 className="text-xl font-semibold text-deep-charcoal mt-1">
                    {selectedAlert.title}
                  </h2>
                  <p className="text-xs text-slate-ink font-medium">
                    Received: {selectedAlert.receivedText}
                  </p>
                </div>

                {/* Header Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={(e) => handleToggleRead(selectedAlert.id, e)}
                    className="p-2 text-slate-ink hover:text-teal-command hover:bg-surface-container-low rounded-lg transition-colors border border-border-warm"
                    title={selectedAlert.unread ? 'Mark as read' : 'Mark as unread'}
                  >
                    {selectedAlert.unread ? <Icons.mailRead /> : <Icons.unread />}
                  </button>
                  <button
                    onClick={(e) => handleArchive(selectedAlert.id, e)}
                    className="p-2 text-slate-ink hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-border-warm"
                    title="Archive Alert"
                  >
                    <Icons.archive />
                  </button>
                </div>
              </div>

              {/* Detail Body */}
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                {/* Related Object Card */}
                {selectedAlert.relatedJob && (
                  <div className="bg-workflow-ivory border border-border-warm rounded-lg p-4 flex items-center justify-between group cursor-pointer hover:border-teal-command transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white border border-border-warm rounded flex items-center justify-center text-teal-command font-bold text-base shadow-sm">
                        {selectedAlert.senderInitials}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-ink uppercase tracking-wider">
                          Related Job Application
                        </p>
                        <h4 className="text-sm font-semibold text-deep-charcoal mt-0.5">
                          {selectedAlert.relatedJob}
                        </h4>
                      </div>
                    </div>
                    <span className="text-slate-ink group-hover:text-teal-command transition-colors">
                      <Icons.chevronRight />
                    </span>
                  </div>
                )}

                {/* Message Content */}
                <div className="text-sm text-deep-charcoal font-medium whitespace-pre-line leading-relaxed">
                  {selectedAlert.content}
                </div>

                {/* Specific Details Box (Interview specifics) */}
                {selectedAlert.type === 'Interview' && selectedAlert.date && (
                  <div className="bg-surface-container-low border border-border-warm rounded-lg p-4 flex flex-col gap-3 mt-2 shadow-sm">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-deep-charcoal mb-1">
                      Interview Details
                    </h5>

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-ink">
                      <Icons.calendar />
                      <span>Date: {selectedAlert.date}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-ink">
                      <Icons.clock />
                      <span>Time: {selectedAlert.time}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-ink">
                      <Icons.video />
                      <span>Format: {selectedAlert.format}</span>
                    </div>
                  </div>
                )}

                {/* Primary Actions for Interactivity */}
                {selectedAlert.type === 'Interview' && (
                  <div className="flex flex-wrap items-center gap-4 mt-auto pt-6 border-t border-border-warm shrink-0">
                    <button
                      onClick={() => handleConfirmAttendance(selectedAlert.id)}
                      disabled={selectedAlert.attendanceConfirmed}
                      className={`inline-flex items-center justify-center gap-2 font-semibold text-xs px-6 py-2.5 rounded-lg transition-all shadow-sm ${
                        selectedAlert.attendanceConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-teal-command hover:bg-primary text-white active:scale-[0.98]'
                      }`}
                    >
                      {selectedAlert.attendanceConfirmed ? (
                        <>
                          <Icons.checkCircle />
                          Attendance Confirmed
                        </>
                      ) : (
                        <>
                          <Icons.checkCircle />
                          Confirm Attendance
                        </>
                      )}
                    </button>
                    {!selectedAlert.attendanceConfirmed && (
                      <button className="bg-transparent border border-teal-command text-teal-command hover:bg-teal-command/5 font-semibold text-xs px-6 py-2.5 rounded-lg transition-colors active:scale-[0.98]">
                        Propose New Time
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-ink text-xs font-semibold flex-1 flex items-center justify-center">
              Select an alert from the inbox to read details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
