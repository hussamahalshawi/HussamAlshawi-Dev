# HA.Dev Portfolio Dashboard — Full Project Reference

---

## 1. Project Identity

- **Name**: HA.Dev Portfolio Dashboard
- **Brand**: `HA<em>.Dev</em>` (logo in sidebar — `em` styled cyan)
- **Type**: Single-page portfolio dashboard with 11 sections, show/hide via sidebar nav (no routing between sections)
- **Stack**: Vite + React 18 + React Router 6 + CSS (no Tailwind, no component library)
- **Backend**: Flask API at `http://localhost:5000/api` (configurable via `VITE_API_URL` env var in `.env`)
- **User**: Hussam Alshawi — Full Stack Developer

---

## 2. Architecture

```
main.jsx
  └─ ThemeProvider (dark/light via data-theme on <html>)
      └─ BrowserRouter
          └─ App.jsx (Routes: / → Home, * → NotFound)
              └─ Home.jsx (data loading + section show/hide)
                  └─ DashboardLayout (sidebar + topbar + page-content)
                      ├─ OverviewSection    ✅ Built
                      ├─ Experience         ❌ Placeholder
                      ├─ Projects           ❌ Placeholder
                      ├─ SkillsSection      ✅ Built
                      ├─ Education          ❌ Placeholder
                      ├─ Self Study         ❌ Placeholder
                      ├─ AnalyticsSection   ✅ Built
                      ├─ Goals              ❌ Placeholder
                      ├─ Feedback           ❌ Placeholder
                      ├─ About              ❌ Placeholder
                      └─ Contact            ❌ Placeholder
```

### Component Ownership
- `DashboardLayout` owns the persistent shell (sidebar + topbar + page-content)
- `Home` owns section visibility (`display: block/none` based on `activeSection` state)
- Sections are **always mounted** but **only visible when active** — no remount, no data refetch
- Data loaded once via `usePortfolioData`, polled every 20s in background

---

## 3. Layout Structure

```
┌──────────────────────────────────────────────┐
│  Sidebar (fixed, 260px)  │  Topbar (sticky)  │
│                          │  height: 64px     │
│  ┌──────────────────┐    ├───────────────────┤
│  │ Logo: HA.Dev     │    │  Page Content     │
│  │                  │    │  (scrollable)     │
│  │ NAV_ITEMS:       │    │  height:          │
│  │  • Overview      │    │  calc(100vh-64px) │
│  │  • Experience    │    │                   │
│  │  • Projects      │    │                   │
│  │  • Skills        │    │                   │
│  │  • Education     │    │                   │
│  │  • Self Study    │    │                   │
│  │  • Analytics     │    │                   │
│  │  • Goals         │    │                   │
│  │  • Feedback      │    │                   │
│  ├──────────────────┤    │                   │
│  │  • About         │    │                   │
│  │  • Contact       │    │                   │
│  ├──────────────────┤    │                   │
│  │  User Card       │    │                   │
└──────────────────────────────────────────────┘
```

Key measurements:
- `.sidebar`: fixed left, 260px wide, `z-index: 200`
- `.dashboard-main`: `margin-left: 260px`, flex column
- `.topbar`: sticky top, height 64px, `z-index: 100`
- `.page-content`: scrollable, `padding: var(--s6) var(--s5)`, `height: calc(100vh - 64px)`
- Mobile: sidebar hidden via `translateX(-100%)`, hamburger toggles with overlay

---

## 4. CSS Design System (`index.css`)

### Typography
- `--font-display`: `'Syne', sans-serif` — headings, display, nav
- `--font-body`: `'DM Sans', sans-serif` — body, buttons, form elements
- `--font-mono`: `'JetBrains Mono', monospace` — code, labels, tags, stats

### Spacing Scale
| Variable | Value | Pixels |
|----------|-------|--------|
| `--s1`   | 0.25rem | 4px   |
| `--s2`   | 0.5rem  | 8px   |
| `--s3`   | 0.75rem | 12px  |
| `--s4`   | 1rem    | 16px  |
| `--s5`   | 1.25rem | 20px  |
| `--s6`   | 1.5rem  | 24px  |
| `--s8`   | 2rem    | 32px  |
| `--s10`  | 2.5rem  | 40px  |
| `--s12`  | 3rem    | 48px  |
| `--s16`  | 4rem    | 64px  |
| `--s20`  | 5rem    | 80px  |

