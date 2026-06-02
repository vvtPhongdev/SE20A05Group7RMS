import Sidebar from './components/Sidebar';
import { Page } from './App';

interface SettingsProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const departmentRows = [
  { name: 'IT & Engineering', head: 'Nguyen Van A', headcount: 15, active: 3, status: 'pending' },
  { name: 'Marketing', head: 'Tran Thi B', headcount: 8, active: 0, status: 'approved' },
  { name: 'Human Resources', head: 'Le Van C', headcount: 5, active: 1, status: 'pending' },
  { name: 'Finance', head: 'Pham Van D', headcount: 10, active: 0, status: 'approved' },
  { name: 'Design & UX', head: 'Hoang Thi E', headcount: 6, active: 2, status: 'pending' },
];

const pipelineStages = [
  { name: 'Application Received', color: 'bg-blue-500' },
  { name: 'Resume Screening', color: 'bg-cyan-500' },
  { name: 'Phone Interview', color: 'bg-indigo-500' },
  { name: 'Technical Assessment', color: 'bg-amber-500' },
  { name: 'Panel Interview', color: 'bg-purple-500' },
  { name: 'Final Interview', color: 'bg-orange-500' },
  { name: 'Reference Check', color: 'bg-slate-500' },
  { name: 'Offer Extended', color: 'bg-green-500' },
  { name: 'Onboarding', color: 'bg-teal-600' },
];

const workflowToggles = [
  { label: 'Require budget justification for 3+ positions', checked: true },
  { label: 'Auto-approve low-priority requests', checked: false },
  { label: 'Require VP approval for executive hires', checked: true },
  { label: 'Enable multi-level sub-departments', checked: false },
];

const statusBadgeClasses: Record<string, string> = {
  pending: 'bg-sky-100 text-sky-700 border border-sky-200',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const statusDotClasses: Record<string, string> = {
  pending: 'bg-sky-700',
  approved: 'bg-emerald-700',
};

export default function Settings({ currentPage, onNavigate, onLogout }: SettingsProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="ml-[260px]">
        <header className="sticky top-0 z-20 h-16 border-b border-[#d6cec4] bg-[#FAF8F5] px-8 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>Settings</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="font-semibold text-[#1C1917]">Organization</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Search configuration..."
                  className="w-64 rounded-xl border border-[#d6cec4] bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <button className="rounded-full border border-[#d6cec4] bg-white p-2 text-slate-600 transition hover:bg-slate-50 relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border border-[#FAF8F5]" />
              </button>
              <button className="rounded-xl bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
                Save Changes
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-6 px-8 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-[#1C1917]">Organization Settings</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Configure your corporate identity, department hierarchy, and global approval protocols.
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-[#d6cec4] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 text-slate-900">
                <span className="material-symbols-outlined text-teal-600">corporate_fare</span>
                <h2 className="text-xl font-semibold">Organization Profile</h2>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed border-[#d6cec4] bg-[#f0f5f2] text-slate-400 transition hover:border-teal-600">
                    <div className="text-center text-[10px]">
                      <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                      <div>Upload Logo</div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Organization Name</label>
                      <input
                        type="text"
                        defaultValue="ABC Technology Corporation"
                        className="w-full rounded-2xl border border-[#d6cec4] bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Organization Code</label>
                      <input
                        type="text"
                        defaultValue="ORG-ABC-2026"
                        readOnly
                        className="w-full rounded-2xl border border-[#d6cec4] bg-[#f0f5f2] px-4 py-3 text-sm font-mono text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Industry</label>
                    <select className="w-full rounded-2xl border border-[#d6cec4] bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                      <option value="Information Technology">Information Technology</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Logistics">Logistics</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Size</label>
                    <select className="w-full rounded-2xl border border-[#d6cec4] bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
                      <option value="1-50 employees">1-50 employees</option>
                      <option value="51-200 employees">51-200 employees</option>
                      <option value="201-500 employees">201-500 employees</option>
                      <option value="500+ employees">500+ employees</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 border-t border-[#d6cec4] pt-6 text-right">
                <button className="rounded-2xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">
                  Save Profile Changes
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[#d6cec4] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-slate-900">
                  <span className="material-symbols-outlined text-teal-600">domain</span>
                  <h2 className="text-xl font-semibold">Department Management</h2>
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-600 transition hover:bg-teal-50">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Department
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#d6cec4] bg-[#f5faf8] text-left text-slate-500">
                      <th className="px-4 py-3">Department Name</th>
                      <th className="px-4 py-3">Head</th>
                      <th className="px-4 py-3 text-center">Headcount</th>
                      <th className="px-4 py-3 text-center">Active Requests</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d6cec4]/50">
                    {departmentRows.map((row) => (
                      <tr key={row.name} className="group hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                        <td className="px-4 py-3 text-slate-700">{row.head}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-700">{row.headcount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[row.status]}`}>
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusDotClasses[row.status]}`} />
                            {row.active}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          <button className="mr-2 rounded-lg p-1 transition hover:text-teal-600">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="rounded-lg p-1 transition hover:text-red-600">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-[#d6cec4] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 text-slate-900">
              <span className="material-symbols-outlined text-teal-600">account_tree</span>
              <h2 className="text-xl font-semibold">Approval Workflow Configuration</h2>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-[#FAF8F5] border border-[#d6cec4]/50 p-8 mb-8">
              <div className="pointer-events-none absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#0D9488 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10 grid gap-4 lg:grid-cols-4">
                {['Request Created', 'Dept Head Review', 'Admin Approval', 'HR Plan Creation'].map((title, index) => (
                  <div key={title} className="flex flex-col items-center gap-3 rounded-3xl bg-white p-5 text-center shadow-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-teal-600 bg-white text-teal-600 shadow-sm">
                      <span className="material-symbols-outlined text-[28px]">
                        {['add_box', 'rule', 'verified_user', 'assignment_turned_in'][index]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                      <p className="text-xs text-slate-500">{['Initiator Action', 'Internal Verification', 'Final Validation', 'Execution Phase'][index]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {workflowToggles.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-3xl border border-[#d6cec4] bg-[#FAF8F5] p-4">
                  <p className="text-sm text-slate-700">{item.label}</p>
                  <label className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-[#e4e9e7]">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#d6cec4] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-900">
                <span className="material-symbols-outlined text-teal-600">view_kanban</span>
                <h2 className="text-xl font-semibold">Recruitment Pipeline Stages</h2>
              </div>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#f5faf8] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#ebf5f3]">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Stage
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="group flex cursor-move items-center gap-3 rounded-2xl border border-[#d6cec4] bg-[#FAF8F5] p-3 transition hover:border-teal-600">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-teal-600">drag_indicator</span>
                  <div className={`${stage.color} h-3 w-3 rounded-full`} />
                  <span className="flex-1 text-sm text-slate-900">{stage.name}</span>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button className="rounded-lg p-1 text-slate-500 transition hover:text-teal-600">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button className="rounded-lg p-1 text-slate-500 transition hover:text-red-600">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="fixed bottom-0 left-[260px] right-0 z-20 border-t border-[#d6cec4] bg-white px-8 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="material-symbols-outlined text-[18px]">info</span>
              Changes are automatically saved in draft mode.
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl border border-[#d6cec4] px-6 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                Discard Draft
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-10 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">
                <span className="material-symbols-outlined">save</span>
                Save All Settings
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
