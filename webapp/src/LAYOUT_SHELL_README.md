# Layout Shell - Role-Based Navigation

A comprehensive role-based layout shell with sidebar navigation for the Recruitment Management System (RMS).

## Overview

This layout shell provides a responsive, role-aware navigation system that adapts the sidebar and available routes based on user roles:

- **Admin**: 8 navigation items (Dashboard, Approvals, Requests, Interviews, Users, Settings, Reports)
- **Department Head**: 4 navigation items (Dashboard, Requests, Interviews, Tracking)
- **HR Manager**: 10 navigation items (Dashboard, Requests, Plans, Candidates, Interviews, Results, CV Manager, Reports, Settings)
- **Candidate**: 4 navigation items (Dashboard, Profile, Applications, Notifications)

## Architecture

### File Structure

```
webapp/src/
├── components/
│   ├── Layout.tsx              # Main layout wrapper
│   ├── Sidebar.tsx             # Sidebar navigation component
│   └── ProtectedRoute.tsx       # Route protection component
├── hooks/
│   └── useNavigation.ts         # Navigation and role hooks
├── styles/
│   ├── Layout.css              # Layout styles
│   └── Sidebar.css             # Sidebar styles
├── types/
│   └── navigation.ts           # TypeScript types
├── index.ts                    # Module exports
└── LAYOUT_SHELL_USAGE.tsx      # Usage examples

metadata.json                   # Navigation configuration (at root)
```

## Components

### Layout

Main layout wrapper that combines header, sidebar, and content area.

```tsx
import { Layout, UserRole, type User } from './index';

const user: User = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: UserRole.ADMIN,
  organizationId: 'org-1',
};

<Layout user={user} onLogout={() => console.log('logout')}>
  <YourContent />
</Layout>
```

**Props:**
- `user` (User) - Current logged-in user
- `children` (React.ReactNode) - Content to display
- `onLogout` (function, optional) - Logout callback

### Sidebar

Navigation sidebar with role-based items.

**Features:**
- Collapse/expand toggle
- Active route highlighting
- Nested menu support
- Badge support (notification counts)
- Responsive design
- Keyboard accessible

### ProtectedRoute

Route guard component for access control.

```tsx
<ProtectedRoute 
  user={user}
  requiredRole={UserRole.ADMIN}
  requiredPath="/admin/dashboard"
>
  <AdminDashboard />
</ProtectedRoute>
```

**Props:**
- `user` (User | null) - Current user
- `requiredRole` (UserRole | UserRole[], optional) - Required role(s)
- `requiredPath` (string, optional) - Required accessible path
- `children` (React.ReactNode) - Protected content
- `fallback` (React.ReactNode, optional) - Fallback on denial

## Hooks

### useNavigation

Get navigation items for a role.

```tsx
const navItems = useNavigation(UserRole.ADMIN);
// Returns: NavItem[] for admin role
```

### useRoleLabel

Get human-readable label for a role.

```tsx
const label = useRoleLabel(UserRole.ADMIN);
// Returns: "Administrator"
```

### useRoleCoverage

Get coverage matrix for a role.

```tsx
const coverage = useRoleCoverage(UserRole.ADMIN);
// Returns: { totalItems: 8, categories: [...] }
```

### Helper Functions

**hasAccessToRoute(userRole, routePath)**
- Check if user has access to a specific route

**getAccessibleRoutes(userRole)**
- Get all accessible routes for a role

## Navigation Configuration

Navigation is configured in `metadata.json` at the project root.

### Structure

```json
{
  "roles": {
    "ADMIN": {
      "label": "Administrator",
      "navItems": [
        {
          "id": "dashboard",
          "label": "Dashboard",
          "path": "/admin/dashboard",
          "icon": "LayoutDashboard",
          "description": "System overview",
          "badge": 5,
          "badgeVariant": "destructive"
        }
      ]
    }
  },
  "coverageMatrix": {
    "ADMIN": {
      "totalItems": 8,
      "categories": ["Dashboard", "Approvals", "Management", "Reporting"]
    }
  }
}
```

### Adding New Navigation Items

Edit `metadata.json`:

```json
{
  "roles": {
    "ADMIN": {
      "navItems": [
        {
          "id": "new-item",
          "label": "New Item",
          "path": "/admin/new-route",
          "icon": "IconName",
          "description": "Description of the item"
        }
      ]
    }
  }
}
```

## Role Configuration

### Admin (8 items)

| Item | Path | Description |
|------|------|-------------|
| Dashboard | `/admin/dashboard` | System overview and metrics |
| Approval Queue | `/admin/approvals` | Pending requests and plans |
| All Requests | `/admin/requests` | View all recruitment requests |
| Interview Results | `/admin/interviews/results` | Review interview results |
| Users | `/admin/users` | User management |
| Settings | `/admin/settings` | System configuration |
| Reports > Annual | `/admin/reports/annual` | Annual statistics |
| Reports > Dept Stats | `/admin/reports/department` | Department metrics |

### Department Head (4 items)

| Item | Path | Description |
|------|------|-------------|
| Dashboard | `/department/dashboard` | Department overview |
| My Requests | `/department/requests` | Track requests |
| Interviews | `/department/interviews` | Scheduled interviews |
| Tracking | `/department/tracking` | Request progress |

### HR Manager (10 items)

