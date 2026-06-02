import { KPICard } from './components/KPICard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ApprovalTable from './components/ApprovalTable';
import AllRequests from './components/AllRequests';
import Settings from './Settings';
import { Page } from './App';

interface DashboardProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const Dashboard = ({ currentPage, onNavigate, onLogout }: DashboardProps) => {
  if (currentPage === Page.SETTINGS) {
    return <Settings currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />;
  }
  const renderPageContent = () => {
    switch (currentPage) {
      case Page.APPROVAL_QUEUE:
        return (
          <div className="p-8">
            <header className="mb-8">
              <h2 className="text-2xl font-bold">Approval Queue</h2>
              <p className="text-slate-600">Review all pending approval requests here.</p>
            </header>
            <div className="bg-white p-6 rounded-xl border border-[#D6CEC4]/60">
              <ApprovalTable />
            </div>
          </div>
        );

      case Page.ALL_REQUESTS:
        return <AllRequests />;

      default:
        return (
          <div className="p-8">
            <header className="mb-8">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-slate-600">Good morning, Mr. Tu</p>
            </header>

            <div className="grid grid-cols-4 gap-6 mb-8">
              <KPICard 
                title="Active Requests" 
                value="18" 
                subtext="+3 this week" 
              />
              <KPICard 
                title="Pending Approval" 
                value="5" 
                subtext="Urgent review" 
              />
              <KPICard 
                title="Interviews This Week" 
                value="12" 
                subtext="Across 4 depts" 
              />
              <div className="bg-white p-6 rounded-xl border border-[#D6CEC4]/60 flex items-center justify-between">
                <div>
                  <p className="text-sm">Positions Filled</p>
                  <div className="text-2xl font-bold mt-1">34 <span className="text-sm text-slate-400">/ 52</span></div>
                </div>
                <div className="text-teal-600 font-bold">65%</div>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-6 mb-8">
              <div className="col-span-6 bg-white p-6 rounded-xl border border-[#D6CEC4]/60">
                <ApprovalTable />
              </div>
              
              <div className="col-span-4 bg-white p-6 rounded-xl border border-[#D6CEC4]/60">
                <h3 className="font-bold mb-6">Hiring Pipeline Summary</h3>
                <div className="space-y-4">
                  {[ 
                    {label: 'Applied', val: 145, w: '100%'}, 
                    {label: 'Screening', val: 67, w: '46%'}, 
                    {label: 'Interview', val: 28, w: '19%'}, 
                    {label: 'Offer', val: 8, w: '6%'}, 
                    {label: 'Hired', val: 34, w: '23%'} 
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-slate-500">{item.label}</span>
                      <div className="flex-1 h-6 bg-teal-50 rounded-r overflow-hidden">
                        <div className="h-full bg-teal-600" style={{width: item.w}}/>
                      </div>
                      <span className="font-mono text-sm w-8">{item.val}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-amber-600 text-sm font-medium">
                  ?? 3 decisions pending your review
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  const headerTitle = currentPage === Page.ALL_REQUESTS
    ? 'All Requests'
    : currentPage === Page.APPROVAL_QUEUE
    ? 'Approval Queue'
    : 'Dashboard';

  const hideSearch = currentPage !== Page.DASHBOARD;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="ml-[260px]">
        <Header title={headerTitle} hideSearch={hideSearch} />
        {renderPageContent()}
      </main>
    </div>
  );
};

export default Dashboard;
