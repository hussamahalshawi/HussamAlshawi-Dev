/**
 * DashboardLayout.jsx
 * ─────────────────────────────────────────────────────────
 * Root layout wrapper for the dashboard interface.
 * Renders: fixed sidebar, sticky topbar, scrollable content area.
 * Inspired by Devoryn-style glassmorphism panel layout.
 * ─────────────────────────────────────────────────────────
 */
import { useState }       from 'react';                      // State for mobile sidebar toggle
import { useProfile }     from '../../hooks/useProfile';     // Profile data for user info
import { getInitials }    from '../../utils/formatters';     // Initials from full name
import { NAV_LINKS }      from '../../utils/constants';      // Navigation configuration
import '../../styles/layout/DashboardLayout.css';            // Layout-specific styles

/**
 * Navigation items configuration with icons
 * Each item maps to a section anchor and displays with an emoji icon
 */
const NAV_ITEMS = [
  { label: 'Dashboard',  href: '#overview',    icon: '⊞',  id: 'overview'   },
  { label: 'Analytics',  href: '#analytics',   icon: '↗',  id: 'analytics'  },
  { label: 'Skills',     href: '#skills',       icon: '◎',  id: 'skills'     },
  { label: 'Projects',   href: '#projects',     icon: '⊡',  id: 'projects'   },
  { label: 'Experience', href: '#experience',   icon: '⊛',  id: 'experience' },
  { label: 'Goals',      href: '#goals',        icon: '◈',  id: 'goals'      },
  { label: 'Contact',    href: '#contact',      icon: '✉',  id: 'contact'    },
];

/**
 * @param {object}          props
 * @param {React.ReactNode} props.children    - Page content to render in main area
 * @param {string}          props.activeSection - Currently visible section ID
 * @param {object|null}     props.profile     - Profile data from API
 */
export default function DashboardLayout({ children, activeSection = '', profile }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);    // Mobile sidebar toggle state

  // Derive user display data safely with fallbacks
  const fullName = profile?.full_name || 'Hussam Alshawi';  // Full name or fallback
  const initials = getInitials(fullName);                    // "HA" format initials
  const title    = profile?.title || 'Full Stack Developer'; // Job title fallback
  const avatar   = profile?.primary_avatar || null;          // Cloudinary avatar URL
  const available = profile?.is_available_for_hire || false; // Hire status flag

  return (
    <div className="dashboard-root">

      {/* ══════════════════════════════════════
          SIDEBAR — Fixed left navigation panel
      ══════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>

        {/* ── Logo ── */}
        <a href="#overview" className="sidebar__logo" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar__logo-mark">HA</div>          {/* Brand badge */}
          <span className="sidebar__logo-text">
            HA<em>.</em>Dev                                    {/* Cyan accent dot */}
          </span>
        </a>

        {/* ── Navigation section label ── */}
        <span className="sidebar__nav-label">Navigation</span>

        {/* ── Nav items list ── */}
        <nav className="sidebar__nav" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(item => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-item ${activeSection === item.id ? 'nav-item--active' : ''}`}
              onClick={() => setSidebarOpen(false)}            /* Close mobile sidebar on click */
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              <span className="nav-item__icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* ── Bottom user card ── */}
        <div className="sidebar__user">
          <div className="sidebar__user-card" role="button" tabIndex={0} aria-label="User profile">

            {/* Avatar: image or initials fallback */}
            <div className="sidebar__avatar">
              {avatar
                ? <img src={avatar} alt={`${fullName} avatar`} />
                : initials                                    /* Text initials fallback */
              }
            </div>

            {/* Name and role */}
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{fullName}</div>
              <div className="sidebar__user-role">
                {available ? 'Available for hire' : title}    {/* Dynamic status label */}
              </div>
            </div>

            {/* Online indicator */}
            <div className="sidebar__online-dot" aria-label="Online" />
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN — Topbar + Page content
      ══════════════════════════════════════ */}
      <div className="dashboard-main">

        {/* ── Top Bar ── */}
        <header className="topbar" role="banner">

          {/* Left: Greeting */}
          <div className="topbar__greeting">
            <div className="topbar__greeting-hi">
              Hi, {fullName.split(' ')[0]}! 👋                {/* First name only */}
            </div>
            <div className="topbar__greeting-sub">
              Welcome to your Portfolio
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="topbar__actions">

            {/* Notification bell */}
            <button
              className="topbar__icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              🔔
              <span className="topbar__notif-dot" aria-hidden="true" />
            </button>

            {/* Settings button */}
            <button
              className="topbar__icon-btn"
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </button>

            {/* User profile pill */}
            <div className="topbar__user" role="button" tabIndex={0}>
              <div className="topbar__user-avatar">
                {avatar
                  ? <img src={avatar} alt="Profile" />
                  : initials                                  /* Initials fallback */
                }
              </div>
              <span>{fullName}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>▾</span>
            </div>

            {/* Mobile hamburger button */}
            <button
              className="topbar__icon-btn"
              onClick={() => setSidebarOpen(prev => !prev)}   /* Toggle sidebar */
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              style={{ display: 'none' }}                     /* Hidden on desktop via CSS */
              id="mobile-menu-btn"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>
        </header>

        {/* ── Page Content Area ── */}
        <main className="page-content" id="main-content" role="main">
          {children}                                         {/* Injected page sections */}
        </main>
      </div>

      {/* Mobile overlay backdrop — closes sidebar when tapped */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 150,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}