⚠️ **No `--s7`** — do not use it. Use `--s6` (24px) or `--s8` (32px) instead.

### Border Radius
| Variable | Value  | Usage          |
|----------|--------|----------------|
| `--r-xs` | 3px    | badges, tags   |
| `--r-sm` | 8px    | buttons, inputs |
| `--r-md` | 12px   | cards           |
| `--r-lg` | 16px   | panels          |
| `--r-xl` | 20px   | sections        |
| `--r-2xl`| 24px   |                 |
| `--r-full`| 9999px | pill shape     |

### Transitions
- `--t-fast`: 120ms cubic-bezier(0.4,0,0.2,1) — micro-interactions
- `--t-base`: 220ms cubic-bezier(0.4,0,0.2,1) — standard
- `--t-slow`: 380ms cubic-bezier(0.4,0,0.2,1) — slow
- `--t-spring`: 480ms cubic-bezier(0.34,1.56,0.64,1) — bounce

### Brand Accents
| Variable  | Dark      | Light     |
|-----------|-----------|-----------|
| `--cyan`  | `#4FC3F7` | `#1a8fc7` |
| `--blue`  | `#5B8DEF` | `#3a6fd8` |
| `--violet`| `#9B7FEA` | `#7c5bd4` |
| `--green` | `#4ECCA3` | `#1a9e6e` |
| `--orange`| `#F5A623` | `#d07a10` |
| `--red`   | `#F06292` | `#d0406a` |
| `--gold`  | `#FFD700` | `#c49b00` |

### Glass Tokens (Dark Mode)
```css
--glass-faint:   rgba(255,255,255,0.03)
--glass-light:   rgba(255,255,255,0.06)
--glass-medium:  rgba(255,255,255,0.09)
--glass-strong:  rgba(255,255,255,0.13)
--glass-ultra:   rgba(255,255,255,0.18)
--glass-cyan:    rgba(79,195,247,0.08)
```

### Text Hierarchy (Dark Mode)
- `--text-white`: `#FFFFFF` — pure white headings
- `--text-primary`: `#E8EEF8` — main body
- `--text-secondary`: `#8BA3C4` — secondary labels
- `--text-muted`: `#4A6080` — captions, placeholders
- `--text-accent`: `#4FC3F7` — cyan accent text

---

## 5. Current Dark Glass Formula (Cards & Panels)

```css
background:              rgba(13, 17, 38, 0.82);    /* 82% opaque — matches sidebar */
backdrop-filter:         blur(20px);
-webkit-backdrop-filter: blur(20px);
border:                  1px solid rgba(79,195,247,0.12);
box-shadow:              0 4px 24px rgba(0,0,0,0.35),
                         inset 0 1px 0 rgba(79,195,247,0.06);
```

- **Hover**: `background: rgba(79,195,247,0.06) !important`, `border-color: rgba(79,195,247,0.22)`, lift `-2px`
- **All elements use same formula**: panels, bento cards, stat cards, language cards, record items, support items
- **Light mode**: `rgba(255,255,255,0.55)` with `blur(32px) saturate(1.8)` and blue borders `rgba(79,143,199,0.20)` — matches sidebar/topbar
- **How to apply**: Use class `.ov-panel` or `.ov-bento-card`

### Standard → Glass-opacity mapping
| Context | Dark opacity | Light opacity |
|---------|-------------|---------------|
| Panels/cards (ov-panel, ov-bento-card) | 82% | 55% white |
| Support items, record items | 82% | 55% white |
| Stats (ov-stat), lang cards | 82% | 55% white |
| Sidebar | 82% | 55% white |
| Topbar | 75% | 55% white |

---

## 6. Navigation — Sidebar Menu

