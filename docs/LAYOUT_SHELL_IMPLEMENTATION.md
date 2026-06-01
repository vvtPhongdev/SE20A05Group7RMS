# Layout Shell Implementation Summary

## Quick Reference

### Role-Based Navigation Matrix

```
┌─────────────────┬───────┬────────────────────────────────────────────┐
│ Role            │ Items │ Navigation Items                           │
├─────────────────┼───────┼────────────────────────────────────────────┤
│ ADMIN           │   8   │ Dashboard, Approval Queue, All Requests,   │
│                 │       │ Interview Results, Users, Settings,        │
│                 │       │ Reports > Annual, Reports > Dept Stats     │
├─────────────────┼───────┼────────────────────────────────────────────┤
│ DEPARTMENT_HEAD │   4   │ Dashboard, My Requests, Interviews,        │
│                 │       │ Tracking                                   │
├─────────────────┼───────┼────────────────────────────────────────────┤
│ HR_MANAGER      │  10   │ Dashboard, Requests Inbox, Requests List,  │
│                 │       │ Plans, Candidates, Interviews, Results,    │
│                 │       │ CV Manager, Reports > Pipeline, Settings   │
├─────────────────┼───────┼────────────────────────────────────────────┤
│ CANDIDATE       │   4   │ Dashboard, Profile, My Applications,       │
│                 │       │ Notifications                              │
└─────────────────┴───────┴────────────────────────────────────────────┘
```

## Components Created

### 1. **metadata.json** (Root Level)
- Central configuration file for all role-based navigation
- Contains navigation items, paths, icons, and descriptions
- Includes coverage matrix for tracking role access

**Key Features:**
- 4 user roles with distinct navigation trees
- Badge support for notifications/alerts
- Icon references for UI rendering
- Descriptive text for accessibility

### 2. **webapp/src/types/navigation.ts**
- TypeScript type definitions
- Exports: `UserRole`, `NavItem`, `User`, `LayoutProps`, `SidebarProps`, etc.

**Exports:**
```typescript
- enum UserRole { ADMIN, DEPARTMENT_HEAD, HR_MANAGER, CANDIDATE }
- interface NavItem
- interface User
- interface LayoutProps
- interface SidebarProps
- interface NavigationMetadata
```

### 3. **webapp/src/hooks/useNavigation.ts**
- Custom React hooks for navigation logic
- Role-based navigation item retrieval
- Route access control functions

**Exports:**
```typescript
- useNavigation(role) → NavItem[]
- useRoleLabel(role) → string
- useRoleCoverage(role) → CoverageInfo
- hasAccessToRoute(role, path) → boolean
- getAccessibleRoutes(role) → string[]
```

### 4. **webapp/src/components/Sidebar.tsx**
- Role-aware sidebar navigation component
- Collapse/expand functionality
- Active route highlighting
- Nested menu support

**Features:**
- Icons and labels
- Badges for notifications
- Keyboard accessible
- Responsive design
- User info display

### 5. **webapp/src/components/Layout.tsx**
- Main layout wrapper component
- Combines header, sidebar, content, footer
- Toggle sidebar visibility
- Header with user actions

**Features:**
- Responsive hamburger toggle
- Notifications button
- Profile button
- Logout button
- Full-screen layout management

### 6. **webapp/src/components/ProtectedRoute.tsx**
- Route protection component
- Role-based access control
- Path-based access control

**Features:**
- Authenticator check
- Role requirements
- Path verification
- Customizable fallback

### 7. **webapp/src/styles/Sidebar.css**
- Complete sidebar styling
- CSS variables for theming
- Responsive breakpoints
- Dark mode support

### 8. **webapp/src/styles/Layout.css**
- Layout and header styling
- Responsive design
- Transition animations
- Accessibility features

### 9. **webapp/src/LAYOUT_SHELL_README.md**
- Comprehensive documentation
- Setup instructions
- Configuration guide
- Customization options

### 10. **webapp/src/LAYOUT_SHELL_USAGE.tsx**
- Usage examples and patterns
- Demo app component
- Navigation hook examples
- Route setup patterns

### 11. **webapp/src/index.ts**
- Module exports barrel file
- Simplified imports for consumers

## File Structure

```
e:\Project\SE20A05Group7RMS\
├── metadata.json                                    (NEW - Config)
└── webapp/src/
    ├── index.ts                                     (NEW - Exports)
    ├── LAYOUT_SHELL_README.md                       (NEW - Docs)
    ├── LAYOUT_SHELL_USAGE.tsx                       (NEW - Examples)
    ├── components/
    │   ├── Layout.tsx                               (NEW)
    │   ├── Sidebar.tsx                              (NEW)
    │   └── ProtectedRoute.tsx                       (NEW)
    ├── hooks/
    │   └── useNavigation.ts                         (NEW)
    ├── styles/
    │   ├── Sidebar.css                              (NEW)
    │   └── Layout.css                               (NEW)
    └── types/
        └── navigation.ts                            (NEW)
```

## Integration Steps

### Step 1: Import Layout
```tsx
import { Layout, UserRole, ProtectedRoute, type User } from './index';
```

### Step 2: Get User Data
```tsx
const user: User = {
  id: '1',
  email: 'user@example.com',
  name: 'John Doe',
  role: UserRole.ADMIN,
  organizationId: 'org-1',
};
```

### Step 3: Wrap App with Layout
```tsx
<Layout user={user} onLogout={handleLogout}>
  <Routes>
    <Route path="/admin/dashboard" element={
      <ProtectedRoute user={user} requiredRole={UserRole.ADMIN}>
        <AdminDashboard />
      </ProtectedRoute>
    } />
  </Routes>
</Layout>
```

