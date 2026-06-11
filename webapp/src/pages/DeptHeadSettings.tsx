import React, { useMemo, useState } from 'react';

type Permission = 'Full Admin' | 'Interviewer' | 'Request Reviewer';
type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  permission: Permission;
}

interface NotificationPreference {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
}

const teamMembers: TeamMember[] = [
  {
    id: 'TM-001',
    name: 'Jordan Smith',
    role: 'Lead Developer',
    email: 'j.smith@rms.com',
    phone: '+1 (555) 123-4567',
    permission: 'Full Admin',
  },
  {
    id: 'TM-002',
    name: 'Maria Lopez',
    role: 'Senior QA Engineer',
    email: 'm.lopez@rms.com',
    phone: '+1 (555) 987-6543',
    permission: 'Interviewer',
  },
  {
    id: 'TM-003',
    name: 'David Wong',
    role: 'Cloud Architect',
    email: 'd.wong@rms.com',
    phone: '+1 (555) 444-3322',
    permission: 'Full Admin',
  },
];

const initialPreferences: NotificationPreference[] = [
  {
    key: 'applications',
    title: 'New Applications',
    description: 'Get notified immediately when someone applies.',
    enabled: true,
  },
  {
    key: 'digest',
    title: 'Daily Interview Digest',
    description: 'Summarized report of upcoming interviews.',
    enabled: true,
  },
  {
    key: 'budget',
    title: 'Budget Alerts',
    description: 'Notify when 90% of budget is reached.',
    enabled: false,
    disabled: true,
  },
];

const priorityOptions: Array<{ value: Priority; response: string; className: string }> = [
  { value: 'Critical', response: '24h Response', className: 'text-error' },
  { value: 'High', response: '72h Response', className: 'text-teal-command' },
  { value: 'Medium', response: '5-7 Days', className: 'text-pending' },
  { value: 'Low', response: '14 Days', className: 'text-draft' },
];

const permissionStyles: Record<Permission, string> = {
  'Full Admin': 'bg-surface-container-high text-on-surface',
  Interviewer: 'bg-surface-container-high text-on-surface',
  'Request Reviewer': 'bg-surface-container-high text-on-surface',
};

