import React, { useMemo, useState } from 'react';

type RoleKey = 'Admin' | 'Department Head' | 'HR Manager' | 'Candidate';
type NotificationKey = 'approvalAlerts' | 'interviewDigest' | 'weeklyReports' | 'securityNotices';

const roleRows: Array<{
  role: RoleKey;
  users: number;
  permissions: string;
  defaultAccess: 'Full' | 'Scoped' | 'Self-service';
}> = [
  { role: 'Admin', users: 4, permissions: 'System settings, approvals, users, reports', defaultAccess: 'Full' },
  { role: 'Department Head', users: 18, permissions: 'Requests, interviews, department evaluations', defaultAccess: 'Scoped' },
  { role: 'HR Manager', users: 9, permissions: 'Campaigns, tasks, candidates, interviews', defaultAccess: 'Scoped' },
  { role: 'Candidate', users: 324, permissions: 'Profile, CV upload, notifications', defaultAccess: 'Self-service' },
];

const notificationDefaults: Record<NotificationKey, boolean> = {
  approvalAlerts: true,
  interviewDigest: true,
  weeklyReports: false,
  securityNotices: true,
};

const notificationCopy: Record<NotificationKey, { title: string; description: string }> = {
  approvalAlerts: {
    title: 'Approval alerts',
    description: 'Notify admins when requests require approval, rejection, or revision.',
  },
  interviewDigest: {
    title: 'Interview digest',
    description: 'Send daily interview summaries to admins and assigned HR managers.',
  },
  weeklyReports: {
    title: 'Weekly reports',
    description: 'Email weekly recruitment throughput and time-to-hire summaries.',
  },
  securityNotices: {
    title: 'Security notices',
    description: 'Send login, role-change, and policy-change notifications.',
  },
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    org: <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16m4 0v-8a2 2 0 0 0-2-2h-2M9 7h2M9 11h2M9 15h2" />,
    roles: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
    save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z M17 21v-8H7v8M7 3v5h8" />,
    check: <path d="M20 6 9 17l-5-5" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

const SettingsCard = ({ title, description, icon, children }: { title: string; description: string; icon: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-command/10 text-teal-command">
        <Icon name={icon} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-deep-charcoal">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-ink">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

export const AdminSettings: React.FC = () => {
  const [organizationName, setOrganizationName] = useState('Works Recruiter Group');
  const [workspaceDomain, setWorkspaceDomain] = useState('rms.company.vn');
  const [approvalLimit, setApprovalLimit] = useState('75000');
  const [defaultRole, setDefaultRole] = useState<RoleKey>('Candidate');
  const [roleLocked, setRoleLocked] = useState<Record<RoleKey, boolean>>({
    Admin: true,
    'Department Head': true,
    'HR Manager': true,
    Candidate: false,
  });
  const [notifications, setNotifications] = useState(notificationDefaults);
  const [saved, setSaved] = useState(false);

  const activeNotifications = useMemo(() => Object.values(notifications).filter(Boolean).length, [notifications]);

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const toggleRoleLock = (role: RoleKey) => {
    setRoleLocked((current) => ({ ...current, [role]: !current[role] }));
  };

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-teal-command">System administration</p>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">Settings</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-ink">
            Configure organization defaults, role controls, and recruitment notification behavior.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-teal-command px-5 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-primary active:translate-y-0 active:scale-[0.98]"
          onClick={handleSave}
          type="button"
        >
          {saved ? <Icon className="h-4 w-4" name="check" /> : <Icon className="h-4 w-4" name="save" />}
          {saved ? 'Saved' : 'Save settings'}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SettingsCard
          description="Define the workspace identity, allowed domain, and approval threshold for recruitment requests."
          icon="org"
          title="Organization config"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-deep-charcoal">Organization name</span>
              <input
                className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
              <span className="block text-xs text-slate-ink">Displayed across reports and system emails.</span>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-deep-charcoal">Workspace domain</span>
              <input
                className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                value={workspaceDomain}
                onChange={(event) => setWorkspaceDomain(event.target.value)}
              />
              <span className="block text-xs text-slate-ink">Used to validate invited employee accounts.</span>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-deep-charcoal">Admin approval threshold</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-ink">$</span>
                <input
                  className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-7 pr-3 font-mono text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  inputMode="numeric"
                  value={approvalLimit}
                  onChange={(event) => setApprovalLimit(event.target.value.replace(/\D/g, ''))}
                />
              </div>
              <span className="block text-xs text-slate-ink">Requests above this budget require admin review.</span>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-deep-charcoal">Default new-user role</span>
              <select
                className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                value={defaultRole}
                onChange={(event) => setDefaultRole(event.target.value as RoleKey)}
              >
                {roleRows.map((row) => (
                  <option key={row.role} value={row.role}>
                    {row.role}
                  </option>
                ))}
              </select>
              <span className="block text-xs text-slate-ink">Applied to self-service signup requests before admin review.</span>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          description="Control role availability and review the permission surface for each system role."
          icon="roles"
          title="Role management"
        >
          <div className="divide-y divide-border-warm overflow-hidden rounded-xl border border-border-warm">
            {roleRows.map((row) => (
              <div className="grid grid-cols-[1fr_auto] gap-4 bg-workflow-ivory/70 p-4" key={row.role}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-deep-charcoal">{row.role}</h3>
                    <span className="rounded-full bg-clean-surface px-2 py-0.5 font-mono text-xs text-slate-ink">{row.users} users</span>
                    <span className="rounded-full bg-teal-command/10 px-2 py-0.5 text-xs font-semibold text-teal-command">{row.defaultAccess}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-ink">{row.permissions}</p>
                </div>
                <button
                  aria-pressed={roleLocked[row.role]}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition active:scale-[0.98] ${
                    roleLocked[row.role]
                      ? 'bg-teal-command text-white'
                      : 'border border-border-warm bg-white text-slate-ink hover:border-teal-command hover:text-teal-command'
                  }`}
                  onClick={() => toggleRoleLock(row.role)}
                  type="button"
                >
                  {roleLocked[row.role] ? 'Locked' : 'Open'}
                </button>
              </div>
            ))}
          </div>
        </SettingsCard>
      </div>

      <SettingsCard
        description={`${activeNotifications} of ${Object.keys(notifications).length} notification channels are enabled for this workspace.`}
        icon="bell"
        title="Notification preferences"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(Object.keys(notificationCopy) as NotificationKey[]).map((key) => {
            const item = notificationCopy[key];
            const enabled = notifications[key];

            return (
              <button
                aria-pressed={enabled}
                className={`rounded-xl border p-5 text-left transition hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] ${
                  enabled
                    ? 'border-teal-command bg-teal-command/5 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]'
                    : 'border-border-warm bg-workflow-ivory'
                }`}
                key={key}
                onClick={() => toggleNotification(key)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-deep-charcoal">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-ink">{item.description}</p>
                  </div>
                  <span className={`mt-1 flex h-6 w-11 items-center rounded-full p-1 transition ${enabled ? 'bg-teal-command' : 'bg-surface-container-high'}`}>
                    <span className={`h-4 w-4 rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
};
