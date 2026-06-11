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
  avatarUrl?: string;
}

type UserForm = Omit<ManagedUser, 'id' | 'lastLogin'>;

const getInitialUsers = (): ManagedUser[] => {
  const list: ManagedUser[] = [
    {
      id: 'USR-001',
      name: 'Nguyen Van An',
      email: 'an.nguyen@rms.vn',
      role: 'Admin',
      department: 'Management',
      status: 'Active',
      lastLogin: '2024-05-29 14:30',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB17BiN4bnjWR_KZgkn_VFbqUa3K1Vz1M8XCYTk4xBoBEorBJAlElYxj2hzdjXN52k06t2qxYVVJRUfFbY1ig8ougqZ-Q3cu_Sezo4Nhw5T-LWbBwblZZxh-9D3BcVeHzkVGxSbV_e9dAqOZPI6PYnXYdkO_wsNVpTjDZs6sAWjDz-oPQpvsm9an_3xmf_qaMjEaxAFicYEs6e-XqKLyaXtNRotBP660ZkSdYo_5cpmH_jYM2UvGH2NX6PnZRV9liBMercVNBUU2ys',
    },
    {
      id: 'USR-002',
      name: 'Tran Thi Binh',
      email: 'binh.tran@rms.vn',
      role: 'HR Manager',
      department: 'Human Resources',
      status: 'Active',
      lastLogin: '2024-05-29 12:15',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCwiQBSGS5GX3llR0GMK9snbHFaYrPK0OyxBoQ4p6p2ZDbesdgxvCbAGSgqI_7KIof3bSSsghOjYTEX5dgYjr6aQZrSZcmDtBYLPyCGDZfFH5TXI2e2VmWVD8OrnlrqtE7XLSZ_5BKDGpbUb11KiCXfXEO-ap80enLVE4Fi_6OSezpvlarOsgTWe_FDrhwnn6DCCByiKG-X5Fq3dMbeKtp7e42bNCeuUgVDIL-GOKgrWZoP4u-dikZxRhs47xhFAj5LMmB7igJ_Ujw',
    },
    {
      id: 'USR-003',
      name: 'Le Van Cuong',
      email: 'cuong.le@rms.vn',
      role: 'Department Head',
      department: 'Engineering',
      status: 'Pending',
      lastLogin: '2024-05-28 09:45',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDOtZ4Zkmz7uN_YTlA5IELXMVlwFIJpSY-J6s9SDAo9j4FFfOF1lkJPQjPn4EquYDt0bBEo9Pq3na7GJ7lBFBA_o4SQFGOJ00UnPcYEYtb6bp5rE-lup_UoF43BKALZjpf-T-2WjtUyPXaNPaiRkrtyjmduL1ZQfCSHP8HdzaQRzTypR7E7vp-yBJEqftbcJQmMPq-xhS7EbkOY_we60KAJd0f2FbxMSMyvk75LY1rzGc8QP6WQvoPQdr5hKgFXnnIVnL76zum2q3c',
    },
    {
      id: 'USR-004',
      name: 'Pham Minh Duc',
      email: 'duc.pham@gmail.com',
      role: 'Candidate',
      department: '-',
      status: 'Inactive',
      lastLogin: '2024-05-20 16:20',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBHSkOyHLTzwQNc3WmVZIq0INpvIy55Kk9gHUieB-FJro63rQJYfhukTWQ12UdhwspBJYhtL9i7AIKKj94XMVHf7mDz5uIgECQdtrkVN5XxJjGGDzJpiAFC8fmUUcKKvBB4Vg_dbZpm_x_untpeXfCgZXuuxLd9wp_7_u7jR7QSZMNA_YCyge7dnbYC-mNYN5A_nt7VsirUFalJqWDO-dDeTlieAx1NvFbR05PPyji2K9pJemKdhE07Xur0cD8y1iaqnofJ6QKTQfY',
    },
    {
      id: 'USR-005',
      name: 'Hoang Lan Anh',
      email: 'anh.hl@rms.vn',
      role: 'HR Manager',
      department: 'Human Resources',
      status: 'Active',
      lastLogin: '2024-05-29 15:45',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDhOMXOKfo4rw-zXs2fHnU-OtrL8yXViB_yQzFdZWOFpiZa-mEuChwtN9pqkapPa2v_QpJ2W1sAsUUKuNLjtivwzaTWHlaNPlBxfFS5YPNaCL8nlQk_us7qbczmHJhUpH5BosTgkgifYmIRytjfuH7iZS9EZWZurlCHO9_Rss5SulGalSqUMJW8U0acwvSRO09wgnZ1X2xdmP3lodrRpid5nlCOt8gE9g-BCPKW01O2OVZeQALG2cEUifeSlJIAuLPOLN3t088yqvE',
    },
  ];

  // We need to generate the rest:
  // Admins: need 11 more (12 - 1 = 11)
  // HR Managers: need 6 more (8 - 2 = 6)
  // Dept Heads: need 14 more (15 - 1 = 14)
  // Candidates: need 51 more (52 - 1 = 51)
  // Total to generate = 82 users, starting from index 6

  const firstNames = [
    'Viet',
    'Tuan',
    'Phuong',
    'Thao',
    'Trang',
    'Huy',
    'Lan',
    'Quynh',
    'Duy',
    'Nam',
    'Hoang',
    'An',
    'Minh',
    'Khoa',
    'Linh',
    'Bao',
    'Chi',
    'Huong',
    'Diep',
    'Hai',
    'Phong',
    'Thanh',
    'Son',
    'Lam',
  ];
  const middleNames = ['Van', 'Thi', 'Minh', 'Gia', 'Duc', 'Anh', 'Khanh', 'Ngoc', 'Bao', 'Quoc'];
  const lastNames = [
    'Nguyen',
    'Tran',
    'Le',
    'Pham',
    'Hoang',
    'Huynh',
    'Phan',
    'Vu',
    'Vo',
    'Dang',
    'Bui',
    'Do',
    'Ho',
    'Ngo',
    'Duong',
    'Ly',
  ];

  let idCounter = 6;

  const addUsersForRole = (role: RoleKey, count: number, defaultDepts: string[]) => {
    for (let i = 0; i < count; i++) {
      const idx = idCounter;
      const ln = lastNames[idx % lastNames.length];
      const mn = middleNames[(idx + 2) % middleNames.length];
      const fn = firstNames[(idx + 5) % firstNames.length];
      const name = `${ln} ${mn} ${fn}`;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${idx}@rms.vn`;
      const department = defaultDepts[idx % defaultDepts.length];

      let status: UserStatus = 'Active';
      if (idx % 7 === 0) {
        status = 'Pending';
      } else if (idx % 11 === 0) {
        status = 'Inactive';
      }

      list.push({
        id: `USR-${String(idx).padStart(3, '0')}`,
        name,
        email,
        role,
        department,
        status,
        lastLogin: `2024-05-${String(20 + (idx % 10)).padStart(2, '0')} ${String(9 + (idx % 8)).padStart(2, '0')}:${String(10 + (idx % 45)).padStart(2, '0')}`,
      });

      idCounter++;
    }
  };

  addUsersForRole('Admin', 11, ['Management', 'Operations', 'IT Support']);
  addUsersForRole('HR Manager', 6, ['Human Resources', 'Talent Acquisition']);
  addUsersForRole('Department Head', 14, ['Engineering', 'Marketing', 'Finance', 'Operations']);
  addUsersForRole('Candidate', 51, ['-']);

  return list;
};

const emptyForm: UserForm = {
  name: '',
  email: '',
  role: 'Candidate',
  department: '',
  status: 'Pending',
};

const roles: Array<RoleKey | 'All'> = [
  'All',
  'Admin',
  'Department Head',
  'HR Manager',
  'Candidate',
];
const statuses: Array<UserStatus | 'All'> = ['All', 'Active', 'Inactive', 'Pending'];

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>(() => getInitialUsers());
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
  const [error, setError] = useState<string | null>(null);

  // Dropdown Menu State
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

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
      hrManagers: users.filter((u) => u.role === 'HR Manager').length,
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
    <div className="p-0 max-w-max-container mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-margin-lg">
        <div>
          <h2 className="font-headline-lg text-on-surface mb-1">User Management</h2>
          <p className="font-body-md text-slate-ink">
            Manage accounts and role assignments across the organization.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-teal-command text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Add User
        </button>
      </div>

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
          <span className="font-label-md text-on-surface">{counts.hrManagers} HR Managers</span>
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
          <option value="HR Manager">HR Manager</option>
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
          <option value="Pending">Pending</option>
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
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold text-white ${
                        user.role === 'Admin'
                          ? 'bg-deep-charcoal'
                          : user.role === 'HR Manager'
                            ? 'bg-teal-command'
                            : user.role === 'Department Head'
                              ? 'bg-revision'
                              : 'bg-draft'
                      }`}
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
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>
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
                  <input
                    className="h-11 w-full rounded-lg border border-border-warm bg-workflow-ivory px-3 text-sm outline-none transition focus:border-teal-command focus:bg-white focus:ring-2 focus:ring-teal-command/15"
                    value={form.department}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, department: event.target.value }))
                    }
                  />
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
