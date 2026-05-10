/**
 * DashboardLayout.jsx
 * ─────────────────────────────────────────────────────────
 * Root layout wrapper for the dashboard interface.
 * Renders: fixed glassmorphism sidebar, sticky topbar,
 * scrollable content area.
 * Inspired by Devoryn-style glassmorphism panel layout.
 * ─────────────────────────────────────────────────────────
 */
import { useState }       from 'react';                      // State for mobile sidebar toggle
import { useProfile }     from '../../hooks/useProfile';     // Profile data for user info
import { getInitials }    from '../../utils/formatters';     // Initials from full name
import '../../styles/layout/DashboardLayout.css';            // Layout-specific styles

/**
 * Navigation items config with icons and section anchors.
 * id must match the <section id="..."> on each page section.
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
 * @param {React.ReactNode} props.children      - Page content in main area
 * @param {string}          props.activeSection - Currently visible section ID
 * @param {object|null}     props.profile       - Profile data from API
 */
export default function DashboardLayout({ children, activeSection = '', profile }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);    // Mobile sidebar toggle

  // Safe display data with fallbacks
  const fullName  = profile?.full_name || 'Hussam Alshawi';
  const initials  = getInitials(fullName);                   // "HA" format
  const title     = profile?.title || 'Full Stack Developer';
  const avatar    = profile?.primary_avatar || null;
  const available = profile?.is_available_for_hire || false;

  return (
    <div className="dashboard-root">

      {/* ══════════════════════════════════════
          SIDEBAR — Fixed left navigation panel
      ══════════════════════════════════════ */}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
        aria-label="Main sidebar"
      >
        {/* ── Logo ── */}
        <a
          href="#overview"
          className="sidebar__logo"
          onClick={() => setSidebarOpen(false)}
          aria-label="Go to overview"
        >
          <div className="sidebar__logo-mark" aria-hidden="true">HA</div>
          <span className="sidebar__logo-text">
            HA<em>.</em>Dev
          </span>
        </a>

        {/* ── Nav section label ── */}
        <span className="sidebar__nav-label" aria-hidden="true">Navigation</span>

        {/* ── Nav items ── */}
        <nav className="sidebar__nav" role="navigation" aria-label="Portfolio sections">
          {NAV_ITEMS.map(item => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-item ${activeSection === item.id ? 'nav-item--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              <span className="nav-item__icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-item__label">{item.label}</span>
            </a>
          ))}
        </nav>

        {/* ── Bottom user card ── */}
        <div className="sidebar__user">
          <div
            className="sidebar__user-card"
            role="complementary"
            aria-label="User profile"
          >
            {/* Avatar */}
            <div className="sidebar__avatar">
              {avatar
                ? <img src={avatar} alt={`${fullName} avatar`} />
                : <span>{initials}</span>
              }
            </div>

            {/* Name + role */}
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{fullName}</div>
              <div className="sidebar__user-role">
                {available ? 'Open to Hire' : title}
              </div>
            </div>

            {/* Online dot */}
            <div
              className="sidebar__online-dot"
              aria-label="Online status: active"
            />
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN — Topbar + Page content
      ══════════════════════════════════════ */}
      <div className="dashboard-main">

        {/* ── Top Bar ── */}
        <header className="topbar" role="banner">

          {/* Left: greeting */}
          <div className="topbar__greeting">
            <div className="topbar__greeting-hi">
              Hi, {fullName.split(' ')[0]}! 👋
            </div>
            <div className="topbar__greeting-sub">
              Welcome to your Portfolio
            </div>
          </div>

          {/* Right: actions */}
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

            {/* Settings */}
            <button
              className="topbar__icon-btn"
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </button>

            {/* User pill */}
            <div className="topbar__user" role="button" tabIndex={0} aria-label="User menu">
              <div className="topbar__user-avatar">
                {avatar
                  ? <img src={avatar} alt="Profile" />
                  : <span>{initials}</span>
                }
              </div>
              <span className="topbar__user-name">{fullName}</span>
              <span className="topbar__user-chevron" aria-hidden="true">▾</span>
            </div>

            {/* Mobile hamburger — visible via CSS on mobile only */}
            <button
              className="topbar__icon-btn topbar__hamburger"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="page-content" id="main-content" role="main">
          {children}
        </main>
      </div>

      {/* Mobile overlay — closes sidebar when tapped */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}