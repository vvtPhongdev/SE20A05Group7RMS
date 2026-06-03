'use client';

import React, { useEffect, useState } from 'react';

export default function HRDashBoard() {
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.bg-clean-surface');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        (card as HTMLElement).style.transform = 'translateY(-2px)';
      });
      card.addEventListener('mouseleave', () => {
        (card as HTMLElement).style.transform = 'translateY(0px)';
      });
    });

    return () => {
      cards.forEach(card => {
        card.removeEventListener('mouseenter', () => {});
        card.removeEventListener('mouseleave', () => {});
      });
    };
  }, []);

  const tabs = [
    'Pending Review (8)',
    'Under Review (3)',
    'Forwarded to Admin (5)',
    'Returned (2)',
  ];

  const requests = [
    {
      id: '#REQ-2024-041',
      title: 'Senior Backend Engineer',
      priority: 'Critical Priority',
      priorityColor: 'rejected',
      department: 'IT Dept',
      requestedBy: 'Dr. Nguyen Van B.',
      submitted: 'May 27',
      headcount: 2,
      type: 'Full-time',
      budget: '₫25M/person',
      budgetLabel: 'Monthly Budget',
    },
    {
      id: '#REQ-2024-045',
      title: 'Product Designer',
      priority: 'High Priority',
      priorityColor: 'revision',
      department: 'Design & UX Dept',
      requestedBy: 'Ms. Tran Thi C.',
      submitted: 'May 27',
      headcount: 1,
      type: 'Full-time',
      budget: '₫22M/person',
      budgetLabel: 'Monthly Budget',
    },
    {
      id: '#REQ-2024-049',
      title: 'Marketing Specialist',
      priority: 'Normal Priority',
      priorityColor: 'teal-command',
      department: 'Marketing Dept',
      requestedBy: 'Mr. Vu Huy D.',
      submitted: 'May 26',
      headcount: 1,
      type: 'Full-time',
      budget: '₫18M/person',
      budgetLabel: 'Monthly Budget',
    },
    {
      id: '#REQ-2024-052',
      title: 'HR Coordinator',
      priority: 'Normal Priority',
      priorityColor: 'teal-command',
      department: 'Human Resources',
      requestedBy: 'Ms. Ly Minh E.',
      submitted: 'May 25',
      headcount: 1,
      type: 'Full-time',
      budget: '₫15M/person',
      budgetLabel: 'Monthly Budget',
    },
    {
      id: '#REQ-2024-055',
      title: 'Data Analyst Intern',
      priority: 'Low Priority',
      priorityColor: 'slate-ink',
      department: 'Data Intelligence',
      requestedBy: 'Mr. Pham Minh F.',
      submitted: 'May 24',
      headcount: 3,
      type: 'Internship',
      budget: '₫6M/person',
      budgetLabel: 'Monthly Stipend',
    },
  ];

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] h-screen fixed left-0 top-0 z-40 bg-parchment-lift border-r border-border-warm flex flex-col p-6">
        {/* Logo */}
        <div className="mb-8 px-2 flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-command flex items-center justify-center rounded-lg shadow-sm">
            <span className="text-white font-bold text-5xl leading-none">R</span>
          </div>
          <div>
            <h1 className="font-bold text-2xl text-teal-command leading-none">RMS</h1>
            <p className="text-slate-ink text-xs uppercase tracking-widest mt-1 opacity-70">Enterprise RMS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white text-teal-command font-bold rounded-lg transition-transform active:scale-[0.98] border-l-4 border-teal-command">
            <span className="material-symbols-outlined text-teal-command">queue</span>
            <span className="text-sm">Request Queue</span>
          </a>
          {['Plan Management', 'Task Plans', 'Candidates', 'CV Search', 'Interviews', 'Results', 'Communications', 'Tracking'].map((item) => (
            <a
              key={item}
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-slate-ink hover:bg-surface-container transition-colors duration-200 rounded-lg active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">{item.toLowerCase().replace(/\s+/g, '_')}</span>
              <span className="text-sm">{item}</span>
            </a>
          ))}

          {/* Settings Section */}
          <div className="pt-6 mt-6 border-t border-border-warm space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-ink hover:bg-surface-container transition-colors duration-200 rounded-lg active:scale-[0.98]">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm">Settings</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-ink hover:bg-surface-container transition-colors duration-200 rounded-lg active:scale-[0.98]">
              <span className="material-symbols-outlined">help_outline</span>
              <span className="text-sm">Support</span>
            </a>
          </div>
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-6 border-t border-border-warm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                alt="Le Thi Hang"
                className="w-10 h-10 rounded-full border border-teal-command/20 object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO-QKaXjBD0d8VLkJxdfz-QtiMi82FUV4Fj2bgC8FLSuCzKgtKJeSphbgz8oQS7XYzbyccoqjJoXABG78aJn3hZ01dnTUlQ5DzFJ-FvAKNYXGT806WhZYk9HvDSYS-KUlxklmljms41HyDEjqTPr3WyT9NmCBJK4EeLDv7tw0o9lR3j9fqfrdUsVXZDuB7MEiFIC43Vmg9OB3WRn4iUrGsWgkGFzn9vtHIrH4jPLej7-UwLOFSq6zeeza0VgCnnuEf91q5dkytVSk"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-parchment-lift rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Le Thi Hang</span>
              <span className="text-[10px] uppercase font-bold text-teal-command bg-teal-command/10 px-1.5 py-0.5 rounded border border-teal-command/20 w-fit">HR Manager</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[260px] flex-1 min-h-screen bg-workflow-ivory flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between h-20 px-6 sticky top-0 bg-workflow-ivory/80 backdrop-blur-md z-30 border-b border-border-warm">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-deep-charcoal">Request Review Queue</h2>
            <p className="text-secondary text-sm">Incoming recruitment requests from Department Heads</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="absolute inset-y-0 left-3 flex items-center text-outline">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input className="pl-10 pr-4 py-2 bg-white border border-border-warm rounded-lg focus:ring-2 focus:ring-teal-command focus:border-teal-command outline-none transition-all w-64 text-sm" placeholder="Search requests..." type="text" />
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="px-4 py-2 bg-teal-command text-white rounded-lg text-sm font-medium hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Requisition
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6 flex gap-6 max-w-[1440px] mx-auto w-full">
          {/* Center Column */}
          <div className="flex-1 space-y-6">
            {/* Tabs */}
            <div className="flex items-center justify-between">
              <nav className="flex gap-8 border-b border-border-warm w-full">
                {tabs.map((tab, index) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(index)}
                    className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      activeTab === index
                        ? 'border-teal-command text-teal-command font-bold'
                        : 'border-transparent text-secondary hover:text-teal-command'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-2 bg-revision/10 border border-revision/20 text-revision px-3 py-1 rounded-full whitespace-nowrap ml-4">
                <span className="w-2 h-2 bg-revision rounded-full animate-pulse"></span>
                <span className="text-xs font-bold">8 pending review</span>
              </div>
            </div>

            {/* Request Cards */}
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-white border border-border-warm rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-teal-command/40 transition-all">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${request.priorityColor === 'rejected' ? 'bg-rejected' : request.priorityColor === 'revision' ? 'bg-revision' : request.priorityColor === 'slate-ink' ? 'bg-slate-ink' : 'bg-teal-command'}`}></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${request.priorityColor === 'rejected' ? 'bg-rejected/10 text-rejected border-rejected/20' : request.priorityColor === 'revision' ? 'bg-revision/10 text-revision border-revision/20' : request.priorityColor === 'slate-ink' ? 'bg-slate-ink/10 text-slate-ink border-slate-ink/20' : 'bg-teal-command/10 text-teal-command border-teal-command/20'}`}>{request.priority}</span>
                        <span className="text-secondary text-sm">• ID: {request.id}</span>
                      </div>
                      <h3 className="text-xl font-bold text-deep-charcoal group-hover:text-teal-command transition-colors">{request.title}</h3>
                      <p className="text-secondary text-sm mt-1">{request.department} • Requested by: <span className="font-medium text-on-surface">{request.requestedBy}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-secondary mb-1">Submitted: {request.submitted}</p>
                      <div className="flex gap-2">
                        <span className="bg-workflow-ivory border border-border-warm px-3 py-1 rounded text-xs font-medium">Headcount: {request.headcount}</span>
                        <span className="bg-workflow-ivory border border-border-warm px-3 py-1 rounded text-xs font-medium">{request.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border-warm/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-[18px]">payments</span>
                      <span className="text-sm font-bold text-on-surface">{request.budget}</span>
                      <span className="text-secondary text-xs">{request.budgetLabel}</span>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-6 py-2 border border-teal-command text-teal-command hover:bg-teal-command hover:text-white rounded-lg text-sm font-medium transition-all active:scale-95">Return for Revision</button>
                      <button className="px-8 py-2 bg-teal-command text-white hover:brightness-110 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-sm shadow-teal-command/20">Review</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center py-8 gap-4">
              <p className="text-secondary text-sm">
                Showing <span className="font-bold text-on-surface">5</span> of <span className="font-bold text-on-surface">8</span> pending requests
              </p>
              <button className="px-8 py-3 bg-white border border-border-warm text-on-surface hover:bg-surface-container transition-all rounded-lg text-sm font-medium shadow-sm active:scale-95 flex items-center gap-2">
                Load More Requests
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-[300px] flex flex-col gap-6">
            {/* Queue Summary */}
            <div className="bg-white border border-border-warm rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-teal-command">dashboard_customize</span>
                <h4 className="text-xl font-bold">Queue Summary</h4>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-secondary text-xs">Average Review Time</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-on-surface">2.3</span>
                    <span className="text-secondary text-sm">days</span>
                  </div>
                  <div className="w-full bg-workflow-ivory h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-command h-full w-[65%]" title="Efficiency Rate"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-revision/5 rounded-lg border border-revision/10">
                  <span className="text-secondary text-xs">Oldest Pending Request</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-revision">5 days</span>
                    <span className="material-symbols-outlined text-revision animate-bounce">priority_high</span>
                  </div>
                  <p className="text-[11px] text-revision/80 mt-1 italic">Action recommended for SLAs</p>
                </div>
                <div className="space-y-3 pt-4 border-t border-border-warm/40">
                  <h5 className="text-on-surface text-xs font-bold uppercase tracking-wider">This Week Performance</h5>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-approved"></div>
                      <span className="text-secondary text-sm">Reviewed</span>
                    </div>
                    <span className="font-bold text-on-surface">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pending"></div>
                      <span className="text-secondary text-sm">Forwarded</span>
                    </div>
                    <span className="font-bold text-on-surface">2</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Distribution */}
            <div className="bg-white border border-border-warm rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold mb-4">Request Distribution</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-workflow-ivory flex items-center justify-center text-teal-command">
                    <span className="material-symbols-outlined">computer</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">IT & Eng</span>
                      <span className="text-xs text-secondary">42%</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="bg-teal-command h-full w-[42%]"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-workflow-ivory flex items-center justify-center text-teal-command">
                    <span className="material-symbols-outlined">palette</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">Design</span>
                      <span className="text-xs text-secondary">28%</span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="bg-teal-command h-full w-[28%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Banner */}
            <div className="relative overflow-hidden rounded-xl bg-teal-command h-32 group cursor-pointer">
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6emTQiHCoi08N1Z4rqLfXD7Weu5-durGi3ttQH49sL13n0vQX7QFae0B1o1iNzvdxzLpsc6ezFd6l_pJCMjYbcM9xTT4qVQwDVTQqAx_qemDJh33ZeELe-Mv7uDqfQrs9sXi6F1n1Gj44U0uY6m_rLlrfEjXvYvHzskEEJAczIe0cX02S_gfgj0HlJxrO4vI1rbiEAi6o_89mGbhIOvAvU1vVoeNqqWR83-v8WAoSk-CJkxjlL34XMyVQnzMRf8vZ6yxsQO9C8zQ"
              />
              <div className="absolute inset-0 p-5 flex flex-col justify-end bg-gradient-to-t from-teal-command to-transparent">
                <span className="text-white font-bold text-sm">Need assistance?</span>
                <p className="text-teal-100 text-[12px]">Schedule a sync with the recruitment admin team.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}