### Main Nav Items
| # | ID | Label | Icon |
|---|----|-------|------|
| 1 | `overview` | Overview | `LayoutDashboard` |
| 2 | `experience` | Experience & Achievements | `BriefcaseBusiness` |
| 3 | `projects` | Projects | `Rocket` |
| 4 | `skills` | Skills | `Zap` |
| 5 | `education` | Education & Courses | `GraduationCap` |
| 6 | `selfstudy` | Self Study | `FlaskConical` |
| 7 | `analytics` | Analytics | `BarChart3` |
| 8 | `goals` | Goals | `Target` |
| 9 | `feedback` | Feedback | `MessageSquareQuote` |

### Bottom Nav Items
| # | ID | Label | Icon |
|---|----|-------|------|
| B1 | `about` | About | `UserRound` |
| B2 | `contact` | Contact | `Send` |

### Active styling
- Background: `rgba(79,195,247,0.18)` (dark) / `rgba(79,140,247,0.12)` (light)
- Left accent bar: 3px wide cyan line with `box-shadow: 0 0 12px rgba(79,195,247,0.60)`
- Border: `rgba(79,195,247,0.45)` (dark) / `rgba(79,140,247,0.28)` (light)
- Text: white (dark) / `#1a6fc7` (light)

---

## 7. Data Layer

### API Endpoints (Flask backend)
| Endpoint | Service | Phase | Description |
|----------|---------|-------|-------------|
| `/api/portfolio/profile` | `profileService` | 1 | Public profile (name, bio, avatar, title, social links, stats) |
| `/api/portfolio/analytics` | `analyticsService` | 1 | Charts data (skill distribution, scores, stats) |
| `/api/portfolio/skills` | `skillsService` | 2 | Skills list with categories and scores |
| `/api/portfolio/skills/summary` | `skillsService` | 2 | Skills summary/overview |
| `/api/portfolio/projects` | `projectsService` | 2 | Projects list |

### Cache Strategy (`usePortfolioData`)
1. Show cached data from `localStorage` instantly (on mount)
2. Fetch Phase 1 (Profile + Analytics) — await, hide loader when done
3. Fetch Phase 2 (Skills + Projects + Summary) — background, no loader
4. Poll every **20s** — silently check all APIs for hash changes, auto-update UI

### Offline handling
- If Phase 1 fails entirely: orange `OfflineBanner` "Backend is offline"
- Cache data still shows if available

---

## 8. File Map

### Root
```
AGENTS.md
package.json
vite.config.*
```

### Components (`src/components/`)
| File | Lines | Role |
|------|-------|------|
| `layout/DashboardLayout.jsx` | 355 | App shell — sidebar + topbar + responsive hamburger |
| `sections/OverviewSection.jsx` | ~922 | Complex overview dashboard (profile + 3-col grid + records + languages) |
| `sections/SkillsSection.jsx` | Built | Grouped skills |
| `sections/AnalyticsSection.jsx` | Built | Charts/analytics |
| `charts/BarChart.jsx` | — | Bar chart component |
| `charts/DonutChart.jsx` | — | Donut chart component |
| `charts/ProgressBar.jsx` | — | Animated progress bar |
| `charts/RadarChart.jsx` | — | Radar chart |
| `charts/StatCard.jsx` | — | Stat display card |
| `charts/PerformanceChart.jsx` | — | Performance line chart |
| `ui/ParticleBackground.jsx` | — | Canvas particle background |
| `ui/AnimatedSection.jsx` | — | Scroll animation wrapper |
| `ui/PageLoader.jsx` | — | Loading spinner overlay |
| `ui/SkeletonLoader.jsx` | — | Skeleton loading placeholder |
| `ui/Badge.jsx` | — | Badge/tag component |

