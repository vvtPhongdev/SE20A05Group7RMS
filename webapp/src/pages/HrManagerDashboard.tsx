import React from 'react';

export const HrManagerDashboard: React.FC = () => {
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold text-[var(--wr-text-primary)] mt-0 mb-2">Recruitment Campaigns</h1>
      <p className="text-base text-[var(--wr-text-secondary)] mt-0 mb-8">Oversee approved overall plans, coordinate interview stages, and search talent databases.</p>

      {/* Grid of stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-10">
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-xs font-semibold text-[var(--wr-text-secondary)] uppercase mb-2">Active Campaigns</div>
          <div className="text-3xl font-bold text-[var(--wr-accent-primary)] mb-1">3</div>
          <div className="text-xs text-[var(--wr-text-muted)]">Overall plans approved</div>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-xs font-semibold text-[var(--wr-text-secondary)] uppercase mb-2">Total Candidates</div>
          <div className="text-3xl font-bold text-[var(--wr-accent-primary)] mb-1">124</div>
          <div className="text-xs text-[var(--wr-text-muted)]">With parsed resume structures</div>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-xs font-semibold text-[var(--wr-text-secondary)] uppercase mb-2">Interviews Scheduled</div>
          <div className="text-3xl font-bold text-[var(--wr-accent-primary)] mb-1">6</div>
          <div className="text-xs text-[var(--wr-text-muted)]">Over the next 7 days</div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8">
        {/* Campaign Lists */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[var(--wr-text-primary)] mt-0 mb-5 border-b border-[var(--wr-border-subtle)] pb-2">Campaign Status</h2>
          <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] py-5 px-6 shadow-[var(--wr-shadow-sm)]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-base text-[var(--wr-text-primary)]">Golang Team Growth</span>
              <span className="text-[10px] font-bold text-[var(--wr-success-text)] bg-[var(--wr-success-bg)] border border-[var(--wr-success-border)] py-0.5 px-2 rounded-full">ACTIVE</span>
            </div>
            <p className="text-sm text-[var(--wr-text-secondary)] mt-0 mb-5 leading-normal">Staffing 2 Senior Backend Developers. CV Collection phase.</p>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs text-[var(--wr-text-muted)]">Progress (Overall Plan Target)</div>
              <div className="h-1.5 bg-[var(--wr-bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--wr-accent-primary)] rounded-full w-[40%]"></div>
              </div>
            </div>
          </div>
          <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] py-5 px-6 shadow-[var(--wr-shadow-sm)]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-base text-[var(--wr-text-primary)]">Product Redesign 2026</span>
              <span className="text-[10px] font-bold text-[var(--wr-success-text)] bg-[var(--wr-success-bg)] border border-[var(--wr-success-border)] py-0.5 px-2 rounded-full">ACTIVE</span>
            </div>
            <p className="text-sm text-[var(--wr-text-secondary)] mt-0 mb-5 leading-normal">Staffing 1 Product Designer. Technical Interviewing phase.</p>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs text-[var(--wr-text-muted)]">Progress (Overall Plan Target)</div>
              <div className="h-1.5 bg-[var(--wr-bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--wr-accent-primary)] rounded-full w-[75%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recruiter Tools */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[var(--wr-text-primary)] mt-0 mb-5 border-b border-[var(--wr-border-subtle)] pb-2">Talent Core Tools</h2>
          <div className="flex items-center gap-5 p-5 bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] shadow-[var(--wr-shadow-sm)] cursor-pointer transition-all hover:bg-[var(--wr-bg-elevated)]">
            <div className="text-3xl">🔍</div>
            <div className="flex flex-col gap-1">
              <div className="font-semibold text-sm text-[var(--wr-text-primary)]">Semantic CV Search</div>
              <div className="text-xs text-[var(--wr-text-secondary)] leading-normal">Query resume profiles using natural language matching vector embeddings.</div>
            </div>
          </div>
          <div className="flex items-center gap-5 p-5 bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] shadow-[var(--wr-shadow-sm)] cursor-pointer transition-all hover:bg-[var(--wr-bg-elevated)]">
            <div className="text-3xl">📅</div>
            <div className="flex flex-col gap-1">
              <div className="font-semibold text-sm text-[var(--wr-text-primary)]">Interview Coordinator</div>
              <div className="text-xs text-[var(--wr-text-secondary)] leading-normal">Check time slots, schedule candidate sessions, and record feedback scores.</div>
            </div>
          </div>
          <div className="flex items-center gap-5 p-5 bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] shadow-[var(--wr-shadow-sm)] cursor-pointer transition-all hover:bg-[var(--wr-bg-elevated)]">
            <div className="text-3xl">📑</div>
            <div className="flex flex-col gap-1">
              <div className="font-semibold text-sm text-[var(--wr-text-primary)]">Workflow Approvals</div>
              <div className="text-xs text-[var(--wr-text-secondary)] leading-normal">Review recruitment requests sent by Department Heads and draft plans.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
