import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@wr/contracts';

interface SubNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: SubNavItem[];
}

// ─── High-Fidelity SVG Icon Library ──────────────────────────────────
const Icons = {
  dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  queue: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  requests: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  interviews: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  create: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  campaigns: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  tasks: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
      <path d="M9 10h6" />
    </svg>
  ),
  search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  profile: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  notifications: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevron: (open: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
};

// ─── Role-Based Navigation Configuration ─────────────────────────────
const NAVIGATION_BY_ROLE: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: [
    { label: 'Dashboard', path: '/admin', icon: Icons.dashboard() },
    { label: 'Approval Queue', path: '/admin/approval-queue', icon: Icons.queue() },
    { label: 'All Requests', path: '/admin/requests', icon: Icons.requests() },
    { label: 'Interview Results', path: '/admin/interview-results', icon: Icons.interviews() },
    { label: 'Users', path: '/admin/users', icon: Icons.users() },
    { label: 'Settings', path: '/admin/settings', icon: Icons.settings() },
    {
      label: 'Reports',
      icon: Icons.reports(),
      children: [
        { label: 'Annual', path: '/admin/reports/annual', icon: Icons.reports() },
        { label: 'Dept Stats', path: '/admin/reports/dept-stats', icon: Icons.reports() }
      ]
    }
  ],
  [UserRole.DEPARTMENT_HEAD]: [
    { label: 'Dashboard', path: '/dept-head', icon: Icons.dashboard() },
    { label: 'Create Request', path: '/dept-head/create-request', icon: Icons.create() },
    { label: 'My Requests', path: '/dept-head/requests', icon: Icons.requests() },
    { label: 'Interviews', path: '/dept-head/interviews', icon: Icons.interviews() }
  ],
  [UserRole.HR_MANAGER]: [
    { label: 'Dashboard', path: '/hr', icon: Icons.dashboard() },
    { label: 'Request Queue', path: '/hr/requests', icon: Icons.queue() },
    { label: 'Campaigns', path: '/hr/campaigns', icon: Icons.campaigns() },
    { label: 'Task Planner', path: '/hr/tasks', icon: Icons.tasks() },
    { label: 'Talent Pool', path: '/hr/candidates', icon: Icons.users() },
    { label: 'Candidate Search', path: '/hr/search', icon: Icons.search() },
    { label: 'Interview Schedule', path: '/hr/interviews', icon: Icons.interviews() },
    { label: 'Interview Results', path: '/hr/results', icon: Icons.queue() },
    { label: 'Pipeline Reports', path: '/hr/reports', icon: Icons.reports() },
    { label: 'System Notifications', path: '/hr/notifications', icon: Icons.notifications() }
  ],
  [UserRole.CANDIDATE]: [
    { label: 'Dashboard', path: '/candidate', icon: Icons.dashboard() },
    { label: 'My Profile', path: '/candidate/profile', icon: Icons.profile() },
    { label: 'Upload CV', path: '/candidate/upload-cv', icon: Icons.upload() },
    { label: 'Inbox Alerts', path: '/candidate/notifications', icon: Icons.notifications() }
  ]
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Get nav items matching the user's role
  const navItems = user ? NAVIGATION_BY_ROLE[user.role] || [] : [];

  // Auto-expand menu containing active child
  useEffect(() => {
    if (!user) return;
    const initialExpanded: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.children && item.children.some(child => location.pathname === child.path)) {
        initialExpanded[item.label] = true;
      }
    });
    setExpandedMenus(prev => ({ ...prev, ...initialExpanded }));
  }, [location.pathname, user?.role]);

  if (!user) return <>{children}</>;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'System Admin';
      case UserRole.DEPARTMENT_HEAD:
        return 'Trưởng Phòng Ban';
      case UserRole.HR_MANAGER:
        return 'Trưởng Phòng HR';
      case UserRole.CANDIDATE:
        return 'Ứng Viên';
      default:
        return role;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={logoContainerStyle}>
          <div style={logoIconStyle}>WR</div>
          <span style={logoTextStyle}>Works Reruiter</span>
        </div>

        {/* User Card */}
        <div style={userCardStyle}>
          <div style={avatarStyle}>
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={userInfoStyle}>
            <div style={userNameStyle}>{user.displayName}</div>
            <div style={userRoleStyle}>{getRoleLabel(user.role)}</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={navStyle} aria-label="Main Navigation">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = expandedMenus[item.label] || false;
              const isAnyChildActive = item.children.some(child => location.pathname === child.path);

              return (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    className={`wr-sidebar-item ${isAnyChildActive ? 'child-active' : ''}`}
                    onClick={() => {
                      setExpandedMenus(prev => ({
                        ...prev,
                        [item.label]: !prev[item.label]
                      }));
                    }}
                    id={`nav-group-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {Icons.chevron(isOpen)}
                  </button>

                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.125rem' }}>
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <button
                            key={child.path}
                            onClick={() => navigate(child.path)}
                            className={`wr-sidebar-subitem ${isChildActive ? 'active' : ''}`}
                            id={`nav-item-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path!)}
                className={`wr-sidebar-item ${isActive ? 'active' : ''}`}
                id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={footerStyle}>
          <button onClick={handleLogout} className="wr-sidebar-item" style={{ color: 'var(--wr-error)' }}>
            {Icons.logout()}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div style={mainPanelStyle}>
        <header style={headerStyle}>
          <div style={headerTitleStyle}>
            Recruitment Workflow Management System
          </div>
          <div style={headerStatusStyle}>
            <span style={statusIndicatorStyle}></span>
            Connected to gateway
          </div>
        </header>

        <main style={contentStyle}>{children}</main>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: 'var(--wr-bg-page)',
  fontFamily: 'var(--wr-font-sans)',
};

const sidebarStyle: React.CSSProperties = {
  width: '260px',
  backgroundColor: 'var(--wr-bg-surface)',
  borderRight: '1px solid var(--wr-border-default)',
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
  boxSizing: 'border-box',
};

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '2rem',
};

const logoIconStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-accent-primary)',
  color: '#ffffff',
  width: '32px',
  height: '32px',
  borderRadius: 'var(--wr-radius-md)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'var(--wr-font-bold)',
  fontSize: 'var(--wr-text-sm)',
};

const logoTextStyle: React.CSSProperties = {
  fontWeight: 'var(--wr-font-bold)',
  fontSize: 'var(--wr-text-md)',
  color: 'var(--wr-text-primary)',
};

const userCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem',
  backgroundColor: 'var(--wr-bg-elevated)',
  borderRadius: 'var(--wr-radius-md)',
  marginBottom: '2rem',
};

const avatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'var(--wr-border-strong)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
};

const userInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const userNameStyle: React.CSSProperties = {
  fontWeight: 'var(--wr-font-semibold)',
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const userRoleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-secondary)',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  flex: 1,
};

const footerStyle: React.CSSProperties = {
  borderTop: '1px solid var(--wr-border-subtle)',
  paddingTop: '1rem',
};

const mainPanelStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const headerStyle: React.CSSProperties = {
  height: '60px',
  backgroundColor: 'var(--wr-bg-surface)',
  borderBottom: '1px solid var(--wr-border-default)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 2rem',
};

const headerTitleStyle: React.CSSProperties = {
  fontWeight: 'var(--wr-font-semibold)',
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-secondary)',
};

const headerStatusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-secondary)',
};

const statusIndicatorStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: 'var(--wr-success)',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '2rem',
  overflowY: 'auto',
};
