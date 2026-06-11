import React, { useMemo, useState } from 'react';

type NotificationType = 'SYSTEM' | 'INTERVIEW' | 'OFFER' | 'REQUEST' | 'TEMPLATE';
type Priority = 'High' | 'Medium' | 'Low';
type DeliveryStatus = 'Failed' | 'Unread' | 'Read' | 'Queued';
type Tab = 'Alerts' | 'Email Queue' | 'Templates' | 'Delivery Logs';

type Notification = {
  id: string;
  type: NotificationType;
  subject: string;
  relatedId: string;
  recipient: string;
  priority: Priority;
  status: DeliveryStatus;
  created: string;
  preview: string;
  retryCount: string;
  errorCode?: string;
};

const kpis = [
  { label: 'Unread Alerts', value: '12', tone: 'text-deep-charcoal', icon: 'mail' },
  { label: 'Failed Deliveries', value: '3', tone: 'text-rejected', icon: 'error' },
  { label: 'Pending Templates', value: '5', tone: 'text-revision', icon: 'edit' },
  { label: 'Resolved Today', value: '28', tone: 'text-approved', icon: 'check' },
];

const notifications: Notification[] = [
  {
    id: 'NTF-8821',
    type: 'SYSTEM',
    subject: 'SMTP Timeout: Interview Invite',
    relatedId: 'REQ-2024-041',
    recipient: 'tran.ngoc.mai@example.com',
    priority: 'High',
    status: 'Failed',
    created: '10:01 AM',
    preview: 'Candidate Tran Ngoc Mai has not received the interview invitation due to an SMTP timeout.',
    retryCount: '1 / 3',
    errorCode: 'ERR_SMTP_451',
  },
  {
    id: 'NTF-8819',
    type: 'INTERVIEW',
    subject: 'Interview Scheduled: James Chen',
    relatedId: 'REQ-2024-032',
    recipient: 'j.chen@web.org',
    priority: 'Medium',
    status: 'Unread',
    created: '09:45 AM',
    preview: 'Interview invitation has been queued for James Chen and the panel members.',
    retryCount: '0 / 3',
  },
  {
    id: 'NTF-8808',
    type: 'OFFER',
    subject: 'Offer Accepted: Sofia Rodriguez',
    relatedId: 'REQ-2024-015',
    recipient: 'sofia.r@tech.com',
    priority: 'High',
    status: 'Read',
    created: 'Yesterday',
    preview: 'Sofia Rodriguez accepted the offer and the hiring workflow can move to onboarding.',
    retryCount: '0 / 3',
  },
  {
    id: 'NTF-8795',
    type: 'REQUEST',
    subject: 'Approval Reminder: Platform Engineer',
    relatedId: 'REQ-2024-051',
    recipient: 'dept.head@company.com',
    priority: 'Medium',
    status: 'Queued',
    created: 'Yesterday',
    preview: 'A reminder notification is queued for the department head approval step.',
    retryCount: '0 / 3',
  },
  {
    id: 'NTF-8787',
    type: 'TEMPLATE',
    subject: 'Template Review Needed: Rejection Mail',
    relatedId: 'TPL-009',
    recipient: 'hr.ops@company.com',
    priority: 'Low',
    status: 'Unread',
    created: 'Jun 08',
    preview: 'The candidate rejection template is pending HR Manager review before dispatch.',
    retryCount: '0 / 3',
  },
];