| Item | Path | Description |
|------|------|-------------|
| Dashboard | `/hr/dashboard` | HR operations overview |
| Requests Inbox | `/hr/requests/inbox` | Incoming requests |
| Requests List | `/hr/requests/list` | All requests |
| Plans | `/hr/plans` | Recruitment plans |
| Candidates | `/hr/candidates` | Candidate management |
| Interviews | `/hr/interviews` | Interview management |
| Results | `/hr/interviews/results` | Interview results |
| CV Manager | `/hr/cvs` | CV management |
| Reports > Pipeline | `/hr/reports/pipeline` | Pipeline overview |
| Settings | `/hr/settings` | HR configuration |

### Candidate (4 items)

| Item | Path | Description |
|------|------|-------------|
| Dashboard | `/candidate/dashboard` | Applications overview |
| Profile | `/candidate/profile` | Profile management |
| My Applications | `/candidate/applications` | Track applications |
| Notifications | `/candidate/notifications` | Interview invites |

## Styling

### CSS Variables

```css
--sidebar-width: 280px
--sidebar-width-collapsed: 80px
--sidebar-bg: #1a1a1a
--sidebar-text: #e0e0e0
--sidebar-active: #0066cc
--header-height: 60px
--header-bg: #fff
--content-bg: #f5f5f5
```

### Responsive Breakpoints

- **Desktop**: Full sidebar
- **Tablet (≤1024px)**: Adjusted padding
- **Mobile (≤768px)**: Collapsed sidebar
- **Small Mobile (≤480px)**: Minimal UI

### Dark Mode

Automatically respects `prefers-color-scheme: dark` media query.

## Usage Examples

### Basic Setup

```tsx
import { Layout, UserRole } from './index';

export const App = () => {
  const user = {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: UserRole.ADMIN,
    organizationId: 'org-1',
  };

  return (
    <Layout user={user}>
      <YourPages />
    </Layout>
  );
};
```

### With React Router

```tsx
import { Layout, ProtectedRoute, UserRole } from './index';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export const App = () => {
  const user = getCurrentUser();

  return (
    <BrowserRouter>
      <Layout user={user}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute user={user} requiredRole={UserRole.ADMIN}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* More routes */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};
```

### Checking Access

```tsx
import { hasAccessToRoute, getAccessibleRoutes } from './index';

// Check specific route
if (hasAccessToRoute(user.role, '/admin/users')) {
  // Show admin features
}

// Get all accessible routes
const routes = getAccessibleRoutes(user.role);
```

## Customization

### Add Custom Navigation Logic

Extend the `useNavigation` hook:

```tsx
export const useCustomNavigation = (user: User) => {
  const baseNavItems = useNavigation(user.role);
  
  // Filter or add items based on custom logic
  return baseNavItems.filter(item => {
    // Custom filtering
    return true;
  });
};
```

### Custom Styling

Override CSS variables:

```css
:root {
  --sidebar-width: 320px;
  --sidebar-active: #ff6b6b;
  --header-bg: #1a1a1a;
}
```

### Add Nested Menus

Update `metadata.json`:

```json
{
  "id": "reports",
  "label": "Reports",
  "path": "#",
  "icon": "FileText",
  "children": [
    {
      "id": "reports-annual",
      "label": "Annual",
      "path": "/admin/reports/annual",
      "icon": "Calendar"
    }
  ]
}
```

## Accessibility

- Keyboard navigation support
- ARIA labels on buttons
- Semantic HTML
- Color contrast compliance
- Screen reader friendly
- Focus indicators

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Lazy loading of navigation metadata
- Memoized hooks for preventing re-renders
- CSS transitions for smooth animations
- Minimal bundle size (~15KB gzipped)

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type { User, NavItem, UserRole } from './types/navigation';
import { Layout, useNavigation } from './index';
```

## Testing

Example test setup:

```tsx
import { render } from '@testing-library/react';
import { Layout } from './components/Layout';
import { UserRole } from './types/navigation';

describe('Layout', () => {
  it('renders admin navigation', () => {
    const user = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin',
      role: UserRole.ADMIN,
      organizationId: 'org-1',
    };

    render(<Layout user={user}><div>Content</div></Layout>);
    // Assertions...
  });
});
```

## Troubleshooting

### Navigation items not showing

- Verify `metadata.json` is in the project root
- Check that `navItems` array is populated in metadata
- Ensure user role matches role key in metadata

### Route protection not working

- Wrap routes with `ProtectedRoute` component
- Provide valid user object with role
- Check that routes match paths in metadata.json

### Styling issues

- Verify CSS files are imported
- Check CSS variables are defined
- Clear browser cache
- Check responsive breakpoints

## Migration Guide

### From Previous Navigation

1. Update user type to include `organizationId`
2. Replace old navigation components with `Layout`
3. Update routes to use `ProtectedRoute`
4. Migrate navigation config to `metadata.json`
5. Update styles if using custom theme

## Future Enhancements

- [ ] Deep linking with breadcrumbs
- [ ] Navigation animations
- [ ] Sidebar search
- [ ] Favorites/pinned items
- [ ] Dynamic menu generation from API
- [ ] Role hierarchy support
- [ ] Navigation analytics
- [ ] Advanced permission system

## License

Internal project - SE20A05Group7RMS