## Navigation Item Details

### Admin (8 items)
```
1. Dashboard (/admin/dashboard) - System overview and metrics
2. Approval Queue (/admin/approvals) - Pending requests/plans
3. All Requests (/admin/requests) - View all requests
4. Interview Results (/admin/interviews/results) - Review results
5. Users (/admin/users) - User management
6. Settings (/admin/settings) - System configuration
7. Reports > Annual (/admin/reports/annual) - Annual stats
8. Reports > Dept Stats (/admin/reports/department) - Dept metrics
```

### Department Head (4 items)
```
1. Dashboard (/department/dashboard) - Department overview
2. My Requests (/department/requests) - Track requests
3. Interviews (/department/interviews) - Scheduled interviews
4. Tracking (/department/tracking) - Request progress
```

### HR Manager (10 items)
```
1. Dashboard (/hr/dashboard) - HR operations overview
2. Requests Inbox (/hr/requests/inbox) - Incoming requests
3. Requests List (/hr/requests/list) - All requests
4. Plans (/hr/plans) - Recruitment plans
5. Candidates (/hr/candidates) - Candidate management
6. Interviews (/hr/interviews) - Interview management
7. Results (/hr/interviews/results) - Interview results
8. CV Manager (/hr/cvs) - CV management
9. Reports > Pipeline (/hr/reports/pipeline) - Pipeline overview
10. Settings (/hr/settings) - HR configuration
```

### Candidate (4 items)
```
1. Dashboard (/candidate/dashboard) - Applications overview
2. Profile (/candidate/profile) - Profile management
3. My Applications (/candidate/applications) - Track applications
4. Notifications (/candidate/notifications) - Interview invites
```

## Key Features

### 1. Role-Based Access Control
- Navigation adapts to user role
- Sidebar shows only accessible items
- Routes can be protected with role checks

### 2. Responsive Design
- Desktop: Full 280px sidebar
- Tablet: Collapsed to 80px
- Mobile: Hamburger toggle
- Small Mobile: Minimal UI

### 3. User Experience
- Smooth animations and transitions
- Active route highlighting
- Nested menu support
- Badges for notifications
- User info display

### 4. Developer Experience
- TypeScript support
- Custom hooks for navigation
- Modular component structure
- Centralized configuration
- Easy to extend

### 5. Accessibility
- Keyboard navigation
- ARIA labels
- Semantic HTML
- Color contrast compliance
- Screen reader friendly

### 6. Theming
- CSS variables for customization
- Dark mode support
- Responsive breakpoints
- Professional styling

## Configuration via metadata.json

```json
{
  "roles": {
    "ROLE_NAME": {
      "label": "Human Readable Name",
      "navItems": [
        {
          "id": "unique-id",
          "label": "Display Label",
          "path": "/route/path",
          "icon": "IconName",
          "description": "Tooltip text",
          "badge": 5,
          "badgeVariant": "destructive"
        }
      ]
    }
  },
  "coverageMatrix": {
    "ROLE_NAME": {
      "totalItems": 8,
      "categories": ["Category1", "Category2"]
    }
  }
}
```

## Hooks Reference

### useNavigation
```tsx
const navItems = useNavigation(UserRole.ADMIN);
// Returns array of NavItem for admin role
```

### useRoleLabel
```tsx
const label = useRoleLabel(UserRole.ADMIN);
// Returns "Administrator"
```

### useRoleCoverage
```tsx
const coverage = useRoleCoverage(UserRole.ADMIN);
// Returns { totalItems: 8, categories: [...] }
```

### hasAccessToRoute
```tsx
const hasAccess = hasAccessToRoute(UserRole.ADMIN, '/admin/dashboard');
// Returns boolean
```

### getAccessibleRoutes
```tsx
const routes = getAccessibleRoutes(UserRole.ADMIN);
// Returns string[] of all accessible paths
```

## Styling Variables

```css
--sidebar-width: 280px
--sidebar-width-collapsed: 80px
--sidebar-bg: #1a1a1a
--sidebar-border: #333
--sidebar-text: #e0e0e0
--sidebar-hover: #2a2a2a
--sidebar-active: #0066cc
--sidebar-active-bg: #004999
--header-height: 60px
--header-bg: #fff
--content-bg: #f5f5f5
--footer-bg: #f9f9f9
```

## Next Steps

1. **Install Dependencies**: Ensure React Router is installed
   ```bash
   npm install react-router-dom
   ```

2. **Update App.tsx**: Integrate layout with existing app
   ```tsx
   import { Layout } from './src/index';
   ```

3. **Create Pages**: Build dashboard pages for each role
   ```
   - pages/admin/AdminDashboard.tsx
   - pages/hr/HRDashboard.tsx
   - pages/department/DeptHeadDashboard.tsx
   - pages/candidate/CandidateDashboard.tsx
   ```

4. **Add Routes**: Set up protected routes
   ```tsx
   <Route path="/admin/dashboard" element={
     <ProtectedRoute user={user} requiredRole={UserRole.ADMIN}>
       <AdminDashboard />
     </ProtectedRoute>
   } />
   ```

5. **Customize**: Modify metadata.json and styles as needed

## Support

For questions or issues:
- Review LAYOUT_SHELL_README.md
- Check LAYOUT_SHELL_USAGE.tsx examples
- Examine metadata.json configuration
- Verify user role and accessible routes

---

**Project**: SE20A05Group7RMS  
**Date**: June 1, 2026  
**Version**: 1.0.0