### Styles (`src/styles/`)
| File | Lines | Role |
|------|-------|------|
| `index.css` | 849 | Design tokens + reset + utility classes + animations |
| `boot.css` | — | Boot loader flash paint |
| `layout/DashboardLayout.css` | 739 | Sidebar, topbar, nav, page-content, responsive |
| `layout/Sections.css` | 144 | Shared section layout (`.section`, `.container`, `.s-head`) |
| `components/OverviewSection.css` | 1278 | Panel base (ov-panel), profile card, main grid, donut, scores, records, languages, stats, light mode |
| `components/OverviewBento.css` | 586 | Bento cards (ov-bento-*), lang chips, support grid, metrics, progress bars, light mode |
| `components/SkillsSection.css` | — | Skills section styles |
| `components/AnalyticsSection.css` | — | Analytics section styles |
| `components/Badge.css` | — | Badge component |
| `components/PageLoader.css` | — | Loader overlay |
| `components/SkeletonLoader.css` | — | Skeleton |
| `charts/*.css` | — | Per-chart styles |
| `pages/Home.css` | — | Home page styles |
| `pages/NotFound.css` | — | 404 |

### Services (`src/services/`)
| File | Role |
|------|------|
| `api.js` | Two Axios instances (phase 1 fast, phase 2 no timeout) |
| `profileService.js` | Profile API calls |
| `analyticsService.js` | Analytics API calls |
| `skillsService.js` | Skills API calls |
| `projectsService.js` | Projects API calls |
| `languagesService.js` | Languages API calls |
| `educationService.js` | Education API calls |
| `experienceService.js` | Experience API calls |
| `chartsService.js` | Chart data |
| `feedbackService.js` | Feedback API |
| `goalsService.js` | Goals API |
| `useIntersectionLoader.js` | IntersectionObserver for animations |

### Hooks (`src/hooks/`)
| File | Role |
|------|------|
| `usePortfolioData.js` | Main data hook — cache-first, polling, phased loading |
| `useProfile.js` | Profile data |
| `useAnalytics.js` | Analytics data |
| `useSkills.js` | Skills data |
| `useProjects.js` | Projects data |
| `useLanguages.js` | Languages data |
| `useEducation.js` | Education data |
| `useExperience.js` | Experience data |
| `useCourses.js` | Courses data |
| `useGoals.js` | Goals data |
| `useFeedback.js` | Feedback data |
| `useCharts.js` | Chart data |

### Utilities (`src/utils/`)
| File | Role |
|------|------|
| `constants.js` | App constants |
| `formatters.js` | String formatting (getInitials, etc.) |
| `chartConfig.js` | Chart configuration |
| `cache.js` | localStorage cache (save, load, hash comparison) |

### Context
| File | Role |
|------|------|
| `context/ThemeContext.jsx` | Dark/light toggle, persists to localStorage |

---

## 9. Overview Section — Detailed Layout

The Overview page has a complex layout composed of two sub-systems:

