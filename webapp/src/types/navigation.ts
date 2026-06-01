/**
 * Role-based navigation types
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  HR_MANAGER = 'HR_MANAGER',
  CANDIDATE = 'CANDIDATE',
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  description?: string;
  children?: NavItem[];
  badge?: number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface RoleNavigation {
  label: string;
  navItems: NavItem[];
}

export interface NavigationMetadata {
  roles: Record<UserRole | string, RoleNavigation>;
  coverageMatrix: Record<UserRole | string, {
    totalItems: number;
    categories: string[];
  }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  departmentId?: string;
}

export interface LayoutProps {
  user: User;
  children: React.ReactNode;
  onLogout?: () => void;
}

export interface SidebarProps {
  user: User;
  navItems: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
  currentPath?: string;
}
