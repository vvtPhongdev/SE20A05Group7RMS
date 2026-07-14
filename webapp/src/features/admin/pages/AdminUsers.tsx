import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import {
  AdminActionButton,
  AdminDashboardPage,
  AdminInlineAlert,
  AdminLoadingState,
  AdminPageHeader,
} from '../components';

type RoleKey = 'Admin' | 'Department Head' | 'HR' | 'Candidate';
type UserStatus = 'Active' | 'Inactive' | 'Pending';
type EmailCheckState = 'idle' | 'checking' | 'available' | 'exists';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  department: string;
  status: UserStatus;
  lastLogin: string;
  avatarUrl?: string;
}

type UserForm = Omit<ManagedUser, 'id' | 'lastLogin'>;
const emptyForm: UserForm = {
  name: '',
  email: '',
  role: 'Candidate',
  department: '-',
  status: 'Active',
};

const roles: Array<RoleKey | 'All'> = ['All', 'Admin', 'Department Head', 'HR', 'Candidate'];
const statuses: Array<UserStatus | 'All'> = ['All', 'Active', 'Inactive'];

const roleBadgeClasses: Record<RoleKey, string> = {
  Admin: 'bg-deep-charcoal text-white',
  'Department Head': 'bg-yellow-100 font-semibold text-revision',
  HR: 'bg-teal-command text-white',
  Candidate: 'border border-draft/30 bg-draft/15 text-draft',
};

