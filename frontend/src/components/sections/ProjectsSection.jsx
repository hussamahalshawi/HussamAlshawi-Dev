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

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import ProjectDetailModal from '../ui/ProjectDetailModal';
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

const ITEMS_PER_PAGE = 6;

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

  /* ── Pagination ───────────────────────────────────────────── */
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Selected project for detail modal ────────────────────── */
  const [selectedProject, setSelectedProject] = useState(null);
  const openDetail = useCallback((project) => setSelectedProject(project), []);
  const closeDetail = useCallback(() => setSelectedProject(null), []);

  const filteredProjects = useMemo(() => {
    if (activeType === 'All') return projectsList;
    return projectsList.filter(p => p.project_type === activeType);
  }, [projectsList, activeType]);

  /* ── Reset page on filter change ──────────────────────────── */
  const handleFilterChange = useCallback((type) => {
    setActiveType(type);
    setCurrentPage(1);
  }, []);

  /* ── Pagination math ──────────────────────────────────────── */
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length);

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
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     FILTER BAR
     ════════════════════════════════════════════════════════════ */
  const FilterBar = () => (
    <motion.div
      className="proj-panel proj-filters"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.05 }}
    >
      <button
        className={`proj-filter-btn ${activeType === 'All' ? 'proj-filter-btn--active' : ''}`}
        onClick={() => handleFilterChange('All')}
      >
        All ({projectsList.length})
      </button>
      {types.map(t => {
        const count = projectsList.filter(p => p.project_type === t).length;
        return (
          <button
            key={t}
            className={`proj-filter-btn ${activeType === t ? 'proj-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange(t)}
          >
            {t} ({count})
          </button>
        );
      })}
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     PROJECT CARD
     ════════════════════════════════════════════════════════════ */
  const ProjectCard = ({ project, index }) => {
    const accentColor = colors[index % colors.length];
    const skillCount = project.skills_used?.length || 0;
    const hasImages = (project.media?.project_images?.length || 0) > 0;
    const score = Math.min(100, skillCount * 12 + (hasImages ? 15 : 0) + (project.github_url ? 10 : 0) + (project.live_url ? 10 : 0) + (project.my_role ? 5 : 0));

    return (
      <motion.div
        className="proj-card"
        variants={CARD_VARIANTS}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ ...CARD_TRANSITION, delay: Math.min(index * 0.04, 0.2) }}
        onClick={() => openDetail(project)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(project); } }}
      >
        <div className="proj-card__top">
          <div className="proj-card__icon" style={{ background: accentColor + '18' }}>
            <ProjectIcon type={project.project_type} color={accentColor} />
          </div>
          <span className="proj-card__type">{project.project_type}</span>
          {project.end_date === null && <span className="proj-card__badge">Active</span>}
          {skillCount > 0 && (
            <div className="proj-card__score" title={`Complexity score: ${score}/100`}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{score}</span>
            </div>
          )}
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
            <a className="proj-card__link" href={project.github_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              GitHub
            </a>
          )}
          {project.live_url && (
            <a className="proj-card__link" href={project.live_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Live Demo
            </a>
          )}
          <button className="proj-card__details-btn" onClick={(e) => { e.stopPropagation(); openDetail(project); }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            View Details
          </button>
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
      <FilterBar />
      <div className="proj-grid">
        {paginatedProjects.map((project, i) => (
          <ProjectCard key={project.id || i} project={project} index={i} />
        ))}
      </div>
      {totalPages > 1 && (
        <motion.div
          className="proj-pagination"
          variants={CARD_VARIANTS}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ ...CARD_TRANSITION, delay: 0.15 }}
        >
          <span className="proj-pagination__info">
            Showing {pageStart}–{pageEnd} of {filteredProjects.length}
          </span>
          <div className="proj-pagination__controls">
            <button
              className="proj-pagination__btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`proj-pagination__btn ${page === currentPage ? 'proj-pagination__btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="proj-pagination__btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={closeDetail}
      />
    </section>
  );
}
