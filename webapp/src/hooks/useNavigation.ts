import { useMemo } from 'react';
import { UserRole, NavItem } from '../types/navigation';
import type { NavigationMetadata } from '../types/navigation';

// Navigation metadata - imported inline to avoid path issues
const metadata: NavigationMetadata = {
  roles: {
    ADMIN: {
      label: "Administrator",
      navItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/admin/dashboard",
          icon: "LayoutDashboard",
          description: "System overview and key metrics"
        },
        {
          id: "approval-queue",
          label: "Approval Queue",
          path: "/admin/approvals",
          icon: "CheckCircle",
          description: "Pending recruitment requests and plans"
        },
        {
          id: "all-requests",
          label: "All Requests",
          path: "/admin/requests",
          icon: "ListTodo",
          description: "View all recruitment requests"
        },
        {
          id: "interview-results",
          label: "Interview Results",
          path: "/admin/interviews/results",
          icon: "BarChart3",
          description: "Review and approve interview results"
        },
        {
          id: "users",
          label: "Users",
          path: "/admin/users",
          icon: "Users",
          description: "Manage users and permissions"
        },
        {
          id: "settings",
          label: "Settings",
          path: "/admin/settings",
          icon: "Settings",
          description: "System configuration"
        },
        {
          id: "reports-annual",
          label: "Reports > Annual",
          path: "/admin/reports/annual",
          icon: "FileText",
          description: "Annual recruitment statistics"
        },
        {
          id: "reports-dept-stats",
          label: "Reports > Dept Stats",
          path: "/admin/reports/department",
          icon: "PieChart",
          description: "Department-level recruitment metrics"
        }
      ]
    },
    DEPARTMENT_HEAD: {
      label: "Department Head",
      navItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/department/dashboard",
          icon: "LayoutDashboard",
          description: "Department overview"
        },
        {
          id: "my-requests",
          label: "My Requests",
          path: "/department/requests",
          icon: "FileCheck",
          description: "Create and track recruitment requests"
        },
        {
          id: "interviews",
          label: "Interviews",
          path: "/department/interviews",
          icon: "Calendar",
          description: "Scheduled interviews and participation"
        },
        {
          id: "tracking",
          label: "Tracking",
          path: "/department/tracking",
          icon: "TrendingUp",
          description: "Monitor request progress"
        }
      ]
    },
    HR_MANAGER: {
      label: "HR Manager",
      navItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/hr/dashboard",
          icon: "LayoutDashboard",
          description: "HR operations overview"
        },
        {
          id: "requests-inbox",
          label: "Requests Inbox",
          path: "/hr/requests/inbox",
          icon: "Inbox",
          description: "Incoming recruitment requests"
        },
        {
          id: "requests-list",
          label: "Requests List",
          path: "/hr/requests/list",
          icon: "ListTodo",
          description: "All recruitment requests"
        },
        {
          id: "plans",
          label: "Plans",
          path: "/hr/plans",
          icon: "ClipboardList",
          description: "Create and manage recruitment plans"
        },
        {
          id: "candidates",
          label: "Candidates",
          path: "/hr/candidates",
          icon: "Users",
          description: "Search and manage candidates"
        },
        {
          id: "interviews",
          label: "Interviews",
          path: "/hr/interviews",
          icon: "Calendar",
          description: "Schedule and manage interviews"
        },
        {
          id: "results",
          label: "Results",
          path: "/hr/interviews/results",
          icon: "CheckCircle",
          description: "Interview results and decisions"
        },
        {
          id: "cv-manager",
          label: "CV Manager",
          path: "/hr/cvs",
          icon: "FileText",
          description: "Manage candidate CVs and documents"
        },
        {
          id: "reports-pipeline",
          label: "Reports > Pipeline",
          path: "/hr/reports/pipeline",
          icon: "Zap",
          description: "Recruitment pipeline overview"
        },
        {
          id: "settings",
          label: "Settings",
          path: "/hr/settings",
          icon: "Settings",
          description: "HR configuration"
        }
      ]
    },
    CANDIDATE: {
      label: "Candidate",
      navItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/candidate/dashboard",
          icon: "LayoutDashboard",
          description: "Your applications overview"
        },
        {
          id: "profile",
          label: "Profile",
          path: "/candidate/profile",
          icon: "User",
          description: "Manage your profile"
        },
        {
          id: "applications",
          label: "My Applications",
          path: "/candidate/applications",
          icon: "FileCheck",
          description: "Track your job applications"
        },
        {
          id: "notifications",
          label: "Notifications",
          path: "/candidate/notifications",
          icon: "Bell",
          description: "Interview invites and updates"
        }
      ]
    }
  },
  coverageMatrix: {
    ADMIN: {
      totalItems: 8,
      categories: ["Dashboard", "Approvals", "Management", "Reporting"]
    },
    DEPARTMENT_HEAD: {
      totalItems: 4,
      categories: ["Dashboard", "Requests", "Interviews"]
    },
    HR_MANAGER: {
      totalItems: 10,
      categories: ["Dashboard", "Requests", "Planning", "Candidates", "Interviews", "Reporting"]
    },
    CANDIDATE: {
      totalItems: 4,
      categories: ["Dashboard", "Profile", "Applications"]
    }
  }
};

/**
 * Hook to get navigation items based on user role
 */
export const useNavigation = (role: UserRole | string): NavItem[] => {
  return useMemo(() => {
    const roleData = metadata.roles[role as keyof typeof metadata.roles];
    return roleData?.navItems || [];
  }, [role]);
};

/**
 * Hook to get role label
 */
export const useRoleLabel = (role: UserRole | string): string => {
  return useMemo(() => {
    const roleData = metadata.roles[role as keyof typeof metadata.roles];
    return roleData?.label || role;
  }, [role]);
};

/**
 * Hook to get coverage matrix for role
 */
export const useRoleCoverage = (role: UserRole | string) => {
  return useMemo(() => {
    return metadata.coverageMatrix[role as keyof typeof metadata.coverageMatrix] || null;
  }, [role]);
};

/**
 * Helper function to check if user has access to a route
 */
export const hasAccessToRoute = (userRole: UserRole | string, routePath: string): boolean => {
  const navItems = metadata.roles[userRole as keyof typeof metadata.roles]?.navItems;
  if (!navItems) return false;
  
  return navItems.some((item: NavItem) => 
    item.path === routePath || 
    (item.children?.some((child: NavItem) => child.path === routePath) ?? false)
  );
};

/**
 * Get all accessible routes for a role
 */
export const getAccessibleRoutes = (userRole: UserRole | string): string[] => {
  const navItems = metadata.roles[userRole as keyof typeof metadata.roles]?.navItems;
  if (!navItems) return [];
  
  const routes: string[] = [];
  
  navItems.forEach((item: NavItem) => {
    routes.push(item.path);
    if (item.children) {
      item.children.forEach((child: NavItem) => routes.push(child.path));
    }
  });
  
  return routes;
};