### Part A: 3-Column Grid (`.ov-main-grid`)
```
┌──────────────────┬──────────────────┬──────────────────┐
│  Col 1: Profile  │  Col 2 Top:      │  Col 3:          │
│  Card (tall)     │  Score Dist      │  Skill Scores    │
│  spans rows      │  (donut + legend)│  Top 12 (tall)   │
│  1-2             ├──────────────────┤  spans rows 1-2  │
│                  │  Col 2 Bottom:   │                  │
│  → avatar        │  Skills by Cat   │                  │
│  → name/title    │  (progress bars) │  → skill rows    │
│  → bio           │                  │  → score bars    │
│  → social links  │  → category bars │  → band legend   │
│  → stats (4x)    │                  │                  │
│  → CTA buttons   │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

### Part B: Bento Grid (`.ov-bento-*`)
Below the main grid:
- **Row 1**: Profile Card (spans rows 1-2) + Learning & Growth + Mini Stats
- **Row 2**: Skills (multi-column) + Learning & Growth continues + GitHub Stats
- **Row 3**: Support Summary (full-width 2×2 grid)
- **Row 4**: Languages (full-width strip)
- **Records panel**: Full-width KPI strip at bottom

### Profile Card Classes
- `.ov-panel--profile` — outer glass panel (spans both rows)
- `.ov-profile__avatar` — 180×210px, border-radius 16px, cyan gradient fallback
- `.ov-profile__name` — white, 1.15rem, font-weight 800
- `.ov-profile__title` — mono, muted uppercase
- `.ov-profile__bio` — faded text, scrollable
- `.ov-profile__stats` — 4-column grid of `.ov-stat` cards
- `.ov-profile__social` — social icon buttons (`.ov-social-link--luxury`, 42×42px square)
- `.ov-social-link--luxury` — cyan glass bg, hover lifts 3px with brand color glow
- `.ov-stat` — small glass card with `--stat-color` top accent line

---

## 10. Responsive Breakpoints

| Breakpoint | Target | Changes |
|-----------|--------|---------|
| ≤1199px | Tablet L | `page-content` padding 20px, topbar gap var(--s3), greeting 1.20rem |
| ≤1024px | Tablet | Hide availability pill |
| ≤860px | Tablet S | Hide user name & chevron, hide greeting subtitle, greeting 1.05rem |
| ≤768px | Mobile | Hamburger appears, sidebar slides off-screen, `page-content` 16px padding, topbar 60px |
| ≤700px | Mobile | Overview sections collapse to single column |
| ≤599px | Small mobile | topbar 56px, greeting 0.85rem, actions gap var(--s2) |
| ≤375px | Very small | container padding 12px |

---

## 11. Theme System

- Default: **dark mode**
- Persisted in `localStorage` under key `ha-dev-theme`
- Applied via `data-theme="dark"` or `data-theme="light"` on `<html>` element
- Dark mode = `:root` + `[data-theme="dark"]`
- Light mode = `[data-theme="light"]`
- All colors use CSS variables that switch automatically
- Body has 4 radial gradient blobs that change color per theme
- Theme toggle: two buttons (🌙/☀️) with active state `theme-btn--active`

### Light Mode Key Values
- `--body-bg-base: #b8c8dc` (light blue-gray)
- Panels: `rgba(255,255,255,0.38)` with `blur(24px) saturate(1.6)`
- Borders: `rgba(79,143,199,0.12)` through `0.25`
- Text: dark navy (`#1a2332`, `#1e2d42`, `#3d5a80`, `#6b8aaa`)
- Accent cyan: `#1a8fc7` (deeper for contrast)

---

## 12. Dependencies

```json
{
  "dependencies": {
    "axios": "^1.7.7",
    "axios-retry": "^4.5.0",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.16.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.3",
    "recharts": "^2.13.3"
  }
}
```

---

## 13. Development Commands

```bash
npm run dev          # Vite dev server (--force)
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
npm run dev:clean    # Dev with force + clear screen
```

---

## 14. Naming Conventions

- **CSS classes**: BEM-like — `.block__element--modifier`
  - Blocks: `.sidebar`, `.topbar`, `.page-content`, `.ov-main-grid`, `.ov-panel`
  - Elements: `.sidebar__logo`, `.topbar__greeting`, `.ov-panel__title`
  - Modifiers: `.nav-item--active`, `.ov-panel--profile`, `.theme-btn--active`
- **Bento prefix**: `.ov-bento-*` for bento-grid-specific classes
  - `.ov-bento-card`, `.ov-bento-row--3col`, `.ov-bento-lang-chip`
- **JSX**: `camelCase` for functions, `PascalCase` for components
- **Hooks**: `use*` prefix
- **Services**: `*Service` objects with methods

---

## 15. CSS Anti-Patterns to Avoid

- ❌ Do NOT use `--s7` — it is not defined
- ❌ Do NOT hardcode colors — always use CSS variables where possible
- ❌ Do NOT add `!important` unless overriding a specificity higher than 0-3-0
- ❌ Do NOT add new CSS files without importing them in the component
- ✅ Use the existing spacing scale (`--s1` through `--s20`)
- ✅ Use the existing radius scale (`--r-xs` through `--r-full`)
- ✅ Use existing glass tokens for simple overlays
- ✅ For dark mode cards: `rgba(13, 18, 48, 0.35)` / light mode: `rgba(255,255,255,0.38)`

---

## 16. Design Language Summary

