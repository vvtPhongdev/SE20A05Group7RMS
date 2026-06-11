import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@wr/contracts';
import metadata from '../metadata.json';

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
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  queue: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  requests: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  interviews: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  users: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  reports: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  create: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  campaigns: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  tasks: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
      <path d="M9 10h6" />
    </svg>
  ),
  search: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  profile: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  upload: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  notifications: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  logout: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevron: (open: boolean) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : 'rotate-0'}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

type IconKey = Exclude<keyof typeof Icons, 'chevron'>;

interface MetadataNavItem {
  label: string;
  path?: string;
  icon: IconKey;
  children?: MetadataNavItem[];
}

const sidebarNavigation = metadata.sidebarNavigation as Record<UserRole, MetadataNavItem[]>;
const coverageMatrix = metadata.coverageMatrix as Record<UserRole, { expectedNavItems: number }>;

const createIcon = (icon: IconKey) => Icons[icon]();

const toNavItem = (item: MetadataNavItem): NavItem => ({
  label: item.label,
  path: item.path,
  icon: createIcon(item.icon),
  children: item.children?.map((child) => ({
    label: child.label,
    path: child.path!,
    icon: createIcon(child.icon),
  })),
});

const countLeafItems = (items: MetadataNavItem[]): number => {
  return items.reduce(
    (count, item) => count + (item.children ? countLeafItems(item.children) : 1),
    0,
  );
};

const NAVIGATION_BY_ROLE = Object.values(UserRole).reduce(
  (navigation, role) => {
    navigation[role] = (sidebarNavigation[role] || []).map(toNavItem);
    return navigation;
  },
  {} as Record<UserRole, NavItem[]>,
);

Object.values(UserRole).forEach((role) => {
  const expected = coverageMatrix[role]?.expectedNavItems;
  const actual = countLeafItems(sidebarNavigation[role] || []);
  if (expected !== actual) {
    throw new Error(
      `Sidebar coverage mismatch for ${role}: expected ${expected}, received ${actual}`,
    );
  }
});

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [avatar, setAvatar] = useState<string | null>(null);

  // Get nav items matching the user's role
  const navItems = user ? NAVIGATION_BY_ROLE[user.role] || [] : [];

  // Auto-expand menu containing active child
  useEffect(() => {
    if (!user) return;
    const initialExpanded: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && item.children.some((child) => location.pathname === child.path)) {
        initialExpanded[item.label] = true;
      }
    });
    setExpandedMenus((prev) => ({ ...prev, ...initialExpanded }));
  }, [location.pathname, user?.role]);

  useEffect(() => {
    let active = true;
    let avatarObjectUrl: string | null = null;

    const clearAvatar = () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
        avatarObjectUrl = null;
      }
      if (active) {
        setAvatar(null);
      }
    };

    const loadAvatar = async () => {
      if (!user || user.role !== UserRole.CANDIDATE || !token) {
        clearAvatar();
        return;
      }

      try {
        const response = await fetch('/api/v1/candidate-profiles/me/avatar', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (response.status === 404) {
          clearAvatar();
          return;
        }
        if (!response.ok) {
          throw new Error(`Unable to load profile photo (${response.status})`);
        }

        const nextAvatarUrl = URL.createObjectURL(await response.blob());
        if (!active) {
          URL.revokeObjectURL(nextAvatarUrl);
          return;
        }

        if (avatarObjectUrl) {
          URL.revokeObjectURL(avatarObjectUrl);
        }
        avatarObjectUrl = nextAvatarUrl;
        setAvatar(nextAvatarUrl);
      } catch {
        clearAvatar();
      }
    };

    const handleAvatarUpdated = () => void loadAvatar();
    void loadAvatar();

    window.addEventListener('avatar-updated', handleAvatarUpdated);
    return () => {
      active = false;
      window.removeEventListener('avatar-updated', handleAvatarUpdated);
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
      }
    };
  }, [token, user]);

  if (!user) return <>{children}</>;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'System Admin';
      case UserRole.DEPARTMENT_HEAD:
        return 'Department Head';
      case UserRole.HR_MANAGER:
        return 'HR Manager';
      case UserRole.CANDIDATE:
        return 'Candidate';
      default:
        return role;
    }
  };

  const handleLogout = () => {
    logout();
    window.location.replace('/login');
  };

  return (
    <div className="flex min-h-screen bg-[var(--wr-bg-page)]">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-[var(--wr-bg-surface)] border-r border-[var(--wr-border-default)] flex flex-col p-6 box-border">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[var(--wr-accent-primary)] text-white w-8 h-8 rounded-[var(--wr-radius-md)] flex justify-center items-center font-bold text-sm">
            WR
          </div>
          <span className="font-bold text-md text-[var(--wr-text-primary)]">Works Recruiter</span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 bg-[var(--wr-bg-elevated)] rounded-[var(--wr-radius-md)] mb-8">
          <div className="w-9 h-9 rounded-full bg-[var(--wr-border-strong)] flex justify-center items-center font-semibold text-[var(--wr-text-primary)] overflow-hidden shrink-0">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" alt="User avatar" />
            ) : (
              user.displayName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="font-semibold text-sm text-[var(--wr-text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">
              {user.displayName}
            </div>
            <div className="text-xs text-[var(--wr-text-secondary)]">{getRoleLabel(user.role)}</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-2 flex-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = expandedMenus[item.label] || false;
              const isAnyChildActive = item.children.some(
                (child) => location.pathname === child.path,
              );

              return (
                <div key={item.label} className="flex flex-col gap-1">
                  <button
                    aria-expanded={isOpen}
                    className={`wr-sidebar-item flex justify-between items-center ${isAnyChildActive ? 'active' : ''}`}
                    onClick={() => {
                      setExpandedMenus((prev) => ({
                        ...prev,
                        [item.label]: !prev[item.label],
                      }));
                    }}
                    id={`nav-group-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {Icons.chevron(isOpen)}
                  </button>

                  {isOpen && (
                    <div className="flex flex-col gap-1 mt-0.5">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path;
                        return (
                          <button
                            key={child.path}
                            onClick={() => navigate(child.path)}
                            className={`wr-sidebar-subitem ${isChildActive ? 'active' : ''}`}
                            id={`nav-item-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                            aria-current={isChildActive ? 'page' : undefined}
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
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[var(--wr-border-subtle)] pt-4">
          <button onClick={handleLogout} className="wr-sidebar-item text-[var(--wr-error)]">
            {Icons.logout()}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[60px] bg-[var(--wr-bg-surface)] border-b border-[var(--wr-border-default)] flex justify-between items-center px-8">
          <div className="font-semibold text-sm text-[var(--wr-text-secondary)]">
            Recruitment Workflow Management System
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--wr-text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--wr-success)]"></span>
            Connected to gateway
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
