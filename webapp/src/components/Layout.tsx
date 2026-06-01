import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useNavigation } from '../hooks/useNavigation';
import { LayoutProps } from '../types/navigation';
import '../styles/Layout.css';

/**
 * Main Layout Component
 * Wraps application with role-based sidebar and header
 */
export const Layout: React.FC<LayoutProps> = ({
  user,
  children,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navItems = useNavigation(user.role);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout-container">
      <Sidebar
        user={user}
        navItems={navItems}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
      />

      <div className="layout-main">
        <header className="layout-header">
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span className="hamburger-icon">☰</span>
          </button>

          <div className="header-title">
            <h1>Recruitment Management System</h1>
          </div>

          <div className="header-actions">
            <button className="header-btn notifications-btn" aria-label="Notifications">
              🔔
            </button>
            <button className="header-btn profile-btn" aria-label="Profile">
              👤
            </button>
            <button
              className="header-btn logout-btn"
              onClick={onLogout}
              aria-label="Logout"
            >
              🚪
            </button>
          </div>
        </header>

        <main className="layout-content">
          {children}
        </main>

        <footer className="layout-footer">
          <p>&copy; 2026 Recruitment Management System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
