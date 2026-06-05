import React from 'react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col">
      <h1 className="text-[var(--wr-text-2xl)] font-[var(--wr-font-bold)] text-[var(--wr-text-primary)] mt-0 mb-2">
        Admin Console
      </h1>
      <p className="text-[var(--wr-text-base)] text-[var(--wr-text-secondary)] mt-0 mb-8">
        Configure system entities, manage organizations, departments, and user roles.
      </p>

      {/* Grid of stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-10">
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-[var(--wr-text-xs)] font-[var(--wr-font-semibold)] text-[var(--wr-text-secondary)] uppercase mb-2">
            Active Organizations
          </div>
          <div className="text-[2rem] font-[var(--wr-font-bold)] text-[var(--wr-accent-primary)] mb-1">12</div>
          <div className="text-[var(--wr-text-xs)] text-[var(--wr-text-muted)]">+2 this month</div>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-[var(--wr-text-xs)] font-[var(--wr-font-semibold)] text-[var(--wr-text-secondary)] uppercase mb-2">
            Total Departments
          </div>
          <div className="text-[2rem] font-[var(--wr-font-bold)] text-[var(--wr-accent-primary)] mb-1">48</div>
          <div className="text-[var(--wr-text-xs)] text-[var(--wr-text-muted)]">Across all orgs</div>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] p-6 shadow-[var(--wr-shadow-sm)]">
          <div className="text-[var(--wr-text-xs)] font-[var(--wr-font-semibold)] text-[var(--wr-text-secondary)] uppercase mb-2">
            Total System Users
          </div>
          <div className="text-[2rem] font-[var(--wr-font-bold)] text-[var(--wr-accent-primary)] mb-1">1,240</div>
          <div className="text-[var(--wr-text-xs)] text-[var(--wr-text-muted)]">98 active sessions</div>
        </div>
      </div>

      {/* Admin operations */}
      <h2 className="text-[var(--wr-text-lg)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] mt-0 mb-5 border-b border-[var(--wr-border-subtle)] pb-2">
        Quick Configurations
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] py-8 px-6 shadow-[var(--wr-shadow-sm)] flex flex-col items-start">
          <div className="text-[2rem] mb-4">🏢</div>
          <h3 className="text-[var(--wr-text-base)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] mt-0 mb-2">
            Organizations
          </h3>
          <p className="text-[var(--wr-text-sm)] text-[var(--wr-text-secondary)] leading-[var(--wr-leading-normal)] mt-0 mb-6 flex-grow">
            Create new company workspaces, view workspaces listing, and update org domains.
          </p>
          <button className="py-2 px-4 rounded-[var(--wr-radius-md)] border border-[var(--wr-border-strong)] bg-white text-[var(--wr-text-primary)] text-sm font-[var(--wr-font-semibold)] cursor-pointer transition-all hover:bg-[var(--wr-bg-elevated)]">
            Manage Organizations
          </button>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] py-8 px-6 shadow-[var(--wr-shadow-sm)] flex flex-col items-start">
          <div className="text-[2rem] mb-4">📂</div>
          <h3 className="text-[var(--wr-text-base)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] mt-0 mb-2">
            Departments
          </h3>
          <p className="text-[var(--wr-text-sm)] text-[var(--wr-text-secondary)] leading-[var(--wr-leading-normal)] mt-0 mb-6 flex-grow">
            Establish department hierarchies, map parents, and assign official department heads.
          </p>
          <button className="py-2 px-4 rounded-[var(--wr-radius-md)] border border-[var(--wr-border-strong)] bg-white text-[var(--wr-text-primary)] text-sm font-[var(--wr-font-semibold)] cursor-pointer transition-all hover:bg-[var(--wr-bg-elevated)]">
            Configure Departments
          </button>
        </div>
        <div className="bg-[var(--wr-bg-surface)] border border-[var(--wr-border-default)] rounded-[var(--wr-radius-lg)] py-8 px-6 shadow-[var(--wr-shadow-sm)] flex flex-col items-start">
          <div className="text-[2rem] mb-4">👤</div>
          <h3 className="text-[var(--wr-text-base)] font-[var(--wr-font-semibold)] text-[var(--wr-text-primary)] mt-0 mb-2">
            User Directory
          </h3>
          <p className="text-[var(--wr-text-sm)] text-[var(--wr-text-secondary)] leading-[var(--wr-leading-normal)] mt-0 mb-6 flex-grow">
            Modify roles, toggle user activation status, and manage registration codes.
          </p>
          <button className="py-2 px-4 rounded-[var(--wr-radius-md)] border border-[var(--wr-border-strong)] bg-white text-[var(--wr-text-primary)] text-sm font-[var(--wr-font-semibold)] cursor-pointer transition-all hover:bg-[var(--wr-bg-elevated)]">
            Open User Directory
          </button>
        </div>
      </div>
    </div>
  );
};
