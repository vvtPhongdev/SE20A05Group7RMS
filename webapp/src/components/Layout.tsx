import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@wr/contracts';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
  icon: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    path: '/',
    roles: [UserRole.ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.HR_MANAGER, UserRole.CANDIDATE],
    icon: '📊',
  },
  {
    label: 'User Management',
    path: '/admin',
    roles: [UserRole.ADMIN],
    icon: '👤',
  },
  {
    label: 'Recruitment Request',
    path: '/dept-head',
    roles: [UserRole.DEPARTMENT_HEAD],
    icon: '📝',
  },
  {
    label: 'Recruitment Campaign',
    path: '/hr',
    roles: [UserRole.HR_MANAGER],
    icon: '🎯',
  },
  {
    label: 'My CV Profile',
    path: '/candidate',
    roles: [UserRole.CANDIDATE],
    icon: '📄',
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const filteredNavItems = NAVIGATION_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

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
        <nav style={navStyle}>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={isActive ? activeNavItemStyle : navItemStyle}
              >
                <span style={navIconStyle}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={footerStyle}>
          <button onClick={handleLogout} style={logoutButtonStyle}>
            <span style={navIconStyle}>🚪</span>
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

const navItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  border: 'none',
  background: 'none',
  color: 'var(--wr-text-secondary)',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 'var(--wr-radius-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--wr-text-sm)',
  transition: 'var(--wr-transition-fast)',
};

const activeNavItemStyle: React.CSSProperties = {
  ...navItemStyle,
  color: 'var(--wr-accent-primary-text)',
  backgroundColor: 'var(--wr-accent-primary)',
  fontWeight: 'var(--wr-font-semibold)',
};

const footerStyle: React.CSSProperties = {
  borderTop: '1px solid var(--wr-border-subtle)',
  paddingTop: '1rem',
};

const logoutButtonStyle: React.CSSProperties = {
  ...navItemStyle,
  width: '100%',
  color: 'var(--wr-error)',
};

const navIconStyle: React.CSSProperties = {
  fontSize: '1.1rem',
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
