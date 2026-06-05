import React, { useMemo, useState } from 'react';

type RoleKey = 'Admin' | 'Department Head' | 'HR Manager' | 'Candidate';
type UserStatus = 'Active' | 'Inactive' | 'Pending';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  department: string;
  status: UserStatus;
  lastLogin: string;
}

type UserForm = Omit<ManagedUser, 'id' | 'lastLogin'>;

const initialUsers: ManagedUser[] = [
  { id: 'USR-001', name: 'Vo Minh Tu', email: 'tu.vo@rms.company.vn', role: 'Admin', department: 'Executive', status: 'Active', lastLogin: '2026-06-05 08:42' },
  { id: 'USR-018', name: 'Le Minh Khoa', email: 'khoa.le@rms.company.vn', role: 'Department Head', department: 'IT', status: 'Active', lastLogin: '2026-06-04 17:18' },
  { id: 'USR-027', name: 'Pham Quynh Nhu', email: 'nhu.pham@rms.company.vn', role: 'HR Manager', department: 'HR', status: 'Active', lastLogin: '2026-06-05 09:11' },
  { id: 'USR-043', name: 'Mai Thanh Linh', email: 'linh.mai@rms.company.vn', role: 'Department Head', department: 'Marketing', status: 'Inactive', lastLogin: '2026-05-28 14:06' },
  { id: 'USR-112', name: 'Tran Bao An', email: 'an.tran@rms.company.vn', role: 'HR Manager', department: 'Design', status: 'Pending', lastLogin: 'Never' },
  { id: 'USR-328', name: 'Nguyen Van A', email: 'candidate.a@gmail.com', role: 'Candidate', department: 'Talent Pool', status: 'Active', lastLogin: '2026-06-03 10:25' },
];

const emptyForm: UserForm = {
  name: '',
  email: '',
  role: 'Candidate',
  department: '',
  status: 'Pending',
};

const roles: Array<RoleKey | 'All'> = ['All', 'Admin', 'Department Head', 'HR Manager', 'Candidate'];
const statuses: Array<UserStatus | 'All'> = ['All', 'Active', 'Inactive', 'Pending'];

const roleStyles: Record<RoleKey, string> = {
  Admin: 'bg-rejected/10 text-rejected border-rejected/20',
  'Department Head': 'bg-primary-container/10 text-primary border-primary/20',
  'HR Manager': 'bg-teal-command/10 text-teal-command border-teal-command/20',
  Candidate: 'bg-draft/10 text-draft border-draft/20',
};