const iconPaths: Record<string, React.ReactNode> = {
  mail: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  error: <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4" />,
  check: <path d="M20 6 9 17l-5-5" />,
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  refresh: <path d="M20 7v5h-5M4 17v-5h5m9.2-4.2A7 7 0 0 0 6.4 9M5.8 16.2A7 7 0 0 0 17.6 15" />,
  eye: <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  calendar: <path d="M8 2v4m8-4v4M4 10h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
  offer: <path d="M20 12v8H4v-8m16 0H4m16 0-2-6H6l-2 6m8-6v14" />,
  request: <path d="M7 3h7l3 3v15H7zM14 3v4h4M9 12h6M9 16h6" />,
  template: <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h4" />,
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => (
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
    {iconPaths[name]}
  </svg>
);

const typeIcon: Record<NotificationType, string> = {
  SYSTEM: 'error',
  INTERVIEW: 'calendar',
  OFFER: 'offer',
  REQUEST: 'request',
  TEMPLATE: 'template',
};

const typeClass: Record<NotificationType, string> = {
  SYSTEM: 'text-rejected',
  INTERVIEW: 'text-pending',
  OFFER: 'text-primary',
  REQUEST: 'text-teal-command',
  TEMPLATE: 'text-revision',
};

const priorityClass: Record<Priority, string> = {
  High: 'bg-rejected/10 text-rejected',
  Medium: 'bg-pending/10 text-pending',
  Low: 'bg-slate-ink/10 text-slate-ink',
};

const statusClass: Record<DeliveryStatus, string> = {
  Failed: 'bg-error-container text-on-error-container',
  Unread: 'bg-surface-container-high text-on-surface-variant',
  Read: 'bg-approved/10 text-approved',
  Queued: 'bg-revision/10 text-revision',
};

const tabs: Tab[] = ['Alerts', 'Email Queue', 'Templates', 'Delivery Logs'];

export const HRSystemNotifications: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Alerts');
  const [priority, setPriority] = useState<Priority | 'All Priorities'>('All Priorities');
  const [status, setStatus] = useState<DeliveryStatus | 'All Statuses'>('All Statuses');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('NTF-8821');

  const visibleNotifications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesPriority = priority === 'All Priorities' || item.priority === priority;
      const matchesStatus = status === 'All Statuses' || item.status === status;
      const matchesSearch =
        !normalized ||
        [item.type, item.subject, item.relatedId, item.recipient, item.id].some((value) => value.toLowerCase().includes(normalized));
      return matchesPriority && matchesStatus && matchesSearch;
    });
  }, [priority, query, status]);

  const selected = notifications.find((item) => item.id === selectedId) ?? notifications[0];

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0 space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-command">HR Manager Portal</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-deep-charcoal">System Notifications</h1>
            <p className="mt-1 max-w-[72ch] text-sm leading-6 text-slate-ink">
              Manage delivery alerts, email queue status, templates, and candidate-facing notification logs.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" name="search" />
            <input
              className="h-10 w-full rounded-lg border border-border-warm bg-clean-surface pl-10 pr-4 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search system notifications..."
              type="text"
              value={query}
            />
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Notification metrics">
          {kpis.map((kpi) => (
            <section className="rounded-lg border border-border-warm bg-clean-surface p-5 shadow-sm" key={kpi.label}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">{kpi.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <span className={`text-3xl font-semibold ${kpi.tone}`}>{kpi.value}</span>
                <Icon className={`h-6 w-6 ${kpi.tone}`} name={kpi.icon} />
              </div>
            </section>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-border-warm bg-clean-surface shadow-sm">
          <div className="flex overflow-x-auto border-b border-border-warm px-4">
            {tabs.map((item) => (
              <button
                className={`shrink-0 border-b-2 px-5 py-4 text-sm font-semibold transition ${
                  tab === item ? 'border-teal-command text-teal-command' : 'border-transparent text-secondary hover:text-teal-command'
                }`}
                key={item}
                onClick={() => setTab(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-b border-border-warm bg-workflow-ivory/40 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="h-9 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setPriority(event.target.value as Priority | 'All Priorities')}
                value={priority}
              >
                <option>All Priorities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select
                className="h-9 rounded-lg border border-border-warm bg-clean-surface px-3 text-sm outline-none focus:border-teal-command focus:ring-2 focus:ring-teal-command/20"
                onChange={(event) => setStatus(event.target.value as DeliveryStatus | 'All Statuses')}
                value={status}
              >
                <option>All Statuses</option>
                <option>Failed</option>
                <option>Unread</option>
                <option>Read</option>
                <option>Queued</option>
              </select>
            </div>
            <button className="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]" type="button">
              <Icon className="h-4 w-4" name="download" />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-warm bg-clean-surface">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Type</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Subject</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Related ID</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Recipient</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Priority</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Status</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-slate-ink">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {visibleNotifications.map((item) => (
                  <tr
                    className={`group cursor-pointer transition hover:bg-workflow-ivory ${item.id === selectedId ? 'bg-teal-command/5' : item.status === 'Failed' ? 'bg-error-container/10' : ''}`}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                        <Icon className={`h-5 w-5 ${typeClass[item.type]}`} name={typeIcon[item.type]} />
                        {item.type}
                      </div>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-4 text-sm">{item.subject}</td>
                    <td className="px-4 py-4 font-mono text-sm text-secondary">#{item.relatedId}</td>
                    <td className="px-4 py-4 text-sm text-secondary">{item.recipient}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${priorityClass[item.priority]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass[item.status]}`}>{item.status}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-ink">{item.created}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-50 transition group-hover:opacity-100">
                        <button className="rounded-lg p-1.5 transition hover:bg-surface-container hover:text-teal-command" type="button" aria-label={`Retry ${item.id}`}>
                          <Icon className="h-4 w-4" name="refresh" />
                        </button>
                        <button className="rounded-lg p-1.5 transition hover:bg-surface-container hover:text-teal-command" type="button" aria-label={`View ${item.id}`}>
                          <Icon className="h-4 w-4" name="eye" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <aside className="overflow-hidden rounded-lg border border-border-warm bg-parchment-lift shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between border-b border-border-warm p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Alert Detail</p>
            <h2 className="mt-1 text-xl font-semibold text-deep-charcoal">#{selected.id}</h2>
          </div>
          <button className="rounded-lg p-2 transition hover:bg-surface-container-high active:scale-[0.98]" type="button" aria-label="Close detail">
            <Icon className="h-5 w-5" name="close" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          <section className="rounded-lg border border-border-warm bg-workflow-ivory p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-secondary">Message Preview</p>
            <p className="text-sm leading-6 text-on-surface">{selected.preview}</p>
          </section>

          <section className="space-y-1">
            {[
              ['Recipient', selected.recipient],
              ['Retry Count', selected.retryCount],
              ['Error Code', selected.errorCode ?? 'None'],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between gap-4 border-b border-border-warm py-3" key={label}>
                <span className="text-xs font-semibold text-secondary">{label}</span>
                <span className={`text-right font-mono text-sm ${label === 'Error Code' && selected.errorCode ? 'text-rejected' : 'text-deep-charcoal'}`}>{value}</span>
              </div>
            ))}
          </section>

          <section>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-secondary">Delivery Status Timeline</p>
            <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-border-warm">
              <div className="relative">
                <div className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-ink ring-4 ring-parchment-lift" />
                <p className="text-sm font-bold">Created</p>
                <p className="text-xs text-secondary">Today, 10:00 AM</p>
              </div>
              <div className="relative">
                <div className={`absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-parchment-lift ${selected.status === 'Failed' ? 'bg-rejected' : 'bg-approved'}`} />
                <p className={`text-sm font-bold ${selected.status === 'Failed' ? 'text-rejected' : 'text-approved'}`}>
                  {selected.status === 'Failed' ? 'Attempt 1 Failed' : 'Delivered'}
                </p>
                <p className="text-xs text-secondary">{selected.status === 'Failed' ? 'Today, 10:01 AM - Server timed out' : selected.created}</p>
              </div>
              {selected.status === 'Failed' ? (
                <div className="relative">
                  <div className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-revision ring-4 ring-parchment-lift" />
                  <p className="text-sm font-bold text-revision">Retrying Pending</p>
                  <p className="text-xs text-secondary">Scheduled for 10:15 AM</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-3 border-t border-border-warm p-6">
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-command py-3 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]" type="button">
            <Icon className="h-4 w-4" name="refresh" />
            Retry Delivery
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="rounded-lg border border-teal-command py-2.5 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]" type="button">
              Mark Resolved
            </button>
            <button className="rounded-lg border border-teal-command py-2.5 text-sm font-semibold text-teal-command transition hover:bg-teal-command/5 active:scale-[0.98]" type="button">
              Open Request
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
