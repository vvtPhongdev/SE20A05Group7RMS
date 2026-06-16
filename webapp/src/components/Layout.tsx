import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileUp,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Search,
  Settings,
  Target,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@wr/contracts';
import { useAuth } from '../context/AuthContext';
import metadata from '../metadata.json';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type IconKey =
  | 'dashboard'
  | 'queue'
  | 'requests'
  | 'interviews'
  | 'users'
  | 'settings'
  | 'reports'
  | 'create'
  | 'campaigns'
  | 'tasks'
  | 'search'
  | 'profile'
  | 'upload'
  | 'notifications';

interface MetadataNavItem {
  label: string;
  path?: string;
  icon: IconKey;
  children?: MetadataNavItem[];
}

interface LayoutProps {
  children: React.ReactNode;
}

const iconMap: Record<IconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  queue: ClipboardCheck,
  requests: ClipboardList,
  interviews: CalendarDays,
  users: Users,
  settings: Settings,
  reports: FileBarChart,
  create: PlusCircle,
  campaigns: Target,
  tasks: BriefcaseBusiness,
  search: Search,
  profile: UserCircle,
  upload: FileUp,
  notifications: Bell,
};

const sidebarNavigation = metadata.sidebarNavigation as Record<UserRole, MetadataNavItem[]>;
const coverageMatrix = metadata.coverageMatrix as Record<UserRole, { expectedNavItems: number }>;

const countLeafItems = (items: MetadataNavItem[]): number =>
  items.reduce((count, item) => count + (item.children ? countLeafItems(item.children) : 1), 0);

Object.values(UserRole).forEach((role) => {
  const expected = coverageMatrix[role]?.expectedNavItems;
  const actual = countLeafItems(sidebarNavigation[role] || []);

  if (expected !== actual) {
    throw new Error(`Sidebar coverage mismatch for ${role}: expected ${expected}, received ${actual}`);
  }
});

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'System Admin',
  [UserRole.DEPARTMENT_HEAD]: 'Department Head',
  [UserRole.HR_LEADER]: 'HR Leader',
  [UserRole.HR_RECRUITER]: 'HR Recruiter',
  [UserRole.CANDIDATE]: 'Candidate',
};

const roleHomeLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin Dashboard',
  [UserRole.DEPARTMENT_HEAD]: 'Department Dashboard',
  [UserRole.HR_LEADER]: 'HR Dashboard',
  [UserRole.HR_RECRUITER]: 'HR Dashboard',
  [UserRole.CANDIDATE]: 'Candidate Dashboard',
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const navItems = user ? sidebarNavigation[user.role] || [] : [];

  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children?.some((child) => child.path === location.pathname)) {
        nextExpanded[item.label] = true;
      }
    });
    setExpandedGroups((current) => ({ ...current, ...nextExpanded }));
  }, [location.pathname, navItems]);

  useEffect(() => {
    let active = true;
    let avatarObjectUrl: string | null = null;

    const clearAvatar = () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
        avatarObjectUrl = null;
      }
      if (active) setAvatar(null);
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

        if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
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
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    };
  }, [token, user]);

  if (!user) return <>{children}</>;

  const isActivePath = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || (path !== '/hr' && location.pathname.startsWith(`${path}/`));
  };

  const handleLogout = () => {
    logout();
    window.location.replace('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar
        className="border-[var(--wr-border-default)] bg-[var(--wr-bg-surface)]"
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-[var(--wr-border-subtle)] p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-12 gap-3 hover:bg-transparent data-[active=true]:bg-transparent"
                size="lg"
                tooltip="Works Recruiter"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--wr-accent-primary)] text-sm font-bold text-white">
                  RMS
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-bold text-[var(--wr-text-primary)]">
                    Works Recruiter
                  </p>
                  <p className="truncate text-xs text-[var(--wr-text-muted)]">
                    {roleLabels[user.role]} Portal
                  </p>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = iconMap[item.icon];

                  if (item.children) {
                    const isOpen = expandedGroups[item.label] ?? false;
                    const active = item.children.some((child) => isActivePath(child.path));

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={active}
                          onClick={() =>
                            setExpandedGroups((current) => ({
                              ...current,
                              [item.label]: !current[item.label],
                            }))
                          }
                          tooltip={item.label}
                        >
                          <Icon />
                          <span>{item.label}</span>
                          <ChevronRight
                            className={`ml-auto size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          />
                        </SidebarMenuButton>
                        {isOpen && (
                          <SidebarMenuSub>
                            {item.children.map((child) => {
                              const ChildIcon = iconMap[child.icon];
                              const childActive = isActivePath(child.path);

                              return (
                                <SidebarMenuSubItem key={child.path}>
                                  <SidebarMenuSubButton asChild isActive={childActive}>
                                    <button
                                      aria-current={childActive ? 'page' : undefined}
                                      onClick={() => navigate(child.path!)}
                                      type="button"
                                    >
                                      <ChildIcon />
                                      <span>{child.label}</span>
                                    </button>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  const active = isActivePath(item.path);

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={active}
                        onClick={() => navigate(item.path!)}
                        tooltip={item.label}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-[var(--wr-border-subtle)] p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-12" size="lg" tooltip={user.displayName}>
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--wr-border-strong)] text-sm font-semibold text-[var(--wr-text-primary)]">
                  {avatar ? (
                    <img alt="User avatar" className="h-full w-full object-cover" src={avatar} />
                  ) : (
                    user.displayName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-[var(--wr-text-primary)]">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--wr-text-muted)]">
                    {roleLabels[user.role]}
                  </p>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-[var(--wr-error)] hover:bg-[var(--wr-error-bg)]"
                onClick={handleLogout}
                tooltip="Sign Out"
              >
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[var(--wr-bg-page)]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--wr-border-default)] bg-[rgba(254,253,251,0.92)] px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="size-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--wr-text-primary)]">
                {roleHomeLabels[user.role]}
              </p>
              <p className="truncate text-xs text-[var(--wr-text-muted)]">
                Recruitment Workflow Management System
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-[var(--wr-border-subtle)] bg-[var(--wr-bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--wr-text-secondary)] sm:flex">
            <span className="size-2 rounded-full bg-[var(--wr-success)]" />
            Connected to gateway
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
