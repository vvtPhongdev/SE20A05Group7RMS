import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  DeptHeadDashboardPage,
  DeptHeadInlineAlert,
  DeptHeadLoadingState,
  DeptHeadPageHeader,
  DeptHeadSearchInput,
} from '../components';

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

interface ApiDepartment {
  id: string;
  name: string;
  code: string;
}

interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  departmentId?: string | null;
  phone?: string | null;
  department?: ApiDepartment | null;
  departmentsHeaded?: ApiDepartment[];
}

interface UserListResponse {
  data: ApiUser[];
}

interface RealtimeTrackingItem {
  id: string;
  targetHeadcount: number;
  filledHeadcount: number;
  status: string;
}

interface NotificationItem {
  id: string;
  isRead: boolean;
}

interface NotificationPreference {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
}

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
    title: 'Capacity Alerts',
    description: 'Notify when requested headcount is close to plan capacity.',
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

const terminalRequestStatuses = new Set(['CLOSED', 'CANCELLED', 'REJECTED']);

const roleLabel = (role: string) =>
  role
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const memberPermission = (member: ApiUser, currentUserId?: string): Permission => {
  if (member.id === currentUserId || member.role === 'DEPARTMENT_HEAD') return 'Full Admin';
  if (member.role === 'HR_LEADER' || member.role === 'HR_RECRUITER') return 'Request Reviewer';
  return 'Interviewer';
};

const primaryDepartment = (profile: ApiUser | null): ApiDepartment | null =>
  profile?.department ?? profile?.departmentsHeaded?.[0] ?? null;

const toTeamMember = (member: ApiUser, currentUserId?: string): TeamMember => ({
  id: member.id,
  name: member.displayName,
  role: member.department?.name
    ? `${roleLabel(member.role)} - ${member.department.name}`
    : roleLabel(member.role),
  email: member.email,
  phone: member.phone || '-',
  permission: memberPermission(member, currentUserId),
});

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
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [requests, setRequests] = useState<RealtimeTrackingItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [selectedPriority, setSelectedPriority] = useState<Priority>('High');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setApiError('');
      try {
        const currentProfile = await apiRequest<ApiUser>('/me/profile', token);
        const department = primaryDepartment(currentProfile);
        const departmentId = department?.id ?? currentProfile.departmentId ?? null;

        const [usersResponse, requestRows, notifications] = await Promise.all([
          apiRequest<UserListResponse>('/users/interviewers', token).catch(() => ({ data: [] })),
          apiRequest<RealtimeTrackingItem[]>('/reports/realtime-tracking', token).catch(
            () => [] as RealtimeTrackingItem[],
          ),
          apiRequest<NotificationItem[]>('/notifications', token).catch(
            () => [] as NotificationItem[],
          ),
        ]);

        const sameDepartmentMembers = usersResponse.data.filter((member) => {
          if (!departmentId) return true;
          return (
            member.departmentId === departmentId ||
            member.department?.id === departmentId ||
            member.departmentsHeaded?.some((item) => item.id === departmentId)
          );
        });
        const normalizedMembers =
          sameDepartmentMembers.length > 0 ? sameDepartmentMembers : [currentProfile];

        setProfile(currentProfile);
        setTeamMembers(
          normalizedMembers
            .map((member) => toTeamMember(member, currentProfile.id))
            .sort((a, b) => (a.id === currentProfile.id ? -1 : b.id === currentProfile.id ? 1 : 0)),
        );
        setRequests(requestRows);
        setUnreadNotifications(notifications.filter((item) => !item.isRead).length);
      } catch (loadError) {
        setApiError(loadError instanceof Error ? loadError.message : 'Unable to load settings');
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [token]);

  const department = primaryDepartment(profile);
  const activeRequests = useMemo(
    () => requests.filter((item) => !terminalRequestStatuses.has(item.status)),
    [requests],
  );
  const totalRequested = requests.reduce((sum, item) => sum + item.targetHeadcount, 0);
  const totalFilled = requests.reduce((sum, item) => sum + item.filledHeadcount, 0);
  const remainingOpen = Math.max(0, totalRequested - totalFilled);
  const utilizedPercent =
    totalRequested > 0 ? Math.min(100, Math.round((totalFilled / totalRequested) * 1000) / 10) : 0;
  const targetPercent = 80;

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
    <DeptHeadDashboardPage>
      <DeptHeadPageHeader
        title="Department Settings"
        description="Department Head Portal configuration workspace"
        actions={
          <DeptHeadSearchInput
            className="lg:min-w-[320px]"
            label="Search settings"
            onChange={setSearchQuery}
            placeholder="Search settings..."
            value={searchQuery}
          />
        }
      />

      {apiError && <DeptHeadInlineAlert>{apiError}</DeptHeadInlineAlert>}
      {loading && <DeptHeadLoadingState label="Loading department settings..." />}

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
                  {department?.name ?? profile?.department?.name ?? 'Department'}
                </h2>
                <p className="mt-1 text-sm font-medium text-on-surface-variant">
                  Led by {profile?.displayName ?? user?.displayName ?? 'Department Head'}
                  {department?.code ? `, ${department.code}` : ''}
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
              This workspace reflects live department profile, team, notification, and recruitment
              activity from RMS. Use it to review current hiring capacity and manage your department
              recruitment preferences.
            </p>
          </div>
        </section>

        <section className="col-span-12 rounded-xl border border-border-warm bg-clean-surface p-6 shadow-sm lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-deep-charcoal">
            <Icon className="h-5 w-5 text-teal-command" name="wallet" />
            Department Hiring Capacity
          </h2>

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-deep-charcoal">{totalRequested}</p>
                <p className="text-xs font-semibold text-on-surface-variant">Requested Roles</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-on-surface-variant">{remainingOpen}</p>
                <p className="text-xs font-semibold text-on-surface-variant">Open Headcount</p>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-teal-command transition-all duration-700"
                style={{ width: `${utilizedPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <span>{utilizedPercent}% Filled</span>
              <span>{activeRequests.length} Active Request{activeRequests.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-border-warm pt-4 text-on-surface-variant">
            <Icon className="h-4 w-4" name="info" />
            <p className="text-xs">Target fill rate: {targetPercent}% for active recruitment plans</p>
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
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-deep-charcoal">
                <Icon className="h-5 w-5 text-teal-command" name="notifications" />
                Notification Preferences
              </h2>
              <span className="rounded-full bg-teal-command/10 px-2.5 py-1 text-xs font-bold text-teal-command">
                {unreadNotifications} unread
              </span>
            </div>

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
    </DeptHeadDashboardPage>
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
