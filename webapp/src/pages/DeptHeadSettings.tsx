import React, { useMemo, useState, useEffect } from 'react';

type MemberRole =
  | 'Department Head'
  | 'Technical Interviewer'
  | 'Recruiter'
  | 'Senior Engineer'
  | 'Software Engineer'
  | 'QA Engineer';
type MemberStatus = 'Active' | 'Inactive';

interface DepartmentMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  dateJoined: string;
}

interface NotificationPrefs {
  requestLifecycle: boolean;
  planReady: boolean;
  interviewUpdates: boolean;
  weeklyDigest: boolean;
  panelAlerts: boolean;
}

const defaultMembers: DepartmentMember[] = [
  {
    id: 'MEM-001',
    name: 'Le Minh Khoa',
    email: 'khoa.le@rms.company.vn',
    role: 'Department Head',
    status: 'Active',
    dateJoined: '2024-01-15',
  },
  {
    id: 'MEM-002',
    name: 'Nguyen Van Binh',
    email: 'binh.nguyen@rms.company.vn',
    role: 'Technical Interviewer',
    status: 'Active',
    dateJoined: '2024-06-20',
  },
  {
    id: 'MEM-003',
    name: 'Tran Thi Cat',
    email: 'cat.tran@rms.company.vn',
    role: 'Senior Engineer',
    status: 'Active',
    dateJoined: '2024-08-11',
  },
  {
    id: 'MEM-004',
    name: 'Pham Minh Dung',
    email: 'dung.pham@rms.company.vn',
    role: 'Recruiter',
    status: 'Active',
    dateJoined: '2025-02-05',
  },
  {
    id: 'MEM-005',
    name: 'Hoang Quoc Dat',
    email: 'dat.hoang@rms.company.vn',
    role: 'Software Engineer',
    status: 'Inactive',
    dateJoined: '2025-10-18',
  },
];

