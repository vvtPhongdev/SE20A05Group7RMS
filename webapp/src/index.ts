/**
 * Layout & Navigation Module Exports
 */

// Components
export { Layout } from './components/Layout';
export { Sidebar } from './components/Sidebar';
export { ProtectedRoute } from './components/ProtectedRoute';

// Hooks
export { 
  useNavigation, 
  useRoleLabel, 
  useRoleCoverage,
  hasAccessToRoute,
  getAccessibleRoutes 
} from './hooks/useNavigation';

// Types
export type { 
  NavItem, 
  RoleNavigation, 
  NavigationMetadata,
  User,
  LayoutProps,
  SidebarProps 
} from './types/navigation';
export { UserRole } from './types/navigation';
