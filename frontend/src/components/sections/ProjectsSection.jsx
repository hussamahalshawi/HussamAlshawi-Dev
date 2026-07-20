/**
 * ProjectsSection.jsx
 * ─────────────────────────────────────────────────────────
 * Projects showcase section with stats + filterable grid.
 *
 * Layout:
 *   Row 1: Stats bar (count, types, active)
 *   Row 2: Project cards grid (auto-fill)
 *
 * Data: projects from usePortfolioData (GET /api/portfolio/projects)
 * ─────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/components/ProjectsSection.css';

/* ── Animation variants ─────────────────────────────────────── */
const CARD_VARIANTS = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const CARD_TRANSITION = {
  duration: 0.5,
  ease:     [0.4, 0, 0.2, 1],
};

/* ── Theme colors ───────────────────────────────────────────── */
const COLORS = {
  dark: ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292', '#FFD700', '#5B8DEF', '#BA7517'],
  light: ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#c49b00', '#3a6fd8', '#854F0B'],
};

/* ── Project type icons ─────────────────────────────────────── */
const TYPE_ICONS = {
  'Web App':      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  'Mobile App':   'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01',
  'Desktop':      'M20 3H4a1 1 0 00-1 1v12a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1zM8 21h8',
  'CLI Tool':     'M4 17l6-6-6-6M12 19h8',
  'API':          'M4 6h16M4 10h16M4 14h16M4 18h16',
  'Library':      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5',
};

function ProjectIcon({ type, color }) {
  const path = TYPE_ICONS[type] || TYPE_ICONS['Web App'];
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ProjectsSection({ projects }) {
  const { isDark } = useTheme();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const projectsList = projects?.projects || [];
  const types = projects?.types || [];

  /* ── Active type filter ───────────────────────────────────── */
  const [activeType, setActiveType] = useState('All');

  const filteredProjects = useMemo(() => {
    if (activeType === 'All') return projectsList;
    return projectsList.filter(p => p.project_type === activeType);
  }, [projectsList, activeType]);

  /* ── Stats ────────────────────────────────────────────────── */
  const activeCount = projectsList.filter(p => !p.end_date).length;

  /* ════════════════════════════════════════════════════════════
     STATS BAR
     ════════════════════════════════════════════════════════════ */
  const StatsBar = () => (
    <motion.div
      className="proj-panel proj-stats"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.0 }}
    >
      <div className="proj-stats__item">
        <span className="proj-stats__num">{projectsList.length}</span>
        <span className="proj-stats__label">Total Projects</span>
      </div>
      <div className="proj-stats__divider" />
      <div className="proj-stats__item">
        <span className="proj-stats__num">{types.length}</span>
        <span className="proj-stats__label">Categories</span>
      </div>
      <div className="proj-stats__divider" />
      <div className="proj-stats__item">
        <span className="proj-stats__num proj-stats__num--accent">{activeCount}</span>
        <span className="proj-stats__label">Active</span>
      </div>
      <div className="proj-stats__filters">
        <button
          className={`proj-filter-btn ${activeType === 'All' ? 'proj-filter-btn--active' : ''}`}
          onClick={() => setActiveType('All')}
        >
          All
        </button>
        {types.map(t => (
          <button
            key={t}
            className={`proj-filter-btn ${activeType === t ? 'proj-filter-btn--active' : ''}`}
            onClick={() => setActiveType(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     PROJECT CARD
     ════════════════════════════════════════════════════════════ */
  const ProjectCard = ({ project, index }) => {
    const accentColor = colors[index % colors.length];

    return (
      <motion.div
        className="proj-card"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: Math.min(index * 0.04, 0.2) }}
      >
        <div className="proj-card__top">
          <div className="proj-card__icon" style={{ background: accentColor + '18' }}>
            <ProjectIcon type={project.project_type} color={accentColor} />
          </div>
          <span className="proj-card__type">{project.project_type}</span>
          {project.end_date === null && <span className="proj-card__badge">Active</span>}
        </div>

        <h3 className="proj-card__name">{project.project_name}</h3>

        {project.description && (
          <p className="proj-card__desc">{project.description}</p>
        )}

        {project.my_role && (
          <div className="proj-card__role">
            <span className="proj-card__role-label">Role</span>
            <span className="proj-card__role-value">{project.my_role}</span>
          </div>
        )}

        {project.category && (
          <div className="proj-card__category">{project.category}</div>
        )}

        {project.skills_used?.length > 0 && (
          <div className="proj-card__skills">
            {project.skills_used.slice(0, 5).map((sk, i) => (
              <span className="proj-card__skill-tag" key={i}>{sk}</span>
            ))}
            {project.skills_used.length > 5 && (
              <span className="proj-card__skill-more">+{project.skills_used.length - 5}</span>
            )}
          </div>
        )}

        <div className="proj-card__meta">
          {project.start_date && (
            <span className="proj-card__date">
              {new Date(project.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
              {project.end_date && ` — ${new Date(project.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
              {!project.end_date && ' — Present'}
            </span>
          )}
        </div>

        <div className="proj-card__links">
          {project.github_url && (
            <a className="proj-card__link" href={project.github_url} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              GitHub
            </a>
          )}
          {project.live_url && (
            <a className="proj-card__link" href={project.live_url} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Live Demo
            </a>
          )}
        </div>
      </motion.div>
    );
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  if (projectsList.length === 0) {
    return (
      <section id="projects" className="projects-section" aria-label="Projects">
        <div className="proj-empty">No projects found</div>
      </section>
    );
  }

  return (
    <section id="projects" className="projects-section" aria-label="Projects">
      <StatsBar />
      <div className="proj-grid">
        {filteredProjects.map((project, i) => (
          <ProjectCard key={project.id || i} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
