import React from 'react';

export const DeptHeadDashboard: React.FC = () => {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--wr-text-primary)] mt-0 mb-2">Recruitment Dashboard</h1>
          <p className="text-base text-[var(--wr-text-secondary)] m-0">Create and track staffing requests for your department.</p>
        </div>
        <button className="py-2.5 px-5 rounded-[var(--wr-radius-md)] border-none bg-[var(--wr-accent-primary)] text-[var(--wr-accent-primary-text)] text-sm font-semibold cursor-pointer transition-colors duration-200 hover:bg-[var(--wr-accent-primary-hover)] active:bg-[var(--wr-accent-primary-active)]">➕ Create Recruitment Request</button>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-10">
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-xs font-semibold text-[var(--wr-text-secondary)] uppercase mb-2">Approved Staffing</div>
          <div className="text-3xl font-bold text-[var(--wr-accent-primary)] mb-1">4</div>
          <div className="text-xs text-[var(--wr-text-muted)]">Active search underway</div>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-xs font-semibold text-[var(--wr-text-secondary)] uppercase mb-2">Pending Approval</div>
          <div className="text-3xl font-bold text-[var(--wr-accent-primary)] mb-1">2</div>
          <div className="text-xs text-[var(--wr-text-muted)]">Awaiting Admin review</div>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-xs font-semibold text-[var(--wr-text-secondary)] uppercase mb-2">Open Headcount</div>
          <div className="text-3xl font-bold text-[var(--wr-accent-primary)] mb-1">8</div>
          <div className="text-xs text-[var(--wr-text-muted)]">Target for Q2-Q3</div>
        </div>
      </div>

      {/* Table of requests */}
      <h2 className="text-lg font-semibold text-[var(--wr-text-primary)] mt-0 mb-5 border-b border-[var(--wr-border-subtle)] pb-2">Department Requests</h2>
      <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] shadow-[var(--wr-shadow-sm)] overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[var(--wr-bg-elevated)] border-b border-[var(--wr-border-default)]">
              <th className="p-4 text-xs font-semibold text-[var(--wr-text-secondary)] uppercase">Position</th>
              <th className="p-4 text-xs font-semibold text-[var(--wr-text-secondary)] uppercase">Headcount</th>
              <th className="p-4 text-xs font-semibold text-[var(--wr-text-secondary)] uppercase">Justification</th>
              <th className="p-4 text-xs font-semibold text-[var(--wr-text-secondary)] uppercase">Urgency</th>
              <th className="p-4 text-xs font-semibold text-[var(--wr-text-secondary)] uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--wr-border-subtle)]">
              <td className="p-4 text-sm text-[var(--wr-text-primary)] font-semibold">Senior Backend Engineer</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">2</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">Backfill for key migrations</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">
                <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full inline-block text-[var(--wr-error-text)] bg-[var(--wr-error-bg)] border border-[var(--wr-error-border)]">HIGH</span>
              </td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">
                <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full inline-block text-[var(--wr-warning-text)] bg-[var(--wr-warning-bg)] border border-[var(--wr-warning-border)]">PENDING_REVIEW</span>
              </td>
            </tr>
            <tr className="border-b border-[var(--wr-border-subtle)]">
              <td className="p-4 text-sm text-[var(--wr-text-primary)] font-semibold">Product Designer</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">1</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">Growth in talent tracking system</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">
                <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full inline-block text-[var(--wr-warning-text)] bg-[var(--wr-warning-bg)] border border-[var(--wr-warning-border)]">MEDIUM</span>
              </td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">
                <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full inline-block text-[var(--wr-success-text)] bg-[var(--wr-success-bg)] border border-[var(--wr-success-border)]">APPROVED</span>
              </td>
            </tr>
            <tr className="border-b border-[var(--wr-border-subtle)]">
              <td className="p-4 text-sm text-[var(--wr-text-primary)] font-semibold">QA Specialist</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">1</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">Test automation expansion</td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">
                <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full inline-block text-[var(--wr-neutral-text)] bg-[var(--wr-neutral-bg)] border border-[var(--wr-neutral-border)]">LOW</span>
              </td>
              <td className="p-4 text-sm text-[var(--wr-text-primary)]">
                <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full inline-block text-[var(--wr-neutral-text)] bg-[var(--wr-neutral-bg)] border border-[var(--wr-neutral-border)]">DRAFT</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