const permissionDotStyles: Record<Permission, string> = {
  'Full Admin': 'bg-teal-command',
  Interviewer: 'bg-pending',
  'Request Reviewer': 'bg-revision',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    wallet: (
      <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1m0-10h-7a2 2 0 0 0 0 4h7V7Zm-3 2h.01" />
    ),
    edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
    engineering: <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
    more: <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
    notifications: <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
    priority: <path d="M12 7v6m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
    search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
    check: <path d="M20 6 9 17l-5-5" />,
    plus: <path d="M12 5v14M5 12h14" />,
    info: <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />,
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

export const DeptHeadSettings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [preferences, setPreferences] = useState(initialPreferences);
  const [selectedPriority, setSelectedPriority] = useState<Priority>('High');
  const [showToast, setShowToast] = useState(false);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return teamMembers;

    return teamMembers.filter((member) =>
      [member.name, member.role, member.email, member.permission].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [searchQuery]);

  const showSavedToast = () => {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2400);
  };

  const togglePreference = (key: string) => {
    setPreferences((current) =>
      current.map((preference) =>
        preference.key === key && !preference.disabled
          ? { ...preference, enabled: !preference.enabled }
          : preference,
      ),
    );
    showSavedToast();
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">
            Department Settings
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Department Head Portal configuration workspace
          </p>
        </div>

        <label className="relative block lg:min-w-[320px]">
          <span className="sr-only">Search settings</span>
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            name="search"
          />
          <input
            className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-4 text-sm outline-none transition focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search settings..."
            type="search"
            value={searchQuery}
          />
        </label>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 flex flex-col gap-6 rounded-xl border border-border-warm bg-clean-surface p-6 shadow-sm lg:col-span-8 lg:flex-row lg:items-start">
          <div className="grid h-32 w-32 shrink-0 place-items-center rounded-lg bg-surface-container text-teal-command">
            <Icon className="h-12 w-12" name="engineering" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="mb-2 inline-block rounded bg-teal-command/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-teal-command">
                  Department Identity
                </span>
                <h2 className="text-2xl font-semibold text-deep-charcoal">
                  Engineering & Infrastructure
                </h2>
                <p className="mt-1 text-sm font-medium text-on-surface-variant">
                  Led by Alex Sterling, Director of Engineering
                </p>
              </div>
              <button
                className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-teal-command px-4 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]"
                onClick={showSavedToast}
                type="button"
              >
                <Icon className="h-4 w-4" name="edit" />
                Edit Profile
              </button>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface">
              Our mission is to build scalable, resilient systems that power the RMS ecosystem. We
              focus on technological excellence, automation-first processes, and a collaborative
              environment for engineers to thrive and innovate.
            </p>
          </div>
        </section>

        <section className="col-span-12 rounded-xl border border-border-warm bg-clean-surface p-6 shadow-sm lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-deep-charcoal">
            <Icon className="h-5 w-5 text-teal-command" name="wallet" />
            Q3 Recruitment Budget
          </h2>

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-deep-charcoal">$142,500</p>
                <p className="text-xs font-semibold text-on-surface-variant">Total Allocated</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-on-surface-variant">$38,200</p>
                <p className="text-xs font-semibold text-on-surface-variant">Remaining</p>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full w-[73.2%] rounded-full bg-teal-command transition-all duration-700" />
            </div>

            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <span>73.2% Utilized</span>
              <span>Target: &lt; 80%</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-border-warm pt-4 text-on-surface-variant">
            <Icon className="h-4 w-4" name="info" />
            <p className="text-xs">Next budget review: Sep 15, 2026</p>
          </div>
        </section>

        <section className="col-span-12 overflow-hidden rounded-xl border border-border-warm bg-clean-surface shadow-sm lg:col-span-7">
          <div className="flex flex-col gap-3 border-b border-border-warm px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-deep-charcoal">Team Management</h2>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
              onClick={showSavedToast}
              type="button"
            >
              <Icon className="h-4 w-4" name="plus" />
              Add Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-border-warm bg-workflow-ivory">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Name & Role
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {filteredMembers.map((member) => (
                  <tr className="transition hover:bg-teal-command/5" key={member.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialAvatar name={member.name} />
                        <div>
                          <p className="text-sm font-semibold text-deep-charcoal">{member.name}</p>
                          <p className="text-xs text-on-surface-variant">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm leading-6 text-on-surface-variant">
                      {member.email}
                      <br />
                      {member.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border border-border-warm px-2.5 py-1 text-xs font-medium ${permissionStyles[member.permission]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${permissionDotStyles[member.permission]}`}
                        />
                        {member.permission}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        aria-label={`Open actions for ${member.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container hover:text-teal-command active:scale-[0.98]"
                        onClick={showSavedToast}
                        type="button"
                      >
                        <Icon className="h-5 w-5" name="more" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="border-t border-border-warm px-6 py-12 text-center">
              <p className="text-sm font-semibold text-deep-charcoal">No team members found</p>
              <p className="mt-1 text-sm text-slate-ink">Try a different search term.</p>
            </div>
          )}
        </section>

        <section className="col-span-12 flex flex-col gap-6 lg:col-span-5">
          <div className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-deep-charcoal">
              <Icon className="h-5 w-5 text-teal-command" name="notifications" />
              Notification Preferences
            </h2>

            <div className="space-y-6">
              {preferences.map((preference) => (
                <div
                  className={`flex items-center justify-between gap-4 ${preference.disabled ? 'opacity-60' : ''}`}
                  key={preference.key}
                >
                  <div>
                    <p className="text-sm font-semibold text-deep-charcoal">{preference.title}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{preference.description}</p>
                  </div>
                  <button
                    aria-pressed={preference.enabled}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition active:scale-[0.98] ${
                      preference.enabled ? 'bg-teal-command' : 'bg-surface-variant'
                    } ${preference.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={preference.disabled}
                    onClick={() => togglePreference(preference.key)}
                    type="button"
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full border bg-white transition-transform ${
                        preference.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-deep-charcoal">
              <Icon className="h-5 w-5 text-teal-command" name="priority" />
              Default Request Priorities
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {priorityOptions.map((priority) => (
                <button
                  className={`rounded-lg border p-3 text-center transition hover:border-teal-command active:scale-[0.98] ${
                    selectedPriority === priority.value
                      ? 'border-2 border-teal-command bg-clean-surface shadow-sm'
                      : 'border-border-warm bg-workflow-ivory'
                  }`}
                  key={priority.value}
                  onClick={() => {
                    setSelectedPriority(priority.value);
                    showSavedToast();
                  }}
                  type="button"
                >
                  <p className={`font-bold ${priority.className}`}>{priority.value}</p>
                  <p className="text-[10px] text-on-surface-variant">{priority.response}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div
        className={`fixed bottom-8 right-8 flex items-center gap-3 rounded-lg bg-inverse-surface px-6 py-3 text-inverse-on-surface shadow-xl transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        <Icon className="h-5 w-5 text-teal-command" name="check" />
        <p className="text-sm font-semibold">Settings updated successfully.</p>
      </div>
    </div>
  );
};

const InitialAvatar = ({ name }: { name: string }) => (
  <div className="grid h-10 w-10 place-items-center rounded-full border border-border-warm bg-surface-container text-xs font-bold text-teal-command">
    {name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')}
  </div>
);