| Aspect | Dark Mode | Light Mode |
|--------|-----------|------------|
| Body | `#0b0f1e` with cyan+blue+violet gradient blobs | `#b8c8dc` with deep blue gradient blobs |
| Panels | `rgba(13,17,38,0.82)` blur(20px) | `rgba(255,255,255,0.55)` blur(32px) saturate(1.8) |
| Hover | `rgba(79,195,247,0.06)` bg + `0.22` border | `rgba(79,143,199,0.08)` bg + `0.30` border |
| Sidebar | `rgba(13,17,38,0.82)` + cyan right border | `rgba(255,255,255,0.55)` + blue border |
| Topbar | `rgba(13,17,38,0.75)` + cyan bottom border | `rgba(255,255,255,0.55)` + blue border |
| Text | White → muted gray | Dark navy → muted blue |
| Accent | `#4FC3F7` cyan | `#1a8fc7` deeper cyan |
| Buttons | Cyan glass | Blue-tinted white |

---

## 17. Glass Effect Reference

The target aesthetic is a **premium frosted glass** where the background gradient blobs are faintly visible through the panels. Key parameters:

- **Low opacity** (0.30–0.40): keeps the glass feeling transparent, not solid
- **Strong blur** (24px): diffuses what's behind into a smooth frosted effect
- **Subtle cyan border** (0.08–0.12): gives the glass edge definition
- **Saturation boost** (1.2): enhances colors passing through the glass
- **Hover: even more transparent** + brighter border + faint glow + 2px lift



After the redesign to match the sidebar, all cards now use the **same opacity** as the sidebar (82% dark / 55% light) for visual consistency. The frosted effect comes from the `blur(20px)` / `blur(32px)` with an `inset` top highlight line.

---

## 18. Recent Changes (this session)
- All panel glass unified to match sidebar: `rgba(13,17,38,0.82)` + `blur(20px)` + `inset 0 1px 0 rgba(79,195,247,0.06)`
- All sub-elements (stats, records, lang cards, support items, bento cards) use the same 82% opacity glass
- Light mode unified to 55% white glass with `blur(32px) saturate(1.8)` — matches sidebar/topbar
- Hover states: `rgba(79,195,247,0.06)` bg + `0.22` border + lift -2px
- Fixed `page-content` padding: replaced undefined `--s7` with `--s5`
- Updated AGENTS.md (this file) with detailed project reference

---

## 19. Section Build Status

| Section | Status | File |
|---------|--------|------|
| Overview | ✅ Complete | `sections/OverviewSection.jsx` |
| Skills | ✅ Complete | `sections/SkillsSection.jsx` |
| Analytics | ✅ Complete | `sections/AnalyticsSection.jsx` |
| Experience | ❌ Placeholder | `pages/Home.jsx` |
| Projects | ❌ Placeholder | `pages/Home.jsx` |
| Education | ❌ Placeholder | `pages/Home.jsx` |
| Self Study | ❌ Placeholder | `pages/Home.jsx` |
| Goals | ❌ Placeholder | `pages/Home.jsx` |
| Feedback | ❌ Placeholder | `pages/Home.jsx` |
| About | ❌ Placeholder | `pages/Home.jsx` |
| Contact | ❌ Placeholder | `pages/Home.jsx` |

---

## 19. Git Workflow

- Branch: `master`
- Commit convention: `type: description` (e.g., `feat: add skills section`, `fix: page-content padding`, `refactor: frosted glass panels`)
- Remote: `origin` (HTTPS — no credential helper configured)
- Git LFS: not used
- Only commit when explicitly requested by user

---

## 20. Important Notes

- The user speaks Arabic natively; some comments and variable names may be in Arabic
- "الصورة" (reference image) — the user keeps referring to a design image, but no image file exists in the project. The target is a premium glassmorphism aesthetic
- The user prefers concise answers and minimal output
- **Before applying edits**: run `git diff` or the tool's diff review to show changes before committing
- **After each feature/task**: run "generate conventional commit messages for all changes" to create structured commit messages
- Always check `index.css` for design tokens before hardcoding values
- Keep existing class names intact; only modify CSS values and JSX content

---

*Last updated: May 30, 2026 — Initial comprehensive reference*
