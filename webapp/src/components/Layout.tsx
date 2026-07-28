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
import { ApiError, apiRequest } from '../lib/api';
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

type InAppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
};

type ProfileAvatarResponse = {
  structuredData?: {
    avatar?: unknown;
  } | null;
};

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
    throw new Error(
      `Sidebar coverage mismatch for ${role}: expected ${expected}, received ${actual}`,
    );
  }
});

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'System Admin',
  [UserRole.DEPARTMENT_HEAD]: 'Department Head',
  [UserRole.HR_LEADER]: 'HR',
  [UserRole.CANDIDATE]: 'Candidate',
};

const roleHomeLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin Dashboard',
  [UserRole.DEPARTMENT_HEAD]: 'Department Dashboard',
  [UserRole.HR_LEADER]: 'HR Dashboard',
  [UserRole.CANDIDATE]: 'Candidate Dashboard',
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
        const profile = await apiRequest<ProfileAvatarResponse>(
          '/candidate-profiles/me',
          token,
        ).catch((error) => {
          if (error instanceof ApiError && error.status === 404) {
            return null;
          }
          throw error;
        });

        if (!profile?.structuredData?.avatar) {
          clearAvatar();
          return;
        }

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

  useEffect(() => {
    if (!token || !user) {
      setNotifications([]);
      return;
    }

    let active = true;
    const loadNotifications = async () => {
      try {
        const nextNotifications = await apiRequest<InAppNotification[]>('/notifications', token);
        if (active) setNotifications(nextNotifications);
      } catch {
        // Notification delivery must not make the dashboard unusable.
      }
    };

    void loadNotifications();
    const refreshId = window.setInterval(() => void loadNotifications(), 30_000);
    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, [token, user]);

  if (!user) return <>{children}</>;

  const isActivePath = (path?: string) => {
    if (!path) return false;
    return (
      location.pathname === path ||
      (path.split('/').filter(Boolean).length > 1 &&
        location.pathname.startsWith(`${path}/`))
    );
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    await logout();
    window.location.replace('/login');
  };

  const notificationDestination = (notification: InAppNotification) => {
    if (notification.relatedEntityType === 'Campaign' && user.role === UserRole.ADMIN) {
      return '/admin/reports';
    }

    if (notification.relatedEntityType === 'InterviewSchedule') {
      if (user.role === UserRole.CANDIDATE) return '/candidate/interviews';
      if (user.role === UserRole.HR_LEADER) return '/hr/interviews';
      if (user.role === UserRole.DEPARTMENT_HEAD) return '/dept-head/interviews';
      return '/admin/interview-results';
    }

    if (notification.relatedEntityType === 'OfferLetter' && user.role === UserRole.CANDIDATE) {
      return notification.relatedEntityId
        ? `/candidate/offer/${notification.relatedEntityId}`
        : '/candidate/offers';
    }

    if (notification.relatedEntityType === 'RecruitmentRequest') {
      if (user.role === UserRole.ADMIN) return '/admin/approval-queue';
      if (user.role === UserRole.HR_LEADER) return '/hr/requests';
      if (user.role === UserRole.DEPARTMENT_HEAD) return '/dept-head/requests';
    }

    return user.role === UserRole.CANDIDATE ? '/candidate/notifications' : '/dashboard';
  };

  const openNotification = (notification: InAppNotification) => {
    setNotificationsOpen(false);
    if (!notification.isRead) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
      );
      void apiRequest(`/notifications/${notification.id}/read`, token, { method: 'PATCH' }).catch(() => {
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: false } : item)),
        );
      });
    }
    navigate(notificationDestination(notification));
  };

  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;

  return (
    <SidebarProvider>
      <Sidebar
        className="border-[var(--wr-border-default)] bg-[var(--wr-bg-surface)]"
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-[var(--wr-border-subtle)] p-4 group-data-[collapsible=icon]:px-1">
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-12 gap-3 overflow-visible hover:bg-transparent data-[active=true]:bg-transparent group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-20! group-data-[collapsible=icon]:p-0!"
                size="lg"
                tooltip="Works Recruiter"
              >
                <object
                  aria-label="RMS Recruiter"
                  className="pointer-events-none h-10 w-20 shrink-0 object-contain transition"
                  data="/logo-offical.svg"
                  tabIndex={-1}
                  type="image/svg+xml"
                >
                  RMS Recruiter
                </object>
                <div className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
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

        <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-0">
          <SidebarGroup className="group-data-[collapsible=icon]:p-0">
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
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

        <SidebarFooter className="border-t border-[var(--wr-border-subtle)] p-3 group-data-[collapsible=icon]:px-1">
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-label="Open account settings"
                className="h-12 group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-1.5!"
                isActive={location.pathname === '/account-settings'}
                onClick={() => navigate('/account-settings')}
                size="lg"
                tooltip={`${user.displayName} · Account settings`}
              >
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--wr-border-strong)] text-sm font-semibold text-[var(--wr-text-primary)]">
                  {avatar ? (
                    <img alt="User avatar" className="h-full w-full object-cover" src={avatar} />
                  ) : (
                    user.displayName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
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
                disabled={loggingOut}
                onClick={handleLogout}
                tooltip="Sign Out"
              >
                <LogOut />
                <span>{loggingOut ? 'Signing Out...' : 'Sign Out'}</span>
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

          <div className="relative flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[var(--wr-border-subtle)] bg-[var(--wr-bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--wr-text-secondary)] sm:flex">
              <span className="size-2 rounded-full bg-[var(--wr-success)]" />
              Connected to gateway
            </div>
            <button
              aria-expanded={notificationsOpen}
              aria-haspopup="menu"
              aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
              className="relative inline-flex size-10 items-center justify-center rounded-full border border-[var(--wr-border-subtle)] bg-[var(--wr-bg-surface)] text-[var(--wr-text-secondary)] transition hover:bg-[var(--wr-bg-muted)] hover:text-[var(--wr-text-primary)]"
              onClick={() => setNotificationsOpen((open) => !open)}
              type="button"
            >
              <Bell className="size-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[var(--wr-error)] px-1 text-[10px] font-bold leading-5 text-white">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <section
                aria-label="Notifications"
                className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[var(--wr-border-default)] bg-[var(--wr-bg-surface)] shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-[var(--wr-border-subtle)] px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--wr-text-primary)]">Notifications</h2>
                    <p className="text-xs text-[var(--wr-text-muted)]">Newest first</p>
                  </div>
                  {unreadNotifications > 0 && (
                    <span className="text-xs font-medium text-[var(--wr-text-secondary)]">
                      {unreadNotifications} unread
                    </span>
                  )}
                </div>
                <div className="max-h-[26rem] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-[var(--wr-text-muted)]">
                      You have no notifications.
                    </p>
                  ) : (
                    notifications.slice(0, 12).map((notification) => (
                      <button
                        className={`block w-full border-b border-[var(--wr-border-subtle)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[var(--wr-bg-muted)] ${
                          notification.isRead ? '' : 'bg-[var(--wr-bg-muted)]'
                        }`}
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                        type="button"
                      >
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--wr-primary)]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--wr-text-primary)]">
                              {notification.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--wr-text-secondary)]">
                              {notification.body}
                            </p>
                            <time className="mt-1 block text-[11px] text-[var(--wr-text-muted)]">
                              {new Date(notification.createdAt).toLocaleString()}
                            </time>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
