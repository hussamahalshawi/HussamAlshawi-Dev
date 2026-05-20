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
import { useState , useEffect }      from 'react';
import { useProfile }    from '../../hooks/useProfile';      // Profile data for avatar/name
import { useTheme }      from '../../context/ThemeContext';  // Dark/light mode context
import { getInitials }   from '../../utils/formatters';      // Formats name → "HA"
import '../../styles/layout/DashboardLayout.css';            // Component layout styles
import ParticleBackground from '../ui/ParticleBackground';
import {
  LayoutDashboard,  // Overview
  BriefcaseBusiness, // Experience
  Rocket,           // Projects
  Zap,              // Skills
  GraduationCap,    // Education
  BookOpen,         // Courses
  FlaskConical,     // Self Study
  BarChart3,        // Analytics
  Target,           // Goals
  MessageSquareQuote, // Feedback
  UserRound,        // About
  Send,             // Contact
} from 'lucide-react';


/** Navigation items — ordered by portfolio story flow */
const NAV_ITEMS = [
  { label: 'Overview',   href: '#overview',   id: 'overview',   Icon: LayoutDashboard      },
  { label: 'Experience', href: '#experience', id: 'experience', Icon: BriefcaseBusiness    },
  { label: 'Projects',   href: '#projects',   id: 'projects',   Icon: Rocket               },
  { label: 'Skills',     href: '#skills',     id: 'skills',     Icon: Zap                  },
  { label: 'Education',  href: '#education',  id: 'education',  Icon: GraduationCap        },
  { label: 'Courses',    href: '#courses',    id: 'courses',    Icon: BookOpen             },
  { label: 'Self Study', href: '#selfstudy',  id: 'selfstudy',  Icon: FlaskConical         },
  { label: 'Analytics',  href: '#analytics',  id: 'analytics',  Icon: BarChart3            },
  { label: 'Goals',      href: '#goals',      id: 'goals',      Icon: Target               },
  { label: 'Feedback',   href: '#feedback',   id: 'feedback',   Icon: MessageSquareQuote   },
  { label: 'About',      href: '#about',      id: 'about',      Icon: UserRound            },
  { label: 'Contact',    href: '#contact',    id: 'contact',    Icon: Send                 },
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
  /* ── Dynamic favicon — runs after render, updates tab icon from API avatar ── */
/* ── Dynamic favicon — directly set Cloudinary URL with size param ── */
useEffect(() => {
  if (!avatar) return;                                      // Skip if no avatar from API

  const favicon = document.getElementById('dynamic-favicon'); // Find favicon link tag
  if (!favicon) return;                                     // Skip if not found in DOM

  /* Append Cloudinary transform params to force 64px square output */
  /* This avoids CORS canvas issues entirely — browser loads directly */
  const sized = avatar.includes('cloudinary.com')
    ? avatar.replace('/upload/', '/upload/w_192,h_192,c_fill,r_max,b_rgb:4a90d9/')  // Cloudinary transform URL
    : avatar;                                               // Non-Cloudinary: use as-is

  favicon.href = sized;                                     // Set resized avatar as favicon
  favicon.type = 'image/jpeg';                              // Update MIME type
}, [avatar]);                                               // Re-run when avatar changes


  const available = profile?.is_available_for_hire || false; // Hire status
  /** Close sidebar when nav link is clicked on mobile */
  const closeOnMobile = () => setSidebarOpen(false);

  return (
    <div className="dashboard-root">
        {/* Global particle network — sits behind everything */}
        <ParticleBackground opacity={0.7} />
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
              onClick={(e) => {
                  e.preventDefault();                              // Prevent default anchor behavior
                  closeOnMobile();                                 // Close mobile sidebar
                  window.location.href = window.location.origin;  // Navigate to root URL — works locally and on cloud
                }}
              aria-label="Go to dashboard overview"
            >

              {/* CHANGE THIS ↓ — show avatar image if available, fallback to "HA" text */}
              <div className="sidebar__logo-mark" aria-hidden="true">
                {avatar
                  ? <img src={avatar} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  : 'HA'
                }
              </div>
              <span className="sidebar__logo-text">
                HA<em>.</em>Dev
              </span>
            </a>

{/*          */}{/* ── Section label above nav ── */}
{/*         <span className="sidebar__nav-label" aria-hidden="true">Menu</span> */}

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
                <span className="nav-item__icon" aria-hidden="true">
                      <item.Icon
                        size={18}
                        strokeWidth={1.5}
                      />
                    </span>
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

         {/* Left side: personal greeting — name and title pulled from profile API */}
            <div className="topbar__greeting" aria-live="polite">

              {/* Hi + first name from profile.full_name, split to get first word */}
              <div className="topbar__greeting-hi">
                {fullName}  👋
              </div>

              {/* Job title from profile.title — falls back to static string if API fails */}
              <div className="topbar__greeting-sub">
                {title || 'Welcome to your Portfolio'}
              </div>

            </div>

          {/* Right side: action buttons */}
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

{/*              */}{/* Notification bell with cyan dot */}
{/*             <button */}
{/*               className="topbar__icon-btn" */}
{/*               aria-label="Notifications" */}
{/*               title="Notifications" */}
{/*             > */}
{/*               🔔 */}
{/*               <span className="topbar__notif-dot" aria-hidden="true" /> */}
{/*             </button> */}

{/*              */}{/* Settings button */}
{/*             <button */}
{/*               className="topbar__icon-btn" */}
{/*               aria-label="Settings" */}
{/*               title="Settings" */}
{/*             > */}
{/*               ⚙ */}
{/*             </button> */}

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