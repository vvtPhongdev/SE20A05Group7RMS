import { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const menuItems = [
    { label: 'Dashboard', page: Page.DASHBOARD },
    { label: 'Approval Queue', page: Page.APPROVAL_QUEUE },
    { label: 'All Requests', page: Page.ALL_REQUESTS },
    { label: 'Interview Results', page: Page.INTERVIEW_RESULTS },
    { label: 'Users', page: Page.USERS },
    { label: 'Departments', page: Page.DEPARTMENTS },
    { label: 'Reports', page: Page.REPORTS },
    { label: 'Settings', page: Page.SETTINGS },
  ];

  return (
    <aside className="w-[260px] bg-[#F5F3F0] h-screen flex flex-col py-8 border-r border-[#D6CEC4]/60 fixed left-0 top-0">
      <div className="px-8 mb-10">
        <h1 className="text-2xl font-bold text-[#1C1917]">RMS</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => onNavigate(item.page)}
            className={`flex items-center gap-4 px-8 py-3 cursor-pointer transition-colors duration-200 ${
              currentPage === item.page
                ? 'bg-white/50 border-r-4 border-teal-600 text-teal-600 font-bold' 
                : 'text-slate-600 hover:bg-white/30 hover:text-teal-700'
            }`}
          >
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Logout button */}
      <div className="px-8 border-t border-[#D6CEC4]/60 pt-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-4 px-4 py-3 w-full text-slate-600 hover:bg-white/30 hover:text-red-600 rounded-lg transition-colors duration-200 cursor-pointer"
        >
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}