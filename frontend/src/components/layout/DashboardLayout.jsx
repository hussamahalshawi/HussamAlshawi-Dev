/**
 * DashboardLayout.jsx
 * ─────────────────────────────────────────────────────────
 * Devoryn-style dashboard shell:
 * - Fixed frosted-glass sidebar with nav items + user card
 * - Sticky glass topbar with greeting, notification bell, user pill
 * - Scrollable main content area
 * ─────────────────────────────────────────────────────────
 */
import { useState }      from 'react';
import { useProfile }    from '../../hooks/useProfile';
import { getInitials }   from '../../utils/formatters';
import '../../styles/layout/DashboardLayout.css';

/** Navigation items — id must match each <section id="..."> */
const NAV_ITEMS = [
  { label: 'Dashboard',   href: '#overview',    icon: '⊞', id: 'overview'   },
  { label: 'Analytics',   href: '#analytics',   icon: '↗', id: 'analytics'  },
  { label: 'Skills',      href: '#skills',       icon: '◎', id: 'skills'     },
  { label: 'Projects',    href: '#projects',     icon: '⊡', id: 'projects'   },
  { label: 'Experience',  href: '#experience',   icon: '⊛', id: 'experience' },
  { label: 'Goals',       href: '#goals',        icon: '◈', id: 'goals'      },
  { label: 'Contact',     href: '#contact',      icon: '✉', id: 'contact'    },
];

/**
 * @param {object}          props
 * @param {React.ReactNode} props.children       - Page sections
 * @param {string}          props.activeSection  - Currently visible section ID
 * @param {object|null}     props.profile        - Profile data from API
 */
export default function DashboardLayout({ children, activeSection = '', profile }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state

  /* Safe display values with fallbacks */
  const fullName  = profile?.full_name  || 'Hussam Alshawi';
  const firstName = fullName.split(' ')[0];
  const initials  = getInitials(fullName);
  const title     = profile?.title      || 'Full Stack Developer';
  const avatar    = profile?.primary_avatar || null;
  const available = profile?.is_available_for_hire || false;

  /** Close sidebar on link click (mobile) */
  const closeOnMobile = () => setSidebarOpen(false);

  return (
    <div className="dashboard-root">

      {/* ══════════════════════════════════════════════
          SIDEBAR — Fixed frosted glass navigation panel
      ══════════════════════════════════════════════ */}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
        aria-label="Sidebar navigation"
      >
        {/* Water-droplet texture overlay (purely visual) */}
        <div className="sidebar__texture" aria-hidden="true" />

        {/* ── Logo ── */}
        <a
          href="#overview"
          className="sidebar__logo"
          onClick={closeOnMobile}
          aria-label="Go to dashboard overview"
        >
          {/* Brand square with gradient */}
          <div className="sidebar__logo-mark" aria-hidden="true">HA</div>
          <span className="sidebar__logo-text">
            HA<em>.</em>Dev
          </span>
        </a>

        {/* ── Nav label ── */}
        <span className="sidebar__nav-label" aria-hidden="true">
          Menu
        </span>

        {/* ── Navigation links ── */}
        <nav
          className="sidebar__nav"
          role="navigation"
          aria-label="Portfolio sections"
        >
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                onClick={closeOnMobile}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon */}
                <span className="nav-item__icon" aria-hidden="true">
                  {item.icon}
                </span>
                {/* Label */}
                <span className="nav-item__label">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* ── User card (bottom of sidebar) ── */}
        <div className="sidebar__user">
          <div
            className="sidebar__user-card"
            role="complementary"
            aria-label="Signed-in user"
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
                {available ? 'Open to Hire ✦' : title}
              </div>
            </div>

            {/* Live green dot */}
            <div
              className="sidebar__online-dot"
              title="Active"
              aria-label="Status: active"
            />
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN — Topbar + scrollable page content
      ══════════════════════════════════════════════ */}
      <div className="dashboard-main">

        {/* ── Sticky Topbar ── */}
        <header className="topbar" role="banner">

          {/* Left: personal greeting */}
          <div className="topbar__greeting" aria-live="polite">
            <div className="topbar__greeting-hi">
              Hi, {firstName}! 👋
            </div>
            <div className="topbar__greeting-sub">
              Welcome to your Portfolio
            </div>
          </div>

          {/* Right: actions */}
          <div className="topbar__actions">

            {/* Notification bell with live dot */}
            <button
              className="topbar__icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              🔔
              {/* Cyan dot indicating new items */}
              <span
                className="topbar__notif-dot"
                aria-hidden="true"
              />
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
            <div
              className="topbar__user"
              role="button"
              tabIndex={0}
              aria-label="User menu"
              aria-haspopup="true"
            >
              {/* Mini avatar */}
              <div className="topbar__user-avatar">
                {avatar
                  ? <img src={avatar} alt="Profile" />
                  : <span>{initials}</span>
                }
              </div>
              {/* Name */}
              <span className="topbar__user-name">{fullName}</span>
              {/* Chevron */}
              <span
                className="topbar__user-chevron"
                aria-hidden="true"
              >
                ▾
              </span>
            </div>

            {/* Mobile hamburger — CSS shows only on small screens */}
            <button
              className="topbar__icon-btn topbar__hamburger"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>
        </header>

        {/* ── Page sections ── */}
        <main
          className="page-content"
          id="main-content"
          role="main"
          aria-label="Portfolio content"
        >
          {children}
        </main>
      </div>

      {/* Mobile backdrop — closes sidebar on tap */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeOnMobile}
          aria-hidden="true"
        />
      )}
    </div>
  );
}