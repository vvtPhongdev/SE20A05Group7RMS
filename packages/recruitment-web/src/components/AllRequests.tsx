const tabs = [
  { label: 'All', count: 52, active: true },
  { label: 'Pending', count: 5 },
  { label: 'Approved', count: 18 },
  { label: 'Active', count: 8 },
  { label: 'Completed', count: 15 },
  { label: 'Rejected', count: 6 },
];

const requests = [
  { id: '#RMS-9428', position: 'Senior Frontend Developer', department: 'IT', qty: '02', priority: 'High', status: 'Pending', created: 'Oct 24, 2023', assigned: 'Alex Chen' },
  { id: '#RMS-9421', position: 'Marketing Specialist', department: 'Marketing', qty: '01', priority: 'Medium', status: 'Approved', created: 'Oct 22, 2023', assigned: 'Sarah Miller' },
  { id: '#RMS-9415', position: 'Data Analyst', department: 'Finance', qty: '01', priority: 'Critical', status: 'Active', created: 'Oct 20, 2023', assigned: 'James Doe' },
  { id: '#RMS-9390', position: 'UX Researcher', department: 'Design', qty: '01', priority: 'Low', status: 'Completed', created: 'Oct 15, 2023', assigned: 'Maya Wang' },
  { id: '#RMS-9388', position: 'DevOps Engineer', department: 'IT', qty: '01', priority: 'High', status: 'Rejected', created: 'Oct 14, 2023', assigned: 'Alex Chen' },
  { id: '#RMS-9382', position: 'Recruitment Lead', department: 'HR', qty: '02', priority: 'Medium', status: 'Approved', created: 'Oct 12, 2023', assigned: 'Sarah Miller' },
  { id: '#RMS-9375', position: 'Product Designer', department: 'Design', qty: '03', priority: 'High', status: 'Pending', created: 'Oct 10, 2023', assigned: 'James Doe' },
  { id: '#RMS-9370', position: 'Sales Manager', department: 'Marketing', qty: '02', priority: 'Critical', status: 'Active', created: 'Oct 08, 2023', assigned: 'Maya Wang' },
];

const priorityStyles: Record<string, string> = {
  High: 'bg-rose-100 text-rose-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-700',
  Critical: 'bg-fuchsia-100 text-fuchsia-700',
};

const statusStyles: Record<string, string> = {
  Pending: 'bg-sky-100 text-sky-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Active: 'bg-cyan-100 text-cyan-700',
  Completed: 'bg-slate-100 text-slate-700',
  Rejected: 'bg-rose-100 text-rose-700',
};

export default function AllRequests() {
  return (
    <div className="p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Recruitment Requests</h1>
          <p className="mt-2 text-sm text-slate-500">52 total requests across 5 departments</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative bg-white rounded-2xl border border-[#D6CEC4]/70 px-4 py-3 shadow-sm w-full sm:w-[320px]">
            <span className="text-slate-400">🔍</span>
            <input
              className="ml-3 w-full border-none bg-transparent text-sm outline-none"
              placeholder="Search requests..."
            />
          </div>
          <button className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="inline-flex min-w-full flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm border border-[#D6CEC4]/70">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab.active ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              {tab.label} <span className="text-slate-400">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr] xl:items-end">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[#D6CEC4]/70 bg-white p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Department</label>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500">
              <option>All Departments</option>
              <option>IT</option>
              <option>Marketing</option>
              <option>Design</option>
              <option>Finance</option>
            </select>
          </div>

          <div className="rounded-2xl border border-[#D6CEC4]/70 bg-white p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</label>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500">
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="rounded-2xl border border-[#D6CEC4]/70 bg-white p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date Range</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500"
              placeholder="Oct 01, 2023 - Oct 31, 2023"
            />
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-end sm:items-center">
          <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            More Filters
          </button>
          <button className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors">
            + New Request
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-[#D6CEC4]/70 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Position</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Qty</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-teal-600">{request.id}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{request.position}</td>
                <td className="px-6 py-4 text-slate-600">{request.department}</td>
                <td className="px-6 py-4 text-slate-600">{request.qty}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[request.priority] || 'bg-slate-100 text-slate-700'}`}>
                    {request.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{request.created}</td>
                <td className="px-6 py-4 text-slate-600">{request.assigned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col gap-3 justify-between border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-500">Showing 1-12 of 52 requests</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 p-1">
          <button className="h-10 w-10 rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">1</button>
          <button className="h-10 w-10 rounded-full text-slate-600 transition hover:bg-slate-50">2</button>
          <button className="h-10 w-10 rounded-full text-slate-600 transition hover:bg-slate-50">3</button>
          <button className="h-10 w-10 rounded-full text-slate-600 transition hover:bg-slate-50">...</button>
          <button className="h-10 w-10 rounded-full text-slate-600 transition hover:bg-slate-50">5</button>
        </div>
      </div>
    </div>
  );
}
