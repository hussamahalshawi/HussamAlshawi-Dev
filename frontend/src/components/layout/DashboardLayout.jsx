/**
 * DashboardLayout.jsx
 * ─────────────────────────────────────────────────────────
 * Redesigned dashboard shell matching reference UI:
 * - Soft glass sidebar with pill nav items + ambient blobs
 * - Clean topbar: page title + search bar + toggle + bell + user
 * - iOS-style dark/light toggle switch
 * - Responsive hamburger for mobile
 * ─────────────────────────────────────────────────────────
 */
import { useState, useEffect }   from 'react';
import { useTheme }              from '../../context/ThemeContext';  // Dark/light mode context
import { getInitials }           from '../../utils/formatters';      // Name → "HA"
import { NAV_ITEMS, BOTTOM_NAV_ITEMS, PAGE_TITLES } from '../../utils/constants'; // Centralized nav data
import '../../styles/layout/DashboardLayout.css';                    // Layout styles
import ParticleBackground        from '../ui/ParticleBackground';    // Canvas particle bg

import {
  LayoutDashboard,
  BriefcaseBusiness,
  Rocket,
  Zap,
  GraduationCap,
  FlaskConical,
  BarChart3,
  Target,
  MessageSquareQuote,
  UserRound,
  Send,
} from 'lucide-react';                                               // Icon library

/* ── Map nav item IDs to Lucide icons ────────────────────────── */
const ICON_MAP = {
  overview:   LayoutDashboard,
  experience: BriefcaseBusiness,
  projects:   Rocket,
  skills:     Zap,
  education:  GraduationCap,
  selfstudy:  FlaskConical,
  analytics:  BarChart3,
  goals:      Target,
  feedback:   MessageSquareQuote,
  about:      UserRound,
  contact:    Send,
};

/**
 * DashboardLayout — main shell wrapping all portfolio sections.
 * @param {object}          props
 * @param {React.ReactNode} props.children       - Page sections
 * @param {string}          props.activeSection  - Currently active section ID
 * @param {Function}        props.onSectionChange- Callback when nav item clicked
 * @param {object|null}     props.profile        - Profile API data
 */