export const AdminUsers: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleKey | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailCheck, setEmailCheck] = useState<EmailCheckState>('idle');
  const [emailCheckMessage, setEmailCheckMessage] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Dropdown Menu State
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  type ApiUser = {
    id: string;
    email: string;
    displayName: string;
    role: string;
    avatar?: { fileName?: string } | null;
    isActive: boolean;
    updatedAt: string;
    department?: { id: string; name: string } | null;
  };

  const mapRole = (role: string): RoleKey => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'DEPARTMENT_HEAD') return 'Department Head';
    if (role === 'HR_LEADER') return 'HR';
    return 'Candidate';
  };

  const apiRole = (role: RoleKey) =>
    ({
      Admin: 'ADMIN',
      'Department Head': 'DEPARTMENT_HEAD',
      HR: 'HR_LEADER',
      Candidate: 'CANDIDATE',
    })[role];

  const mapUser = (user: ApiUser): ManagedUser => ({
    id: user.id,
    name: user.displayName,
    email: user.email,
    role: mapRole(user.role),
    department: user.department?.name ?? '-',
    status: user.isActive ? 'Active' : 'Inactive',
    lastLogin: new Date(user.updatedAt).toLocaleString(),
    avatarUrl: user.avatar?.fileName ? `/api/v1/candidate-profiles/${user.id}/avatar` : undefined,
  });

  const loadUsers = async () => {
    const response = await apiRequest<{ data: ApiUser[] }>('/users?limit=100', token);
    setUsers(response.data.map(mapUser));
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const [organizations, departments] = await Promise.all([
          apiRequest<Array<{ id: string }>>('/organizations', token),
          apiRequest<Array<{ id: string; name: string }>>('/departments', token),
        ]);
        setOrganizationId(organizations[0]?.id ?? '');
        setDepartmentOptions(departments);
        await loadUsers();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load users');
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [token]);

  // Get unique departments for filter dropdown dynamically
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    users.forEach((u) => {
      if (u.department && u.department !== '-') {
        depts.add(u.department);
      }
    });
    return ['All', ...Array.from(depts)];
  }, [users]);

  // Statistics counters
  const counts = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'Admin').length,
      hr: users.filter((u) => u.role === 'HR').length,
      deptHeads: users.filter((u) => u.role === 'Department Head').length,
      candidates: users.filter((u) => u.role === 'Candidate').length,
    };
  }, [users]);

  // Reset pagination on filter change
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (val: RoleKey | 'All') => {
    setRoleFilter(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: UserStatus | 'All') => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleDeptFilterChange = (val: string) => {
    setDeptFilter(val);
    setCurrentPage(1);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      const matchesDept = deptFilter === 'All' || user.department === deptFilter;
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);

      return matchesRole && matchesStatus && matchesDept && matchesQuery;
    });
  }, [query, roleFilter, statusFilter, deptFilter, users]);

  // Paginated users for the current page
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;

  // Actions
  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setPassword('');
    setError(null);
    setEmailCheck('idle');
    setEmailCheckMessage(null);
    setVerifiedEmail('');
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
    setPassword('');
    setError(null);
    setEmailCheck('idle');
    setEmailCheckMessage(null);
    setVerifiedEmail('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setError(null);
    setEmailCheck('idle');
    setEmailCheckMessage(null);
    setVerifiedEmail('');
  };

  const toggleStatus = async (id: string) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;

    setError(null);
    try {
      const updated = await apiRequest<ApiUser>(`/users/${id}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: user.status !== 'Active' }),
      });
      setUsers((current) => current.map((item) => (item.id === id ? mapUser(updated) : item)));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update user status');
    }
  };

  const resetEmailVerification = () => {
    setEmailCheck('idle');
    setEmailCheckMessage(null);
    setVerifiedEmail('');
  };

  const verifyEmailAvailability = async () => {
    const email = form.email.trim().toLowerCase();
    setError(null);

    if (!email) {
      setEmailCheck('idle');
      setEmailCheckMessage(null);
      setError('Email is required.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheck('idle');
      setEmailCheckMessage(null);
      setError('Use a valid email address.');
      return false;
    }

    setEmailCheck('checking');
    setEmailCheckMessage('Checking email...');

    try {
      const result = await apiRequest<{ exists: boolean; isActive: boolean }>(
        `/users/email-exists?email=${encodeURIComponent(email)}`,
        token,
      );

      if (result.exists) {
        setEmailCheck('exists');
        setEmailCheckMessage(
          result.isActive
            ? 'This email already belongs to an active account.'
            : 'This email already exists in the database.',
        );
        setVerifiedEmail('');
        return false;
      }

      setEmailCheck('available');
      setEmailCheckMessage('Email is available.');
      setVerifiedEmail(email);
      return true;
    } catch (checkError) {
      setEmailCheck('idle');
      setEmailCheckMessage(null);
      setVerifiedEmail('');
      setError(checkError instanceof Error ? checkError.message : 'Unable to verify email');
      return false;
    }
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Use a valid email address.');
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();

    const departmentId =
      form.department === '-'
        ? undefined
        : departmentOptions.find((department) => department.name === form.department)?.id;

    try {
      if (editingUser) {
        await apiRequest(`/users/${editingUser.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            displayName: form.name,
            departmentId: departmentId ?? null,
          }),
        });
        if (editingUser.role !== form.role) {
          await apiRequest(`/users/${editingUser.id}/role`, token, {
            method: 'PATCH',
            body: JSON.stringify({ role: apiRole(form.role) }),
          });
        }
        if ((editingUser.status === 'Active') !== (form.status === 'Active')) {
          await apiRequest(`/users/${editingUser.id}/status`, token, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: form.status === 'Active' }),
          });
        }
      } else {
        if (!organizationId) {
          throw new Error('No organization is available for the new user');
        }
        if (!password || password.length < 8) {
          setError('A password of at least 8 characters is required.');
          return;
        }

        if (emailCheck !== 'available' || verifiedEmail !== normalizedEmail) {
          setError('Please verify this email before creating the user.');
          return;
        }

        await apiRequest('/users', token, {
          method: 'POST',
          body: JSON.stringify({
            email: normalizedEmail,
            displayName: form.name,
            role: apiRole(form.role),
            organizationId,
            departmentId,
            password,
          }),
        });
      }

      await loadUsers();
      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save user');
    }
  };

  // Render pagination numbers
  const renderPaginationButtons = () => {
    const buttons: React.ReactNode[] = [];

    const pageBtnClass = (pageNum: number) =>
      `w-8 h-8 rounded flex items-center justify-center font-label-md transition-colors ${
        currentPage === pageNum
          ? 'bg-teal-command text-white'
          : 'text-on-surface hover:bg-surface-container'
      }`;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button key={i} className={pageBtnClass(i)} onClick={() => setCurrentPage(i)}>
            {i}
          </button>,
        );
      }
    } else {
      buttons.push(
        <button key={1} className={pageBtnClass(1)} onClick={() => setCurrentPage(1)}>
          1
        </button>,
      );

      if (currentPage <= 4) {
        buttons.push(
          <button key={2} className={pageBtnClass(2)} onClick={() => setCurrentPage(2)}>
            2
          </button>,
          <button key={3} className={pageBtnClass(3)} onClick={() => setCurrentPage(3)}>
            3
          </button>,
          <button key={4} className={pageBtnClass(4)} onClick={() => setCurrentPage(4)}>
            4
          </button>,
          <button key={5} className={pageBtnClass(5)} onClick={() => setCurrentPage(5)}>
            5
          </button>,
          <span key="dots-1" className="text-slate-ink px-1">
            ...
          </span>,
          <button
            key={totalPages}
            className={pageBtnClass(totalPages)}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </button>,
        );
      } else if (currentPage >= totalPages - 3) {
        buttons.push(
          <span key="dots-1" className="text-slate-ink px-1">
            ...
          </span>,
          <button
            key={totalPages - 4}
            className={pageBtnClass(totalPages - 4)}
            onClick={() => setCurrentPage(totalPages - 4)}
          >
            {totalPages - 4}
          </button>,
          <button
            key={totalPages - 3}
            className={pageBtnClass(totalPages - 3)}
            onClick={() => setCurrentPage(totalPages - 3)}
          >
            {totalPages - 3}
          </button>,
          <button
            key={totalPages - 2}
            className={pageBtnClass(totalPages - 2)}
            onClick={() => setCurrentPage(totalPages - 2)}
          >
            {totalPages - 2}
          </button>,
          <button
            key={totalPages - 1}
            className={pageBtnClass(totalPages - 1)}
            onClick={() => setCurrentPage(totalPages - 1)}
          >
            {totalPages - 1}
          </button>,
          <button
            key={totalPages}
            className={pageBtnClass(totalPages)}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </button>,
        );
      } else {
        buttons.push(
          <span key="dots-1" className="text-slate-ink px-1">
            ...
          </span>,
          <button
            key={currentPage - 1}
            className={pageBtnClass(currentPage - 1)}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            {currentPage - 1}
          </button>,
          <button
            key={currentPage}
            className={pageBtnClass(currentPage)}
            onClick={() => setCurrentPage(currentPage)}
          >
            {currentPage}
          </button>,
          <button
            key={currentPage + 1}
            className={pageBtnClass(currentPage + 1)}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {currentPage + 1}
          </button>,
          <span key="dots-2" className="text-slate-ink px-1">
            ...
          </span>,
          <button
            key={totalPages}
            className={pageBtnClass(totalPages)}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </button>,
        );
      }
    }

    return buttons;
  };

  return (
    <AdminDashboardPage className="max-w-max-container">
      <AdminPageHeader
        title="User Management"
        description="Manage accounts and role assignments across the organization."
        actions={
          <AdminActionButton onClick={openCreateModal}>
            <span className="material-symbols-outlined text-xl">add</span>
            Add User
          </AdminActionButton>
        }
      />

      {error && !modalOpen ? <AdminInlineAlert>{error}</AdminInlineAlert> : null}
      {loading ? <AdminLoadingState label="Loading users..." /> : null}

      {/* Summary Stats Pill Counters */}
      <div className="flex flex-wrap gap-3 mb-margin-lg">
        <div className="flex items-center px-4 py-2 bg-clean-surface border border-border-warm rounded-full gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span className="font-label-md text-on-surface">{counts.total} Total</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-clean-surface border border-border-warm rounded-full gap-2">
          <span className="w-2 h-2 rounded-full bg-deep-charcoal"></span>
          <span className="font-label-md text-on-surface">{counts.admins} Admins</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-clean-surface border border-border-warm rounded-full gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-command"></span>
          <span className="font-label-md text-on-surface">{counts.hr} HR</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-clean-surface border border-border-warm rounded-full gap-2">
          <span className="w-2 h-2 rounded-full bg-revision"></span>
          <span className="font-label-md text-on-surface">{counts.deptHeads} Dept Heads</span>
        </div>
        <div className="flex items-center px-4 py-2 bg-clean-surface border border-border-warm rounded-full gap-2">
          <span className="w-2 h-2 rounded-full bg-draft"></span>
          <span className="font-label-md text-on-surface">{counts.candidates} Candidates</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4 mb-margin-md items-center">
        <div className="flex-1 min-w-[300px] relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
            search
          </span>
          <input
            className="w-full bg-clean-surface border border-border-warm rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-teal-command outline-none font-body-sm text-on-surface"
            placeholder="Search by name or email"
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>
        <select
          className="bg-clean-surface border border-border-warm rounded-lg px-4 py-2 text-on-surface font-body-sm focus:ring-2 focus:ring-teal-command outline-none min-w-[140px]"
          value={roleFilter}
          onChange={(e) => handleRoleFilterChange(e.target.value as RoleKey | 'All')}
        >
          <option value="All">Role</option>
          <option value="Admin">Admin</option>
          <option value="Department Head">Department Head</option>
          <option value="HR">HR</option>
          <option value="Candidate">Candidate</option>
        </select>
        <select
          className="bg-clean-surface border border-border-warm rounded-lg px-4 py-2 text-on-surface font-body-sm focus:ring-2 focus:ring-teal-command outline-none min-w-[140px]"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as UserStatus | 'All')}
        >
          <option value="All">Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          className="bg-clean-surface border border-border-warm rounded-lg px-4 py-2 text-on-surface font-body-sm focus:ring-2 focus:ring-teal-command outline-none min-w-[160px]"
          value={deptFilter}
          onChange={(e) => handleDeptFilterChange(e.target.value)}
        >
          <option value="All">Department</option>
          {uniqueDepartments
            .filter((d) => d !== 'All')
            .map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
        </select>
      </div>

      {/* Data Table Card */}
      <div className="clean-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-workflow-ivory border-b border-border-warm">
                <th className="px-margin-md py-4 font-label-md text-slate-ink uppercase tracking-wider">
                  User
                </th>
                <th className="px-margin-md py-4 font-label-md text-slate-ink uppercase tracking-wider">
                  Role
                </th>
                <th className="px-margin-md py-4 font-label-md text-slate-ink uppercase tracking-wider">
                  Department
                </th>
                <th className="px-margin-md py-4 font-label-md text-slate-ink uppercase tracking-wider">
                  Status
                </th>
                <th className="px-margin-md py-4 font-label-md text-slate-ink uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-margin-md py-4 font-label-md text-slate-ink uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm">
              {paginatedUsers.map((user) => (
                <tr className="hover:bg-workflow-ivory transition-colors group" key={user.id}>
                  <td className="px-margin-md py-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          alt={`${user.name} Profile`}
                          className="w-10 h-10 rounded-full border border-border-warm object-cover"
                          src={user.avatarUrl}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-command/10 text-sm font-bold text-teal-command">
                          {user.name
                            .split(' ')
                            .map((segment) => segment[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                      )}
                      <div>
                        <p className="font-label-md text-on-surface font-semibold">{user.name}</p>
                        <p className="font-body-sm text-slate-ink">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-margin-md py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${roleBadgeClasses[user.role]}`}
                    >
                      {user.role === 'Department Head' ? 'Dept Head' : user.role}
                    </span>
                  </td>
                  <td className="px-margin-md py-4 font-body-sm text-on-surface">
                    {user.department}
                  </td>
                  <td className="px-margin-md py-4">
                    <span
                      className={`flex items-center gap-1.5 font-label-md ${
                        user.status === 'Active'
                          ? 'text-approved'
                          : user.status === 'Pending'
                            ? 'text-revision'
                            : 'text-slate-ink'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.status === 'Active'
                            ? 'bg-approved'
                            : user.status === 'Pending'
                              ? 'bg-revision'
                              : 'bg-slate-ink'
                        }`}
                      ></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-margin-md py-4 font-data-mono text-slate-ink">
                    {user.lastLogin}
                  </td>
                  <td className="px-margin-md py-4 text-right relative">
                    <button
                      className="text-on-surface-variant hover:text-teal-command p-1.5 rounded-full hover:bg-surface-container transition-colors"
                      onClick={() =>
                        setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id)
                      }
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    {activeMenuUserId === user.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setActiveMenuUserId(null)}
                        />
                        <div className="absolute right-4 mt-1 w-36 rounded-lg border border-border-warm bg-clean-surface py-1 shadow-lg z-30 text-left">
                          <button
                            className="w-full px-4 py-2.5 text-sm text-on-surface hover:bg-workflow-ivory flex items-center gap-2 transition-colors"
                            onClick={() => {
                              openEditModal(user);
                              setActiveMenuUserId(null);
                            }}
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                            Edit
                          </button>
                          <button
                            className={`w-full px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-workflow-ivory transition-colors ${
                              user.status === 'Active' ? 'text-rejected' : 'text-approved'
                            }`}
                            onClick={() => {
                              toggleStatus(user.id);
                              setActiveMenuUserId(null);
                            }}
                          >
                            <span className="material-symbols-outlined text-base">
                              {user.status === 'Active' ? 'lock' : 'lock_open'}
                            </span>
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center border-t border-border-warm py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">group</span>
            <h2 className="text-lg font-semibold text-deep-charcoal">
              No users match these filters
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-ink">
              Adjust the search, role, status, or department filter to find more accounts.
            </p>
          </div>
        )}

        {/* Footer / Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-margin-md py-4 border-t border-border-warm bg-workflow-ivory flex justify-between items-center">
            <p className="font-body-sm text-slate-ink">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)}-
              {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}{' '}
              users
            </p>
            <div className="flex items-center gap-2">
              <button
                className="p-1 rounded hover:bg-surface-container transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {renderPaginationButtons()}
              <button
                className="p-1 rounded hover:bg-surface-container transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.42)] px-4 py-6">
          <div className="w-full max-w-[560px] rounded-xl border border-border-warm bg-clean-surface shadow-[0_24px_80px_-48px_rgba(28,25,23,0.7)] overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-border-warm p-6">
              <div>
                <h2 className="text-xl font-semibold text-deep-charcoal">
                  {editingUser ? 'Edit user' : 'Create user'}
                </h2>
                <p className="mt-1 text-sm text-slate-ink">
                  {editingUser
                    ? 'Update role, department, or account status.'
                    : 'Create a new workspace account and assign its access role.'}
                </p>
              </div>
              <button
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-warm bg-white text-slate-ink transition hover:border-rejected hover:text-rejected active:scale-[0.98]"
                onClick={closeModal}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form className="space-y-5 p-6" onSubmit={saveUser}>
              {error && (
                <div className="rounded-lg border border-rejected/30 bg-rejected/5 px-4 py-3 text-sm font-medium text-rejected">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2 block">
                  <span className="text-sm font-medium text-deep-charcoal">Full name</span>
                  <input
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-2 block">
                  <span className="text-sm font-medium text-deep-charcoal">Email</span>
                  <input
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    disabled={Boolean(editingUser)}
                    type="email"
                    value={form.email}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, email: event.target.value }));
                      if (!editingUser) {
                        resetEmailVerification();
                      }
                    }}
                  />
                  {!editingUser ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="h-8 rounded-lg border border-teal-command/30 bg-white px-3 text-xs font-semibold text-teal-command transition hover:border-teal-command hover:bg-teal-command/5 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={emailCheck === 'checking' || !form.email.trim()}
                        onClick={verifyEmailAvailability}
                        type="button"
                      >
                        {emailCheck === 'checking' ? 'Checking...' : 'Verify email'}
                      </button>
                      {emailCheckMessage ? (
                        <span
                          className={`text-xs font-medium ${
                            emailCheck === 'available'
                              ? 'text-approved'
                              : emailCheck === 'exists'
                                ? 'text-rejected'
                                : 'text-slate-ink'
                          }`}
                        >
                          {emailCheckMessage}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </label>
                {!editingUser ? (
                  <label className="space-y-2 block sm:col-span-2">
                    <span className="text-sm font-medium text-deep-charcoal">Initial password</span>
                    <input
                      className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                      minLength={8}
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                ) : null}
                <label className="space-y-2 block">
                  <span className="text-sm font-medium text-deep-charcoal">Role</span>
                  <select
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15 text-on-surface"
                    value={form.role}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, role: event.target.value as RoleKey }))
                    }
                  >
                    {roles
                      .filter((role): role is RoleKey => role !== 'All')
                      .map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="space-y-2 block">
                  <span className="text-sm font-medium text-deep-charcoal">Department</span>
                  <select
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    value={form.department}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, department: event.target.value }))
                    }
                  >
                    <option value="-">No department</option>
                    {departmentOptions.map((department) => (
                      <option key={department.id} value={department.name}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 sm:col-span-2 block">
                  <span className="text-sm font-medium text-deep-charcoal">Status</span>
                  <select
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15 text-on-surface"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as UserStatus,
                      }))
                    }
                  >
                    {statuses
                      .filter((status): status is UserStatus => status !== 'All')
                      .map((status) => (
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
                  className="h-10 rounded-lg bg-teal-command px-5 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    !editingUser &&
                    (emailCheck !== 'available' ||
                      verifiedEmail !== form.email.trim().toLowerCase())
                  }
                  type="submit"
                >
                  {editingUser ? 'Save changes' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminDashboardPage>
  );
};
