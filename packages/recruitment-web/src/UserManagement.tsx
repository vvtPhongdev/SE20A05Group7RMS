import Sidebar from './components/Sidebar';
import { Page } from './App';

interface UserManagementProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const users = [
  { name: 'Nguyen Van An', email: 'an.nguyen@rms.vn', role: 'Admin', dept: 'Management', status: 'Active', lastActive: '2024-05-29 14:30', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB17BiN4bnjWR_KZgkn_VFbqUa3K1Vz1M8XCYTk4xBoBEorBJAlElYxj2hzdjXN52k06t2qxYVVJRUfFbY1ig8ougqZ-Q3cu_Sezo4Nhw5T-LWbBwblZZxh-9D3BcVeHzkVGxSbV_e9dAqOZPI6PYnXYdkO_wsNVpTjDZs6sAWjDz-oPQpvsm9an_3xmf_qaMjEaxAFicYEs6e-XqKLyaXtNRotBP660ZkSdYo_5cpmH_jYM2UvGH2NX6PnZRV9liBMercVNBUU2ys' },
  { name: 'Tran Thi Binh', email: 'binh.tran@rms.vn', role: 'HR Manager', dept: 'Human Resources', status: 'Active', lastActive: '2024-05-29 12:15', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwiQBSGS5GX3llR0GMK9snbHFaYrPK0OyxBoQ4p6p2ZDbesdgxvCbAGSgqI_7KIof3bSSsghOjYTEX5dgYjr6aQZrSZcmDtBYLPyCGDZfFH5TXI2e2VmWVD8OrnlrqtE7XLSZ_5BKDGpbUb11KiCXfXEO-ap80enLVE4Fi_6OSezpvlarOsgTWe_FDrhwnn6DCCByiKG-X5Fq3dMbeKtp7e42bNCeuUgVDIL-GOKgrWZoP4u-dikZxRhs47xhFAj5LMmB7igJ_Ujw' },
  { name: 'Le Van Cuong', email: 'cuong.le@rms.vn', role: 'Dept Head', dept: 'Engineering', status: 'Pending', lastActive: '2024-05-28 09:45', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOtZ4Zkmz7uN_YTlA5IELXMVlwFIJpSY-J6s9SDAo9j4FFfOF1lkJPQjPn4EquYDt0bBEo9Pq3na7GJ7lBFBA_o4SQFGOJ00UnPcYEYtb6bp5rE-lup_UoF43BKALZjpf-T-2WjtUyPXaNPaiRkrtyjmduL1ZQfCSHP8HdzaQRzTypR7E7vp-yBJEqftbcJQmMPq-xhS7EbkOY_we60KAJd0f2FbxMSMyvk75LY1rzGc8QP6WQvoPQdr5hS7EbkOY' },
  { name: 'Pham Minh Duc', email: 'duc.pham@gmail.com', role: 'Candidate', dept: '-', status: 'Inactive', lastActive: '2024-05-20 16:20', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHSkOyHLTzwQNc3WmVZIq0INpvIy55Kk9gHUieB-FJro63rQJYfhukTWQ12UdhwspBJYhtL9i7AIKKj94XMVHf7mDz5uIgECQdtrkVN5XxJjGGDzJpiAFC8fmUUcKKvBB4Vg_dbZpm_x_untpeXfCgZXuuxLd9wp_7_u7jR7QSZMNA_YCyge7dnbYC-mNYN5A_nt7VsirUFalJqWDO-dDeTlieAx1NvFbR05PPyji2K9pJemKdhE07Xur0cD8y1iaqnofJ6QKTQfY' },
];

export default function UserManagement({ currentPage, onNavigate, onLogout }: UserManagementProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="ml-[260px]">
        <header className="h-16 flex items-center justify-between px-6 bg-[#FAF8F5] border-b border-[#d6cec4]">
          <div>
            <h1 className="text-lg font-semibold">RMS Recruitment System</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input className="w-64 rounded-full border border-[#d6cec4] bg-white px-4 py-1.5 text-sm outline-none" placeholder="Search..." />
              <span className="material-symbols-outlined absolute right-3 top-2 text-slate-400">search</span>
            </div>
            <button className="p-1 text-slate-600 rounded hover:text-teal-600"><span className="material-symbols-outlined">notifications</span></button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#bcc9c6]">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcUrj1zGHTZSHXTQuBDQFFheg6MV6p6wz70_C9kBPEbQEsy8QRiFOKTy_Zpm1b2d25F7Zc2K_V5xZMfWrnRl_NMYAs3k6e1nndFNlYOonI-ljGym981iVoa3eLKX7ULwKe7gXIXnWCrSRFmUGdE6n5CoG_QQI8DwJB62rCljMPvZaR0wpACRGU3Ss9wyjLuALw3YyannrYDSaMVU6-7OAxk6MZSDnBImGgEMQuUoCXpbmQrS1KVVqU7KFlVW68RHi-0XmJD6IZCdk" alt="profile"/>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 max-w-[1200px] mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">User Management</h2>
              <p className="text-sm text-slate-500">Manage accounts and role assignments across the organization.</p>
            </div>
            <button className="rounded-lg bg-teal-600 px-4 py-2 text-white">Add User</button>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 rounded-full border border-[#d6cec4] bg-white px-4 py-2"> <span className="w-2 h-2 rounded-full bg-[#00685f]"/> <span className="text-sm">87 Total</span></div>
            <div className="flex items-center gap-2 rounded-full border border-[#d6cec4] bg-white px-4 py-2"> <span className="w-2 h-2 rounded-full bg-[#1C1917]"/> <span className="text-sm">12 Admins</span></div>
            <div className="flex items-center gap-2 rounded-full border border-[#d6cec4] bg-white px-4 py-2"> <span className="w-2 h-2 rounded-full bg-[#0D9488]"/> <span className="text-sm">8 HR Managers</span></div>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <div className="relative min-w-[220px]">
              <input className="w-full rounded-lg border border-[#d6cec4] bg-white px-10 py-2 text-sm outline-none" placeholder="Search by name or email" />
              <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400">search</span>
            </div>
            <select className="rounded-lg border border-[#d6cec4] bg-white px-4 py-2 text-sm">
              <option>Role</option>
              <option>Admin</option>
              <option>Department Head</option>
              <option>HR Manager</option>
              <option>Candidate</option>
            </select>
            <select className="rounded-lg border border-[#d6cec4] bg-white px-4 py-2 text-sm">
              <option>Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Pending</option>
            </select>
            <select className="rounded-lg border border-[#d6cec4] bg-white px-4 py-2 text-sm">
              <option>Department</option>
              <option>Engineering</option>
              <option>Marketing</option>
              <option>Human Resources</option>
              <option>Operations</option>
            </select>
          </div>

          <div className="rounded-xl border border-[#d6cec4] bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#FAF8F5] border-b border-[#d6cec4]">
                <tr>
                  <th className="px-6 py-4 text-sm text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-sm text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-sm text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-sm text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-sm text-slate-600 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-4 text-sm text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d6cec4]/50">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img className="w-10 h-10 rounded-full border border-[#d6cec4] object-cover" src={u.avatar} alt={u.name} />
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-sm text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#1C1917] px-3 py-1 text-xs font-semibold text-white">{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{u.dept}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 font-medium ${u.status === 'Active' ? 'text-[#059669]' : u.status === 'Pending' ? 'text-[#D97706]' : 'text-slate-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-[#059669]' : u.status === 'Pending' ? 'bg-[#D97706]' : 'bg-slate-700'}`} /> {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-700">{u.lastActive}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-600 hover:text-teal-600"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-6 py-4 bg-[#FAF8F5] border-t border-[#d6cec4]">
              <div className="text-sm text-slate-700">Showing 1-10 of 87 users</div>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded hover:bg-white disabled:opacity-30" disabled>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="h-8 w-8 rounded bg-[#0D9488] text-white">1</button>
                <button className="h-8 w-8 rounded hover:bg-white">2</button>
                <button className="h-8 w-8 rounded hover:bg-white">3</button>
                <div className="px-2">...</div>
                <button className="h-8 w-8 rounded hover:bg-white">9</button>
                <button className="p-1 rounded hover:bg-white">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