export default function DashboardLayout({ children, activeSection = '', onSectionChange, profile }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);  // Mobile sidebar state

  /* ── Theme ─────────────────────────────────────────────── */
  const { isDark, toggleTheme } = useTheme();                  // Theme state + toggle fn

  /* ── Profile data with fallbacks ────────────────────────── */
  const fullName  = profile?.full_name      || 'Hussam Alshawi';
  const initials  = getInitials(fullName);                     // "HA"
  const title     = profile?.title          || 'Full Stack Developer';
  const avatar    = profile?.primary_avatar || null;
  const available = profile?.is_available_for_hire || false;  // Hire status badge

  /* ── Dynamic favicon from API avatar ───────────────────── */
  useEffect(() => {
    if (!avatar) return;                                        // Skip if no avatar
    const favicon = document.getElementById('dynamic-favicon'); // Get favicon element
    if (!favicon) return;                                       // Skip if not found
    const sized = avatar.includes('cloudinary.com')
      ? avatar.replace('/upload/', '/upload/w_192,h_192,c_fill,r_max/')
      : avatar;
    favicon.href = sized;                                       // Apply resized avatar
    favicon.type = 'image/jpeg';
  }, [avatar]);

  /* ── Page title from active section ────────────────────── */
  const pageTitle = PAGE_TITLES[activeSection] || 'Dashboard';

  /* ── Close sidebar on mobile nav click ─────────────────── */
  const closeOnMobile = () => setSidebarOpen(false);

  return (
    <div className="dashboard-root">

      {/* Global particle canvas — sits behind all layers */}
      <ParticleBackground opacity={0.65} />

      {/* ══════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════ */}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
        aria-label="Sidebar navigation"
        id="sidebar"
      >
        {/* Ambient blob decorations */}
        <div className="sidebar__texture" aria-hidden="true" />

        {/* ── Logo / brand ── */}
        <a
          href="#overview"
          className="sidebar__logo"
          onClick={() => {
            closeOnMobile();                                    // Close on mobile
            onSectionChange('overview');                        // Navigate to overview
          }}
          aria-label="Go to dashboard overview"
        >
          {/* Avatar circle */}
          <div className="sidebar__logo-mark" aria-hidden="true">
            {avatar
              ? <img src={avatar} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
          </div>

          {/* Brand name */}
          <span className="sidebar__logo-text">
            HA<em>.Dev</em>
          </span>
        </a>

        {/* ── Main navigation ── */}
        <nav
          className="sidebar__nav"
          role="navigation"
          aria-label="Portfolio sections"
        >
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;        // Check if this item is active
            const IconComponent = ICON_MAP[item.id];           // Look up Lucide icon
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  onSectionChange(item.id);                    // Update active section
                  closeOnMobile();                             // Close sidebar on mobile
                }}
              >
                {/* Lucide icon */}
                <span className="nav-item__icon" aria-hidden="true">
                  {IconComponent && <IconComponent size={17} strokeWidth={1.6} />}
                </span>
                {/* Label text */}
                <span className="nav-item__label">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* ── Bottom pinned: About + Contact + User card ── */}
        <div className="sidebar__bottom">
          {/* Divider line */}
          <div className="sidebar__bottom-divider" aria-hidden="true" />

          {/* Bottom nav links */}
          <nav className="sidebar__bottom-nav" role="navigation" aria-label="About and contact">
            {BOTTOM_NAV_ITEMS.map(item => {
              const isActive = activeSection === item.id;
              const IconComponent = ICON_MAP[item.id];
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onSectionChange(item.id);
                    closeOnMobile();
                  }}
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    {IconComponent && <IconComponent size={17} strokeWidth={1.6} />}
                  </span>
                  <span className="nav-item__label">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Divider before user card */}
          <div className="sidebar__bottom-divider" aria-hidden="true" />

          {/* User card */}
          <div className="sidebar__user">
            <div className="sidebar__user-card" role="complementary" aria-label="User info">
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

              {/* Online indicator dot */}
              <div
                className="sidebar__online-dot"
                title="Active"
                aria-label="Status: active"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div className="dashboard-main">

        {/* ── Topbar ── */}
        <header className="topbar" role="banner">

          {/* Left: full name + job title */}
          <div className="topbar__greeting" aria-live="polite">
            {/* Full name from profile API */}
            <div className="topbar__greeting-hi">
              {fullName} 👋
            </div>
            {/* Job title from profile API */}
            <div className="topbar__greeting-sub">
              {title || 'Welcome to your Portfolio'}
            </div>
          </div>

          {/* Right: actions + hamburger */}
          <div className="topbar__actions">
            {/* Availability status pill */}
            <div
              className={`availability-pill ${available ? 'availability-pill--open' : ''}`}
              role="status"
              aria-label={available ? 'Available for hire' : 'Currently employed'}
            >
              <span className="availability-pill__dot" aria-hidden="true" />
              {available ? 'Available for Hire' : 'Currently Employed'}
            </div>

            {/* ── Dark / Light theme toggle buttons ── */}
            <div
              className="topbar__theme-toggle"
              role="group"
              aria-label="Theme switcher"
            >
              <button
                className={`theme-btn ${isDark ? 'theme-btn--active' : ''}`}
                onClick={() => !isDark && toggleTheme()}
                aria-pressed={isDark}
                title="Dark mode"
              >
                🌙
              </button>
              <button
                className={`theme-btn ${!isDark ? 'theme-btn--active' : ''}`}
                onClick={() => isDark && toggleTheme()}
                aria-pressed={!isDark}
                title="Light mode"
              >
                ☀️
              </button>
            </div>

            {/* ── User pill: avatar + full name + chevron ── */}
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
          </div>

          {/* ── Mobile hamburger — outside actions for independent positioning ── */}
          <button
            className="topbar__icon-btn topbar__hamburger"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
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

      {/* Mobile overlay — click to close sidebar */}
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
