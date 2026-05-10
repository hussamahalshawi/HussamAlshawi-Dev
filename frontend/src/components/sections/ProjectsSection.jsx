/**
 * ProjectsSection.jsx — Portfolio Projects Grid
 * ─────────────────────────────────────────────────────────
 * Features:
 * - Glass filter tabs with active cyan state
 * - Cards: cover image/placeholder + gradient overlay
 * - Hover: lift + reveal bottom bar + image zoom
 * - Tech badge tags + GitHub / Live action buttons
 * ─────────────────────────────────────────────────────────
 */
import { useState }         from 'react';
import Card                 from '../ui/Card';
import Badge                from '../ui/Badge';
import Button               from '../ui/Button';
import { SkeletonCardGrid } from '../ui/SkeletonLoader';
import {
  formatDateRange,
  truncate,
}                           from '../../utils/formatters';
import '../../styles/components/ProjectsSection.css';

/**
 * @param {object}      props
 * @param {object|null} props.projects - From /api/portfolio/projects
 */
export default function ProjectsSection({ projects }) {

  const [activeType, setActiveType] = useState('All'); /* Active filter tab */

  /* ── Loading state ────────────────────────────────────────────── */
  if (!projects) {
    return (
      <section id="projects" className="section">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Portfolio</span>
            <h2 className="s-title">Projects</h2>
          </div>
          <SkeletonCardGrid count={6} height="320px" />
        </div>
      </section>
    );
  }

  const allProjects = projects.projects || [];
  const types       = ['All', ...(projects.types || [])];

  /* Apply type filter */
  const filtered = activeType === 'All'
    ? allProjects
    : allProjects.filter(p => p.project_type === activeType);

  return (
    <section id="projects" className="section">
      <div className="container">

        {/* ── Section header ── */}
        <div className="s-head">
          <span className="s-tag">Portfolio</span>
          <h2 className="s-title">Projects</h2>
          <p className="s-sub">
            {allProjects.length} projects across {types.length - 1} categories
          </p>
        </div>

        {/* ── Glass filter tabs ── */}
        <div className="projects-filters" role="tablist" aria-label="Filter by project type">
          {types.map(type => (
            <button
              key={type}
              className={`projects-filter-btn ${activeType === type ? 'projects-filter-btn--active' : ''}`}
              onClick={() => setActiveType(type)}
              role="tab"
              aria-selected={activeType === type}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ── Projects grid ── */}
        <div className="projects-grid" role="tabpanel">
          {filtered.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
            />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <p style={{
            color:     'var(--text-muted)',
            textAlign: 'center',
            padding:   '3rem 0',
            fontFamily:'var(--font-mono)',
            fontSize:  '0.82rem',
          }}>
            No projects match this filter.
          </p>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   ProjectCard — glass card with cover image + hover effects
───────────────────────────────────────────────────────────── */
/**
 * @param {{ project: object, index: number }} props
 */
function ProjectCard({ project, index }) {

  const dateRange  = formatDateRange(project.start_date, project.end_date);
  const coverImage = project.media?.project_images?.[0] || null;

  return (
    <article
      className="project-card"
      style={{ animation: `fadeUp 0.45s ease ${index * 60}ms both` }}
      aria-label={project.project_name}
    >
      {/* ── Cover ── */}
      <div className="project-card__cover">
        {coverImage
          ? (
            <img
              src={coverImage}
              alt={`${project.project_name} cover`}
              className="project-card__img"
              loading="lazy"
            />
          )
          : <div className="project-card__cover-placeholder" aria-hidden="true" />
        }

        {/* Type badge overlaid on cover */}
        {project.project_type && (
          <div className="project-card__type-badge">
            <Badge label={project.project_type} variant="lime" />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="project-card__body">

        {/* Name */}
        <h3 className="project-card__name">{project.project_name}</h3>

        {/* Date */}
        {dateRange !== '—' && (
          <span className="project-card__date">{dateRange}</span>
        )}

        {/* Description — max 120 chars */}
        {project.description && (
          <p className="project-card__desc">
            {truncate(project.description, 120)}
          </p>
        )}

        {/* Tech tags — max 5 visible */}
        {project.skills_used?.length > 0 && (
          <div className="project-card__tags">
            {project.skills_used.slice(0, 5).map(skill => (
              <Badge key={skill} label={skill} variant="muted" />
            ))}
            {project.skills_used.length > 5 && (
              <Badge
                label={`+${project.skills_used.length - 5}`}
                variant="muted"
              />
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="project-card__actions">
          {project.github_url && (
            <Button
              variant="ghost"
              size="sm"
              href={project.github_url}
            >
              ⚙ Code
            </Button>
          )}
          {project.live_url && (
            <Button
              variant="primary"
              size="sm"
              href={project.live_url}
            >
              ↗ Live
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}