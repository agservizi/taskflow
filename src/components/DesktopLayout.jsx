import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import {
  gridOutline, grid,
  listOutline, list,
  addCircleOutline,
  personOutline, person,
  analyticsOutline, analytics,
  calendarOutline, calendar,
  folderOutline, folder,
  flameOutline, flame,
  trophyOutline, trophy,
  colorPaletteOutline, colorPalette,
  documentTextOutline, documentText,
  logOutOutline,
  searchOutline,
  sunnyOutline,
  moonOutline,
  chevronForwardOutline,
  chevronBackOutline,
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import './DesktopLayout.css';

const navItems = [
  { key: 'dashboard', path: '/tabs/dashboard', label: 'Dashboard', icon: gridOutline, iconActive: grid },
  { key: 'tasks', path: '/tabs/tasks', label: 'Task', icon: listOutline, iconActive: list },
  { key: 'calendar', path: '/tabs/calendar', label: 'Calendario', icon: calendarOutline, iconActive: calendar },
  { key: 'projects', path: '/tabs/projects', label: 'Progetti', icon: folderOutline, iconActive: folder },
  { key: 'habits', path: '/tabs/habits', label: 'Abitudini', icon: flameOutline, iconActive: flame },
  { key: 'analytics', path: '/tabs/analytics', label: 'Analytics', icon: analyticsOutline, iconActive: analytics },
  { key: 'gamification', path: '/tabs/gamification', label: 'Gamification', icon: trophyOutline, iconActive: trophy },
  { key: 'templates', path: '/tabs/templates', label: 'Template', icon: documentTextOutline, iconActive: documentText },
  { key: 'categories', path: '/tabs/categories', label: 'Categorie', icon: colorPaletteOutline, iconActive: colorPalette },
];

const DesktopLayout = ({ children }) => {
  const history = useHistory();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const currentPath = location.pathname;

  const handleNav = (path) => {
    history.push(path);
  };

  const handleSignOut = async () => {
    await signOut();
    history.push('/login');
  };

  const userEmail = user?.email || '';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className={`desktop-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <motion.aside
        className="desktop-sidebar"
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {/* Logo */}
        <div className="sidebar-header" onClick={() => handleNav('/tabs/dashboard')}>
          <img src="/favicon.png" alt="TaskFlow" className="sidebar-logo-img" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="sidebar-logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                TaskFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Create button */}
        <button className="sidebar-create-btn" onClick={() => handleNav('/tabs/create')}>
          <IonIcon icon={addCircleOutline} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Nuovo Task
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            return (
              <button
                key={item.key}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <IonIcon icon={isActive ? item.iconActive : item.icon} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    className="nav-active-indicator"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={toggleTheme} title={isDark ? 'Tema chiaro' : 'Tema scuro'}>
            <IonIcon icon={isDark ? sunnyOutline : moonOutline} />
            {!collapsed && <span>{isDark ? 'Chiaro' : 'Scuro'}</span>}
          </button>
          <button
            className="sidebar-footer-btn"
            onClick={() => handleNav('/tabs/profile')}
            title="Profilo"
          >
            <div className="sidebar-avatar">{userInitial}</div>
            {!collapsed && <span className="sidebar-email">{userEmail}</span>}
          </button>
          <button className="sidebar-footer-btn danger" onClick={handleSignOut} title="Esci">
            <IonIcon icon={logOutOutline} />
            {!collapsed && <span>Esci</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <IonIcon icon={collapsed ? chevronForwardOutline : chevronBackOutline} />
        </button>
      </motion.aside>

      {/* Main content */}
      <main className="desktop-main">
        <div className="desktop-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DesktopLayout;
