import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { NavItem, SidebarProps } from '../types/navigation';
import '../styles/Sidebar.css';

/**
 * Sidebar Navigation Component
 * Renders role-based navigation items
 */
export const Sidebar: React.FC<SidebarProps> = ({
  user,
  navItems,
  isOpen = true,
  onClose,
  currentPath,
}) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const activePath = currentPath || location.pathname;

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (path: string): boolean => {
    return activePath === path || activePath.startsWith(path + '/');
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const expanded = expandedItems.includes(item.id);

    return (
      <div key={item.id} className={`nav-item nav-item-depth-${depth}`}>
        <div className="nav-item-wrapper">
          <Link
            to={item.path}
            className={`nav-link ${active ? 'active' : ''}`}
            title={item.description}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && (
              <>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge badge-${item.badgeVariant || 'default'}`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
          {hasChildren && isOpen && (
            <button
              className="nav-expand-btn"
              onClick={() => toggleExpanded(item.id)}
              aria-label={`Toggle ${item.label}`}
            >
              <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>
                {'▶'}
              </span>
            </button>
          )}
        </div>

        {hasChildren && expanded && isOpen && (
          <div className="nav-children">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <h2 className="brand-title">RMS</h2>
          {isOpen && <p className="brand-subtitle">Recruitment</p>}
        </div>
        {!isOpen && onClose && (
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ×
          </button>
        )}
      </div>

      <div className="sidebar-user-info">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        {isOpen && (
          <div className="user-details">
            <p className="user-name">{user.name}</p>
            <p className="user-role">{user.role}</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-items-container">
          {navItems.map(item => renderNavItem(item))}
        </div>
      </nav>

      <div className="sidebar-footer">
        {isOpen && (
          <p className="sidebar-version">v1.0.0</p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