const defaultPrefs: NotificationPrefs = {
  requestLifecycle: true,
  planReady: true,
  interviewUpdates: true,
  weeklyDigest: false,
  panelAlerts: true,
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    dept: <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7M12 11V3m-4 4h8" />,
    members: (
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    ),
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
    save: (
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z M17 21v-8H7v8M7 3v5h8" />
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
    plus: <path d="M12 5v14m-7-7h14" />,
    edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
    trash: (
      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    ),
    close: <path d="M18 6 6 18M6 6l12 12" />,
    warning: (
      <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    ),
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

const SettingsCard = ({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) => (
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

export const DeptHeadSettings: React.FC = () => {
  // --- Form States ---
  const [deptName, setDeptName] = useState('Information Technology');
  const [deptCode, setDeptCode] = useState('IT');
  const [parentDept, setParentDept] = useState('Executive');
  const [headUserId, setHeadUserId] = useState('MEM-001');

  const [members, setMembers] = useState<DepartmentMember[]>(defaultMembers);
  const [notifications, setNotifications] = useState<NotificationPrefs>(defaultPrefs);

  // --- UI feedback states ---
  const [saved, setSaved] = useState(false);

  // --- CRUD Modals states ---
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingMember, setEditingMember] = useState<DepartmentMember | null>(null);

  // Member form state
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<MemberRole>('Software Engineer');
  const [memberStatus, setMemberStatus] = useState<MemberStatus>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Member Confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<DepartmentMember | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const storedDeptName = localStorage.getItem('dept_name');
    const storedDeptCode = localStorage.getItem('dept_code');
    const storedParentDept = localStorage.getItem('parent_dept');
    const storedHeadId = localStorage.getItem('head_user_id');
    const storedMembers = localStorage.getItem('dept_members');
    const storedPrefs = localStorage.getItem('dept_notifications');

    if (storedDeptName) setDeptName(storedDeptName);
    if (storedDeptCode) setDeptCode(storedDeptCode);
    if (storedParentDept) setParentDept(storedParentDept);
    if (storedHeadId) setHeadUserId(storedHeadId);
    if (storedMembers) {
      try {
        setMembers(JSON.parse(storedMembers));
      } catch (e) {
        console.error('Failed to parse stored members', e);
      }
    }
    if (storedPrefs) {
      try {
        setNotifications(JSON.parse(storedPrefs));
      } catch (e) {
        console.error('Failed to parse stored notifications', e);
      }
    }
  }, []);

  // Save Settings handler
  const handleSaveSettings = () => {
    localStorage.setItem('dept_name', deptName);
    localStorage.setItem('dept_code', deptCode);
    localStorage.setItem('parent_dept', parentDept);
    localStorage.setItem('head_user_id', headUserId);
    localStorage.setItem('dept_members', JSON.stringify(members));
    localStorage.setItem('dept_notifications', JSON.stringify(notifications));

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  // Synchronize department head role in member list
  useEffect(() => {
    setMembers((current) =>
      current.map((m) => {
        if (m.id === headUserId) {
          return { ...m, role: 'Department Head', status: 'Active' };
        }
        if (m.role === 'Department Head' && m.id !== headUserId) {
          return { ...m, role: 'Technical Interviewer' }; // Fallback role for former head
        }
        return m;
      }),
    );
  }, [headUserId]);

  // Handle Opening Create Modal
  const openCreateModal = () => {
    setModalType('create');
    setEditingMember(null);
    setMemberName('');
    setMemberEmail('');
    setMemberRole('Software Engineer');
    setMemberStatus('Active');
    setFormError(null);
    setModalOpen(true);
  };

  // Handle Opening Edit Modal
  const openEditModal = (member: DepartmentMember) => {
    setModalType('edit');
    setEditingMember(member);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMemberRole(member.role);
    setMemberStatus(member.status);
    setFormError(null);
    setModalOpen(true);
  };

  // Save member form
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!memberName.trim() || !memberEmail.trim()) {
      setFormError('Please fill in both name and email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (modalType === 'create') {
      const isEmailDuplicate = members.some(
        (m) => m.email.toLowerCase() === memberEmail.trim().toLowerCase(),
      );
      if (isEmailDuplicate) {
        setFormError('A member with this email address already exists in the department.');
        return;
      }

      const newMember: DepartmentMember = {
        id: `MEM-${String(members.length + 1).padStart(3, '0')}`,
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
        role: memberRole,
        status: memberStatus,
        dateJoined: new Date().toISOString().split('T')[0],
      };

      const updated = [newMember, ...members];
      setMembers(updated);
      localStorage.setItem('dept_members', JSON.stringify(updated));
    } else if (modalType === 'edit' && editingMember) {
      // If we change current head's status to inactive or role to something else, prompt warning or handle
      if (
        editingMember.id === headUserId &&
        (memberStatus === 'Inactive' || memberRole !== 'Department Head')
      ) {
        setFormError(
          'Cannot change role or deactivate the active Department Head. Assign a new Head first.',
        );
        return;
      }

      const updated = members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: memberName.trim(),
              email: memberEmail.trim().toLowerCase(),
              role: memberRole,
              status: memberStatus,
            }
          : m,
      );
      setMembers(updated);
      localStorage.setItem('dept_members', JSON.stringify(updated));
    }

    setModalOpen(false);
  };

  // Handle Delete Confirmation Dialog
  const triggerDelete = (member: DepartmentMember) => {
    if (member.id === headUserId) {
      alert('Cannot delete the active Department Head. Please assign another head user first.');
      return;
    }
    setMemberToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      const updated = members.filter((m) => m.id !== memberToDelete.id);
      setMembers(updated);
      localStorage.setItem('dept_members', JSON.stringify(updated));
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    }
  };

  // Toggle Notification preferences
  const handleTogglePref = (key: keyof NotificationPrefs) => {
    setNotifications((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const searchNorm = memberSearch.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch =
        !searchNorm ||
        member.name.toLowerCase().includes(searchNorm) ||
        member.email.toLowerCase().includes(searchNorm);
      const matchesRole = roleFilter === 'All' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, memberSearch, roleFilter, statusFilter]);

  // Potential department heads (must have ACTIVE status or be the current head)
  const eligibleHeads = useMemo(() => {
    return members.filter((m) => m.status === 'Active' || m.id === headUserId);
  }, [members, headUserId]);

  const rolesList: string[] = [
    'All',
    'Department Head',
    'Technical Interviewer',
    'Recruiter',
    'Senior Engineer',
    'Software Engineer',
    'QA Engineer',
  ];

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-command">
            Department Management
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">
            Department Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-ink">
            Configure department parameters, assign status roles, manage staff lists, and customize
            notification routes.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-command px-5 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-primary active:translate-y-0 active:scale-[0.98] sm:w-auto"
          onClick={handleSaveSettings}
          type="button"
        >
          {saved ? (
            <Icon className="h-4 w-4" name="check" />
          ) : (
            <Icon className="h-4 w-4" name="save" />
          )}
          {saved ? 'Settings Saved' : 'Save settings'}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left column: Department Details */}
        <div className="flex flex-col gap-6">
          <SettingsCard
            description="Manage the general profile identifiers and direct structural relationships of this organizational division."
            icon="dept"
            title="Department Details"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-deep-charcoal">Department name</span>
                <input
                  className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                />
                <span className="block text-xs text-slate-ink">
                  Displayed on Job Descriptions and Candidate invitations.
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-deep-charcoal">Department code</span>
                <input
                  className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm font-mono outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                />
                <span className="block text-xs text-slate-ink">
                  Short identifier prefix for tracking recruitment requests.
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-deep-charcoal">Parent department</span>
                <select
                  className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  value={parentDept}
                  onChange={(e) => setParentDept(e.target.value)}
                >
                  <option value="None">None (Top Level)</option>
                  <option value="Executive">Executive Office</option>
                  <option value="Human Resources">Human Resources (HR)</option>
                  <option value="Finance & Admin">Finance & Administration</option>
                </select>
                <span className="block text-xs text-slate-ink">
                  Defines request escalation rules in the hierarchy.
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-deep-charcoal">
                  Department Head (Active)
                </span>
                <select
                  className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  value={headUserId}
                  onChange={(e) => setHeadUserId(e.target.value)}
                >
                  {eligibleHeads.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                <span className="block text-xs text-slate-ink text-rejected">
                  Warning: Changing this immediately assigns system request approvals to this user.
                </span>
              </label>
            </div>
          </SettingsCard>

          {/* Member List Section */}
          <section className="rounded-xl border border-border-warm bg-clean-surface p-6 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-command/10 text-teal-command">
                  <Icon name="members" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-deep-charcoal">Department Staff</h2>
                  <p className="mt-1 text-sm text-slate-ink">
                    Manage members assigned to participate in technical screening or routing panels.
                  </p>
                </div>
              </div>
              <button
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-teal-command px-4 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                onClick={openCreateModal}
                type="button"
              >
                <Icon className="h-4 w-4" name="plus" />
                Add staff
              </button>
            </div>

            {/* Filter Bar */}
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="relative flex-1 max-w-md">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                  <Icon className="h-4 w-4 text-slate-ink/50" name="search" />
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  placeholder="Search staff name or email..."
                  type="search"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <select
                  className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm font-medium text-deep-charcoal outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  {rolesList.map((role) => (
                    <option key={role} value={role}>
                      {role === 'All' ? 'All Roles' : role}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm font-medium text-deep-charcoal outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Member Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-y border-border-warm bg-workflow-ivory text-xs font-semibold uppercase tracking-[0.04em] text-on-surface-variant">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Department Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm text-sm">
                  {filteredMembers.map((member) => (
                    <tr className="transition hover:bg-workflow-ivory/50" key={member.id}>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-semibold text-deep-charcoal">{member.name}</p>
                          <p className="text-xs text-slate-ink">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            member.role === 'Department Head'
                              ? 'border-teal-command/20 bg-teal-command/5 text-teal-command'
                              : member.role === 'Technical Interviewer'
                                ? 'border-yellow-600/20 bg-yellow-50 text-yellow-700'
                                : 'border-slate-300 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            member.status === 'Active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}
                          />
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-ink">
                        {member.dateJoined}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border-warm bg-white px-2.5 text-xs font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                            onClick={() => openEditModal(member)}
                            type="button"
                          >
                            <Icon className="h-3 w-3" name="edit" />
                            Edit
                          </button>
                          <button
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white active:scale-[0.98]"
                            onClick={() => triggerDelete(member)}
                            type="button"
                          >
                            <Icon className="h-3 w-3" name="trash" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredMembers.length === 0 && (
                    <tr>
                      <td className="py-12 text-center" colSpan={5}>
                        <p className="text-sm font-semibold text-deep-charcoal">
                          No staff members found
                        </p>
                        <p className="text-xs text-slate-ink mt-1">
                          Refine your search parameters or add a new department staff member.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right column: Notification Preferences */}
        <div>
          <SettingsCard
            description="Manage routing rules for automated alerts generated by request events and assessment milestones."
            icon="bell"
            title="Notification Routing"
          >
            <div className="space-y-4">
              {[
                {
                  key: 'requestLifecycle' as const,
                  title: 'Request status tracking',
                  desc: 'Receive alerts when your staffing requests transition statuses (e.g. HR approved, Boss approved, or rejected).',
                },
                {
                  key: 'planReady' as const,
                  title: 'Recruitment plans ready',
                  desc: 'Notify me immediately when HR drafts or publishes campaign plans linked to my requests.',
                },
                {
                  key: 'interviewUpdates' as const,
                  title: 'Candidate interview updates',
                  desc: 'Alert me when interviews are scheduled, rescheduled, or cancelled for my open headcounts.',
                },
                {
                  key: 'weeklyDigest' as const,
                  title: 'Weekly department report',
                  desc: 'Email a weekly digest summarizing candidate screen pass-rates, time-to-hire, and SLA compliance.',
                },
                {
                  key: 'panelAlerts' as const,
                  title: 'Interviewer assignment alerts',
                  desc: 'Automatically notify technical staff members when they are assigned to candidate review panels.',
                },
              ].map((item) => {
                const enabled = notifications[item.key];
                return (
                  <button
                    aria-pressed={enabled}
                    className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] ${
                      enabled
                        ? 'border-teal-command bg-teal-command/5 shadow-[0_12px_36px_-24px_rgba(13,148,136,0.3)]'
                        : 'border-border-warm bg-workflow-ivory'
                    }`}
                    key={item.key}
                    onClick={() => handleTogglePref(item.key)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-deep-charcoal">{item.title}</h3>
                        <p className="mt-1.5 text-xs leading-5 text-slate-ink">{item.desc}</p>
                      </div>
                      <span
                        className={`mt-1 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition duration-200 ${enabled ? 'bg-teal-command' : 'bg-stone-300'}`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingsCard>
        </div>
      </div>

      {/* CRUD Modals (Add / Edit Staff) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.42)] px-4 py-6">
          <div className="w-full max-w-[500px] rounded-xl border border-border-warm bg-clean-surface shadow-[0_24px_80px_-48px_rgba(28,25,23,0.7)]">
            <div className="flex items-start justify-between gap-4 border-b border-border-warm p-5">
              <div>
                <h2 className="text-lg font-semibold text-deep-charcoal">
                  {modalType === 'create' ? 'Add department staff' : 'Edit staff profile'}
                </h2>
                <p className="mt-1 text-xs text-slate-ink">
                  Configure workspace permissions and review capabilities for this department
                  member.
                </p>
              </div>
              <button
                aria-label="Close modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-warm bg-white text-slate-ink transition hover:border-rejected hover:text-rejected active:scale-[0.98]"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                <Icon className="h-4 w-4" name="close" />
              </button>
            </div>

            <form className="space-y-4 p-5" onSubmit={handleSaveMember}>
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-start gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-red-600" name="warning" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-deep-charcoal">Full name</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    placeholder="Enter full name"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-deep-charcoal">Email address</span>
                  <input
                    className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    disabled={modalType === 'edit'}
                    placeholder="name@rms.company.vn"
                    required
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-deep-charcoal">
                      Department role
                    </span>
                    <select
                      className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as MemberRole)}
                    >
                      {rolesList
                        .filter((r) => r !== 'All' && r !== 'Department Head')
                        .map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-deep-charcoal">Active status</span>
                    <select
                      className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                      value={memberStatus}
                      onChange={(e) => setMemberStatus(e.target.value as MemberStatus)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border-warm pt-4 sm:flex-row sm:justify-end">
                <button
                  className="h-10 rounded-lg border border-border-warm bg-white px-4 text-xs font-semibold text-slate-ink transition hover:border-rejected hover:text-rejected active:scale-[0.98]"
                  onClick={() => setModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-10 rounded-lg bg-teal-command px-5 text-xs font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                  type="submit"
                >
                  {modalType === 'create' ? 'Add Staff' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {deleteConfirmOpen && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.42)] px-4 py-6">
          <div className="w-full max-w-[420px] rounded-xl border border-border-warm bg-clean-surface shadow-[0_24px_80px_-48px_rgba(28,25,23,0.7)]">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600">
                <div className="rounded-full bg-red-50 p-2">
                  <Icon className="h-6 w-6" name="warning" />
                </div>
                <h3 className="text-lg font-semibold text-deep-charcoal">Remove staff member</h3>
              </div>
              <p className="mt-3 text-sm text-slate-ink">
                Are you sure you want to remove <strong>{memberToDelete.name}</strong> from the
                department? This user will no longer be assigned to active interview panels or
                review requests.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="h-10 rounded-lg border border-border-warm bg-white px-4 text-xs font-semibold text-slate-ink transition hover:border-deep-charcoal active:scale-[0.98]"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setMemberToDelete(null);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-10 rounded-lg bg-red-600 px-5 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
                  onClick={confirmDeleteMember}
                  type="button"
                >
                  Remove Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
