/**
 * DashboardLayout.jsx
 * ─────────────────────────────────────────────────────────
 * Devoryn-style dashboard shell:
 * - Fixed frosted-glass sidebar with nav items + user card
 * - Sticky glass topbar with greeting, theme toggle, notification bell, user pill
 * - Scrollable main content area
 * - Fully theme-aware: reads from ThemeContext for dark/light
 * ─────────────────────────────────────────────────────────
 */
import { useState }      from 'react';
import { useProfile }    from '../../hooks/useProfile';      // Profile data for avatar/name
import { useTheme }      from '../../context/ThemeContext';  // Dark/light mode context
import { getInitials }   from '../../utils/formatters';      // Formats name → "HA"
import '../../styles/layout/DashboardLayout.css';            // Component layout styles

/** Navigation items — id must match each <section id="..."> */
const NAV_ITEMS = [
  { label: 'Dashboard',  href: '#overview',   icon: '⊞', id: 'overview'   },
  { label: 'Analytics',  href: '#analytics',  icon: '↗', id: 'analytics'  },
  { label: 'Skills',     href: '#skills',     icon: '◎', id: 'skills'     },
  { label: 'Projects',   href: '#projects',   icon: '⊡', id: 'projects'   },
  { label: 'Experience', href: '#experience', icon: '⊛', id: 'experience' },
  { label: 'Goals',      href: '#goals',      icon: '◈', id: 'goals'      },
  { label: 'Contact',    href: '#contact',    icon: '✉', id: 'contact'    },
];

/**
 * @param {object}          props
 * @param {React.ReactNode} props.children       - Page sections
 * @param {string}          props.activeSection  - Currently visible section ID
 * @param {object|null}     props.profile        - Profile data from API
 */
export default function DashboardLayout({ children, activeSection = '', profile }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // Mobile sidebar open state

  /* ── Theme context ────────────────────────────────────────────── */
  const { isDark, toggleTheme } = useTheme();             // Read theme state + toggle fn

  /* ── Safe display values with fallbacks ──────────────────────── */
  const fullName  = profile?.full_name      || 'Hussam Alshawi';
  const firstName = fullName.split(' ')[0];               // Extract first name for greeting
  const initials  = getInitials(fullName);                // "HA" format for avatars
  const title     = profile?.title          || 'Full Stack Developer';
  const avatar    = profile?.primary_avatar || null;      // Cloudinary URL or null
  const available = profile?.is_available_for_hire || false; // Hire status

  /** Close sidebar when nav link is clicked on mobile */
  const closeOnMobile = () => setSidebarOpen(false);

  return (
    <div className="dashboard-root">

      {/* ══════════════════════════════════════════════
          SIDEBAR — Fixed frosted glass panel
      ══════════════════════════════════════════════ */}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
        aria-label="Sidebar navigation"
      >
        {/* Decorative water-droplet texture (visual only) */}
        <div className="sidebar__texture" aria-hidden="true" />

        {/* ── Logo ── */}
        <a
          href="#overview"
          className="sidebar__logo"
          onClick={closeOnMobile}
          aria-label="Go to dashboard overview"
        >
          <div className="sidebar__logo-mark" aria-hidden="true">HA</div>
          <span className="sidebar__logo-text">
            HA<em>.</em>Dev
          </span>
        </a>

        {/* ── Section label above nav ── */}
        <span className="sidebar__nav-label" aria-hidden="true">Menu</span>

        {/* ── Navigation links ── */}
        <nav
          className="sidebar__nav"
          role="navigation"
          aria-label="Portfolio sections"
        >
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;   // Is this the visible section?
            return (
              <a
                key={item.id}
                href={item.href}
                className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                onClick={closeOnMobile}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item__icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-item__label">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* ── User card at bottom of sidebar ── */}
        <div className="sidebar__user">
          <div
            className="sidebar__user-card"
            role="complementary"
            aria-label="Signed-in user"
          >
            {/* Avatar — shows image or initials fallback */}
            <div className="sidebar__avatar">
              {avatar
                ? <img src={avatar} alt={`${fullName} avatar`} />
                : <span>{initials}</span>
              }
            </div>

            {/* Name and role text */}
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{fullName}</div>
              <div className="sidebar__user-role">
                {available ? 'Open to Hire ✦' : title}
              </div>
            </div>

            {/* Pulsing green dot — online indicator */}
            <div
              className="sidebar__online-dot"
              title="Active"
              aria-label="Status: active"
            />
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT — Topbar + scrollable sections
      ══════════════════════════════════════════════ */}
      <div className="dashboard-main">

        {/* ── Sticky Topbar ── */}
        <header className="topbar" role="banner">

          {/* Left side: personal greeting */}
          <div className="topbar__greeting" aria-live="polite">
            <div className="topbar__greeting-hi">
              Hi, {firstName}! 👋
            </div>
            <div className="topbar__greeting-sub">
              Welcome to your Portfolio
            </div>
          </div>

          {/* Right side: action buttons */}
          <div className="topbar__actions">

            {/* ── Theme Toggle — dark/light switch ── */}
            <div
              className="topbar__theme-toggle"
              role="group"
              aria-label="Theme switcher"
            >
              {/* Dark mode button */}
              <button
                className={`theme-btn ${isDark ? 'theme-btn--active' : ''}`}
                onClick={() => !isDark && toggleTheme()}   // Only toggle if not already dark
                aria-pressed={isDark}
                title="Dark mode"
              >
                🌙
              </button>

              {/* Light mode button */}
              <button
                className={`theme-btn ${!isDark ? 'theme-btn--active' : ''}`}
                onClick={() => isDark && toggleTheme()}    // Only toggle if not already light
                aria-pressed={!isDark}
                title="Light mode"
              >
                ☀️
              </button>
            </div>

            {/* Notification bell with cyan dot */}
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

            {/* User pill — shows avatar + full name */}
            <div
              className="topbar__user"
              role="button"
              tabIndex={0}
              aria-label="User menu"
              aria-haspopup="true"
            >
              <div className="topbar__user-avatar">
                {avatar
                  ? <img src={avatar} alt="Profile" />
                  : <span>{initials}</span>
                }
              </div>
              <span className="topbar__user-name">{fullName}</span>
              <span className="topbar__user-chevron" aria-hidden="true">▾</span>
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

        {/* ── Page sections (children from Home.jsx) ── */}
        <main
          className="page-content"
          id="main-content"
          role="main"
          aria-label="Portfolio content"
        >
          {children}
        </main>
      </div>

      {/* Mobile overlay — tapping it closes the sidebar */}
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