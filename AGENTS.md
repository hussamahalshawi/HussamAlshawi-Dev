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
                  ├─ AnalyticsSection   ✅ Built (5 tabs + AllChartsDashboard)
                  ├─ Goals              ❌ Placeholder
                  ├─ Feedback           ❌ Placeholder
                  ├─ About              ❌ Placeholder
                  └─ Contact            ❌ Placeholder
```

### Component Ownership
- `DashboardLayout` owns the persistent shell (sidebar + topbar + page-content)
- `Home` owns section visibility (`display: block/none` based on `activeSection` state)
- Sections are **always mounted** but **only visible when active** — no remount, no data refetch
- Data loaded once via `usePortfolioData`, polled every 5min in background

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
| `/api/portfolio/languages` | `languagesService` | 2 | Languages list |
| `/api/charts/portfolio/summary` | `analyticsService.getPortfolioSummary` | 2 | Composite portfolio chart data |

### Cache Strategy (`usePortfolioData`)
1. Show cached data from `localStorage` instantly (on mount)
2. Fetch Phase 1 (Profile) — await, hide loader when done
3. Fetch Phase 2 (Analytics + Skills + Projects + Skills Summary + Languages + Portfolio Summary) — background, no loader
4. Poll every **5min** — silently check all APIs for hash changes, auto-update UI

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
| `sections/AnalyticsSection.jsx` | Built | Charts/analytics (5 tabs + AllChartsDashboard) |
| `sections/AllChartsDashboard.jsx` | ~481 | All-charts collapsible dashboard (4 sections) |
| `charts/BarChart.jsx` | — | Bar chart component |
| `charts/DonutChart.jsx` | — | Donut chart component |
| `charts/ProgressBar.jsx` | — | Animated progress bar |
| `charts/RadarChart.jsx` | — | Radar chart |
| `charts/StatCard.jsx` | — | Stat display card |
| `charts/PerformanceChart.jsx` | — | Performance line chart |
| `charts/DualAxisChart.jsx` | — | Composed bar + line dual-axis chart |
| `charts/SunburstChart.jsx` | — | SVG skills hierarchy sunburst |
| `charts/SkillBulletChart.jsx` | — | Goal skill gap bullet chart |
| `charts/AchievementsTimeline.jsx` | — | Achievement timeline list |
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

### Session 2: Polling optimization + UI polish
- Polling interval increased 20s → 5min in `usePortfolioData.js`
- Added `portfolioSummary` task to `usePortfolioData.js` (replaces 4 separate portfolio chart calls)
- Deleted `usePortfolio.js` (redundant — merged into `usePortfolioData`)
- Updated `Home.jsx` to use `data.portfolioSummary` instead of `usePortfolio`
- Simplified `AnalyticsSection` props: removed `portfolioLoading`/`portfolioError`
- Added `key_prefix` to all 5 portfolio chart route cache decorators (backend)
- Added 5 `portfolio_*` keys to signal-based cache invalidation (backend)
- Added `portfolioSummary` entry to `CACHE_KEYS` in `cache.js`

### Session 3: Chart improvements
- Replaced emojis with Lucide icons in `AllChartsDashboard` and KPI cards
- Removed duplicate API fetching: lifted chart composite data to `AnalyticsSection`, passed as props
- Added dark/light theme-aware color palettes to `SunburstChart`, `SkillBulletChart`, `AchievementsTimeline`
- Unified glass opacity in `AllChartsDashboard.css`: all panels now use 82% (dark) / 55% (light) formula matching sidebar

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
- **NEVER commit or push** — the user handles all commits and pushes manually
- After each edit session/task, **automatically** output commit message(s) in a markdown code block for the user to copy — do NOT wait for them to ask

---

## 20. Important Notes

- The user speaks Arabic natively; some comments and variable names may be in Arabic
- "الصورة" (reference image) — the user keeps referring to a design image, but no image file exists in the project. The target is a premium glassmorphism aesthetic
- The user prefers concise answers and minimal output
- Always check `index.css` for design tokens before hardcoding values
- Keep existing class names intact; only modify CSS values and JSX content

---

## 21. Backend Models (MongoEngine ODM)

All models use **MongoEngine** (`mongoengine`) — not SQLAlchemy. Located in `backend/App/models/` and `backend/auth/models/`.

### Profile (`backend/App/models/profile.py`)
| Field | Type |
|-------|------|
| `full_name`, `title`, `bio` | StringField |
| `email` | EmailField (unique) |
| `phone`, `address` | StringField |
| `is_available_for_hire`, `remote_preference` | BooleanField |
| `primary_avatar` | StringField (Cloudinary URL) |
| `github_url`, `linkedin_url`, `facebook_url`, `instagram_url`, `medium_url` | URLField |
| `profile_gallery` | ListField(StringField) |
| `experience_years`, `overall_score` | FloatField |
| `last_updated` | DateTimeField |

### Education (`backend/App/models/education.py`)
`profile` (→Profile), `institution`, `degree`, `major`, `grade`, `description`, `start_date`, `end_date`, `certificate_image`, `education_photos`[], `education_video`, `skills_learned`[]

### Achievement (`backend/App/models/achievement.py`)
`profile` (→Profile), `title`, `issuing_organization`, `certificate_image`, `evidence_photos`[], `evidence_video`, `evidence_url`, `date_obtained`, `description`, `skills_demonstrated`[]

### Course (`backend/App/models/course.py`)
`profile` (→Profile), `course_name`, `organization`, `category` (→Category), `project_summary`, `credential_url`, `certificate_image`, `course_images`[], `course_video`, `start_date`, `end_date`, `acquired_skills`[]

### Experience (`backend/App/models/experience.py`)
`profile` (→Profile), `job_title`, `company_name`, `employment_type` (Full-time/Part-time/Freelance/Contract), `location`, `company_url`, `description`, `start_date`, `end_date`, `is_current`, `certificate_image`, `experience_images`[], `experience_video`, `skills_acquired`[]

### SelfStudy (`backend/App/models/self_study.py`)
`profile` (→Profile), `title`, `platform_name`, `learning_type` (Book/Course/Article/Workshop/Other), `track` (→Category), `summary`, `source_url`, `cover_image`, `start_date`, `end_date`, `skills_learned`[]

### Project (`backend/App/models/project.py`)
`profile` (→Profile), `project_name` (unique), `project_type` (Web App/Mobile App/Desktop/CLI Tool/API/Library), `github_url`, `live_url`, `description`, `my_role`, `category` (→Category), `project_images`[], `project_video`, `start_date`, `end_date`, `skills_used`[]

### Goal (`backend/App/models/goal.py`)
`profile` (→Profile), `goal_name` (unique), `sub_title`, `status` (Planned/In Progress/Achieved/Paused), `priority` (Low/Medium/High/Critical), `target_year` (IntField), `target_score`, `current_score`, `required_skills`[]

### Language (`backend/App/models/language.py`)
`profile` (→Profile), `language_name`, `proficiency` (Native/Fluent/Advanced/Intermediate/Beginner)

### Feedback (`backend/App/models/feedback.py`)
`profile` (→Profile), `sender_name`, `sender_email`, `company_name`, `job_title`, `message`, `is_read`, `is_featured`, `submitted_at`

### MediaVault (`backend/App/models/my_media.py`)
`vault_name` (unique), `description`, `media_links`[] (URLField), `content_type` (Images/Videos/Mixed)

### Category (`backend/App/models/category.py`)
`name` (unique), `description`

### SkillType (`backend/App/models/skills.py`)
`name` (unique), `keywords`[] (EmbeddedDocument → Keyword: `name`, `icon`, `color`)

### Skill (`backend/App/models/skills.py`)
`skill_name` (unique), `skill_type` (→SkillType), `skill_icon`

### ProfileSkill (`backend/App/models/skills.py`)
`profile` (→Profile), `skill` (→Skill), `score` (0-100 IntField)

### AdminUser (`backend/auth/models/admin_user.py`)
`username` (unique), `email` (unique), `password_hash`, `is_active`, `is_super_admin`, `failed_attempts` (StringField), `last_login`, `last_failed`

### Relationship Map
- **All profile-scoped models** → `ReferenceField('Profile')`: Education, Achievement, Course, Experience, SelfStudy, Project, Goal, Language, Feedback, ProfileSkill
- **Category-linked models**: Course.category, SelfStudy.track, Project.category → `ReferenceField(Category)`
- **Skill hierarchy**: Skill.skill_type → SkillType; ProfileSkill.skill → Skill; SkillType.keywords[] → Keyword (EmbeddedDocument)

---

## 22. Backend Signals (`backend/App/utils/signals.py`)

Async pipeline on a **background daemon thread** (not blocking the API).

### Components
| Component | Purpose |
|-----------|---------|
| `_pipeline_queue` | FIFO `queue.Queue()` for pipeline sync jobs |
| `_pending_profiles` | `set()` deduplication — prevents queueing same profile twice |
| `COOLDOWN_SECONDS = 2` | Waits 2 seconds between jobs to merge rapid saves |
| `_worker_started` | Guard — ensures only one worker thread |

### 3 Signal Handlers
| Handler | Signal | Action |
|---------|--------|--------|
| `master_pre_save_signal` | `pre_save` | Auto-assigns active Profile to new docs (if `document.profile is None`) |
| `master_sync_signal` | `post_save` | Clears public cache + enqueues pipeline job |
| `master_delete_signal` | `post_delete` | Clears public cache + enqueues pipeline job |

### Monitored Models (7)
`Project`, `Course`, `Experience`, `Education`, `SelfStudy`, `Achievement`, `Goal`

### Pipeline Steps (executed by worker thread in order)
1. **`SkillService.recalculate_profile_scores(profile)`** — rebuilds all ProfileSkill scores from 6 source models
2. **`RoadmapService.sync_all_goals(profile)`** — syncs goal progress scores
3. **`ProfileService.calculate_metrics(profile_id)`** — refreshes `experience_years` and `overall_score`

### Registration
In `backend/App/__init__.py` step 10 of `create_app()`, `register_signals(app)` is called with `app.app_context()`. The 3 handlers are connected to all 7 monitored models via `pre_save/post_save/post_delete`.

**⚠️ Important**: `SkillService._get_or_create_skill()` temporarily **disconnects** the `post_save` signal from `Skill` model when creating a new Skill doc to prevent recursive pipeline triggers. Reconnected in `finally` block.

---

## 23. Backend Services

### ProfileService (`backend/App/services/profile_service.py`)
| Method | Purpose |
|--------|---------|
| `calculate_metrics(profile_id)` | Calculates `experience_years` (weighted: Experience×1.0, Project×0.4, Education×0.2, SelfStudy×0.3, Course×0.3) and `overall_score` (60% ProfileSkill avg + 40% Goal progress avg) |

### SkillService (`backend/App/services/skill_service.py` — 533 lines)
| Method | Purpose |
|--------|---------|
| `recalculate_profile_scores(profile)` | Main method. Builds score map from 6 source models with weights (Experience=25, Project=20, Course=15, Achievement=12, SelfStudy=10, Education=8). Upserts ProfileSkill, removes stale entries, re-categorizes Skills |
| `deduplicate_skills()` | Merges duplicate Skill docs caused by case variations |
| `_get_or_create_skill(name)` | Cache-first lookup; temporarily disconnects signals during new Skill creation |
| `bulk_update_categories()` | Re-categorizes all Skills via token matching against SkillType keywords |

### RoadmapService (`backend/App/services/roadmap_service.py`)
| Method | Purpose |
|--------|---------|
| `calculate_goal_progress(goal_id)` | Token-matches `required_skills` against ProfileSkill names. Averages across required skills scaled to `target_score`. Auto-promotes status to 'Achieved' |
| `sync_all_goals(profile)` | Runs `calculate_goal_progress` for all goals (scoped to profile) |

### AuthService (`backend/auth/auth_service.py`)
| Method | Purpose |
|--------|---------|
| `login(username, password)` | Validates credentials, enforces lockout (5 attempts/15 min), creates 8h session |
| `logout()` | Clears session |
| `is_authenticated()` | Checks session validity |
| `login_required(f)` | Decorator for admin route protection |

### Triggering
The 3 main services (**ProfileService**, **SkillService**, **RoadmapService**) are **only triggered by the Signal Pipeline** — no API route calls them directly. `AuthService` is used by `auth/routes.py`.

---

## 24. Backend Wiring — App Factory (`backend/App/__init__.py`)

`create_app()` executes 10 steps:

| Step | Action |
|------|--------|
| 1 | Resolve template directory |
| 2 | Load config (`config.py` — Development/Production) |
| 3 | Session security (HTTPOnly, SameSite, 8h expiry) |
| 4 | CORS (`/api/*` all origins) + Flask-Caching (SimpleCache, 5min TTL, 500 items) |
| 5 | File logging setup |
| 6 | MongoDB connection via `init_db()` (Atlas/local) |
| 7 | Register auth blueprints (`auth_bp`, `cli_bp`) |
| 8 | Flask-Admin setup (17 views across 5 categories) |
| 9 | Register ALL API blueprints (16 public + 5 charts + 2 admin + 1 dev) |
| 10 | Register signals via `register_signals(app)` |

### Entry Point: `backend/run.py`
- Imports `create_app` from `App`
- Runs `app.run(host='0.0.0.0', port=5000)` with debug mode

### Route ↔ Service ↔ Model Relationship
- **Public API routes** use `route_helpers.py` helpers directly (no Service layer): `get_profile()`, `build_token_map()`, `resolve_skill_score()`, `build_skill_payload()`
- **Services are used ONLY by Signal Pipeline** (not by routes directly) — except `AuthService` used by auth routes
- **16 public API blueprints** + **5 charts blueprints** + **2 admin blueprints** + **1 dev blueprint** = 24 total API blueprints

### Blueprint File Map

| Blueprint File | Routes |
|---------------|--------|
| `routes/public/profile_api.py` | `/api/portfolio/profile` |
| `routes/public/skills_api.py` | `/api/portfolio/skills`, `/api/portfolio/skills/summary` |
| `routes/public/projects_api.py` | `/api/portfolio/projects`, `/api/portfolio/projects/<id>` |
| `routes/public/experience_api.py` | `/api/portfolio/experience`, `/api/portfolio/experience/timeline` |
| `routes/public/education_api.py` | `/api/portfolio/education` |
| `routes/public/courses_api.py` | `/api/portfolio/courses` |
| `routes/public/achievements_api.py` | `/api/portfolio/achievements` |
| `routes/public/self_study_api.py` | `/api/portfolio/self-study` |
| `routes/public/goals_api.py` | `/api/portfolio/goals`, `/api/portfolio/goals/stats` |
| `routes/public/languages_api.py` | `/api/portfolio/languages` |
| `routes/public/feedback_api.py` | `/api/portfolio/feedback`, `/api/portfolio/feedback/featured` |
| `routes/charts/skills_charts_api.py` | `/api/charts/skills/*` (radar, distribution, top-bars, heatmap, sources) |
| `routes/charts/career_charts_api.py` | `/api/charts/career/*` (gantt, employment-mix, projects-treemap, projects-heatmap, stack-frequency, achievements-timeline) |
| `routes/charts/goals_charts_api.py` | `/api/charts/goals/*` (gauge, status-donut, priority-donut, year-progress, skill-gap, roadmap-timeline) |
| `routes/charts/learning_charts_api.py` | `/api/charts/learning/*` (courses-by-year, providers, skills-word-cloud, self-study-types, self-study-tracks, learning-vs-output) |
| `routes/public/analytics_api.py` | `/api/portfolio/analytics`, `/api/portfolio/analytics/tech-stack`, `/api/portfolio/analytics/timeline` |
| `routes/admin/dashboard_api.py` | `/api/profiles`, `/api/profile/<id>`, `/api/profile-skills`, `/api/goals-dashboard` |
| `routes/admin/languages_feedback_api.py` | `/api/dashboard-languages`, `/api/dashboard-feedback` |
| `routes/admin/__init__.py` | `/api/dev/cache-status` |

---

## 25. Installed Skills — Workflow & Usage

Global skills at `~/.config/opencode/skills/`. **Always load the relevant skill(s) via the `skill` tool before starting work on the matching area.**

### Priority Order (load in this sequence)

| Priority | Skill | When to load | How to apply |
|----------|-------|-------------|--------------|
| 1️⃣ | `problem-solving` | Any complex task, bug, or architectural decision | Use collision-zone, inversion, or simplification cascades to explore solutions |
| 2️⃣ | `sequential-thinking` | Multi-step features, debugging across stack | Break into steps, iterate, branch alternatives |
| 3️⃣ | `code-review` | Before committing any code change | Run runtime/security/performance review per Sentry standards |
| 4️⃣ | `security-review` | Any backend auth, API, or data handling code | OWASP-guided review — only report HIGH confidence findings |

### Area → Skill Mapping

#### Frontend (React + CSS)
| Area | Load These Skills |
|------|------------------|
| Building new sections (Experience, Projects, Education, etc.) | `frontend-design` + `frontend-dev-guidelines` + `motion-design` |
| UI polishing, color, layout, responsive | `frontend-ui-ux` + `ui-styling` + `ui-ux-pro-max` |
| Animations, transitions, micro-interactions | `motion-design` + `frontend-design` |
| React component architecture, hooks, data flow | `frontend-dev-guidelines` + `web-frameworks` |
| Chart implementation or improvement | `ui-ux-pro-max` (25 chart types reference) |
| Cross-browser, performance, a11y, visual regression | `web-testing` |

#### Backend (Flask + Python)
| Area | Load These Skills |
|------|------------------|
| API routes, services, app factory | `backend-development` + `code-review` |
| MongoDB models, queries, aggregation | `databases` + `backend-development` |
| Auth, sessions, admin routes | `better-auth` + `security-review` |
| Config, deployment, Docker, CI/CD | `devops` + `backend-development` |

### Workflow Rule
When the user says "حسن الموقع" (improve the site) or starts a new section, **load `problem-solving` + `sequential-thinking` + `frontend-design` + `frontend-ui-ux`** together to approach from multiple angles before writing code.

---

*Last updated: June 6, 2026 — Added 16 installed skills with workflow mappings*