const statusStyles: Record<UserStatus, string> = {
  Active: 'bg-approved/10 text-approved border-approved/20',
  Inactive: 'bg-draft/10 text-draft border-draft/20',
  Pending: 'bg-pending/10 text-pending border-pending/20',
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
    plus: <path d="M12 5v14m-7-7h14" />,
    edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />,
    lock: <path d="M8 11V8a4 4 0 0 1 8 0v3m-9 0h10v9H7v-9Z" />,
    unlock: <path d="M8 11V8a4 4 0 0 1 7.5-2M7 11h10v9H7v-9Z" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
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

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleKey | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.department.toLowerCase().includes(normalizedQuery);

      return matchesRole && matchesStatus && matchesQuery;
    });
  }, [query, roleFilter, statusFilter, users]);

  const counts = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.status === 'Active').length,
      pending: users.filter((user) => user.status === 'Pending').length,
    };
  }, [users]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setError(null);
  };

  const toggleStatus = (id: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === 'Active' ? 'Inactive' : 'Active',
            }
          : user,
      ),
    );
  };

  const saveUser = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.department.trim()) {
      setError('Name, email, and department are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Use a valid email address.');
      return;
    }

    if (editingUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                ...form,
              }
            : user,
        ),
      );
    } else {
      const nextId = `USR-${String(users.length + 1).padStart(3, '0')}`;
      setUsers((current) => [
        {
          id: nextId,
          ...form,
          lastLogin: 'Never',
        },
        ...current,
      ]);
    }

    closeModal();
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-teal-command">Identity administration</p>
          <h1 className="text-2xl font-semibold tracking-tight text-deep-charcoal">Users</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-ink">
            Manage workspace accounts, role assignments, activation status, and pending invitations.
          </p>
        </div>
        <button
          className="inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-teal-command px-5 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-primary active:translate-y-0 active:scale-[0.98]"
          onClick={openCreateModal}
          type="button"
        >
          <Icon className="h-4 w-4" name="plus" />
          Create user
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:max-w-[520px]">
        {[
          ['Total users', counts.total],
          ['Active', counts.active],
          ['Pending', counts.pending],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-border-warm bg-clean-surface px-4 py-3" key={label}>
            <p className="text-xs font-medium text-on-surface-variant">{label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-deep-charcoal">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border-warm bg-clean-surface p-4 shadow-[0_18px_50px_-44px_rgba(28,25,23,0.55)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative xl:w-[360px]">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              <Icon className="h-4 w-4" name="search" />
            </span>
            <input
              className="h-10 w-full rounded-lg border border-border-warm bg-workflow-ivory pl-9 pr-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              placeholder="Search name, email, department"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm font-medium text-deep-charcoal outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleKey | 'All')}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === 'All' ? 'All roles' : role}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm font-medium text-deep-charcoal outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as UserStatus | 'All')}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'All' ? 'All statuses' : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-y border-border-warm bg-workflow-ivory text-xs font-semibold uppercase tracking-[0.04em] text-on-surface-variant">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm text-sm">
              {filteredUsers.map((user) => (
                <tr className="transition hover:bg-workflow-ivory/70" key={user.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-command/10 text-sm font-bold text-teal-command">
                        {user.name
                          .split(' ')
                          .map((segment) => segment[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-deep-charcoal">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-ink">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${roleStyles[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-ink">{user.department}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-ink">{user.lastLogin}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-warm bg-white px-3 text-xs font-semibold text-slate-ink transition hover:border-teal-command hover:text-teal-command active:scale-[0.98]"
                        onClick={() => openEditModal(user)}
                        type="button"
                      >
                        <Icon className="h-3.5 w-3.5" name="edit" />
                        Edit
                      </button>
                      <button
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition active:scale-[0.98] ${
                          user.status === 'Active'
                            ? 'border-rejected/30 bg-rejected/10 text-rejected hover:bg-rejected hover:text-white'
                            : 'border-approved/30 bg-approved/10 text-approved hover:bg-approved hover:text-white'
                        }`}
                        onClick={() => toggleStatus(user.id)}
                        type="button"
                      >
                        <Icon className="h-3.5 w-3.5" name={user.status === 'Active' ? 'lock' : 'unlock'} />
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center border-t border-border-warm py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-teal-command">
                <Icon name="users" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-deep-charcoal">No users match these filters</h2>
              <p className="mt-2 max-w-md text-sm text-slate-ink">Adjust the search, role, or status filter to find more accounts.</p>
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.42)] px-4 py-6">
          <div className="w-full max-w-[560px] rounded-xl border border-border-warm bg-clean-surface shadow-[0_24px_80px_-48px_rgba(28,25,23,0.7)]">
            <div className="flex items-start justify-between gap-4 border-b border-border-warm p-6">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">{editingUser ? 'Edit user' : 'Create user'}</h2>
                <p className="mt-1 text-sm text-slate-ink">
                  {editingUser ? 'Update role, department, or account status.' : 'Create a new workspace account and assign its access role.'}
                </p>
              </div>
              <button
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-warm bg-white text-slate-ink transition hover:border-rejected hover:text-rejected active:scale-[0.98]"
                onClick={closeModal}
                type="button"
              >
                <Icon className="h-4 w-4" name="close" />
              </button>
            </div>

            <form className="space-y-5 p-6" onSubmit={saveUser}>
              {error && (
                <div className="rounded-lg border border-[var(--wr-error-border)] bg-[var(--wr-error-bg)] px-4 py-3 text-sm font-medium text-[var(--wr-error-text)]">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-deep-charcoal">Full name</span>
                  <input
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-deep-charcoal">Email</span>
                  <input
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-deep-charcoal">Role</span>
                  <select
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as RoleKey }))}
                  >
                    {roles.filter((role): role is RoleKey => role !== 'All').map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-deep-charcoal">Department</span>
                  <input
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    value={form.department}
                    onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-deep-charcoal">Status</span>
                  <select
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as UserStatus }))}
                  >
                    {statuses.filter((status): status is UserStatus => status !== 'All').map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border-warm pt-5 sm:flex-row sm:justify-end">
                <button
                  className="h-10 rounded-lg border border-border-warm bg-white px-4 text-sm font-semibold text-slate-ink transition hover:border-rejected hover:text-rejected active:scale-[0.98]"
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-10 rounded-lg bg-teal-command px-5 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98]"
                  type="submit"
                >
                  {editingUser ? 'Save changes' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
