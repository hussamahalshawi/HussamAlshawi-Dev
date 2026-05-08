/**
 * ProjectsSection.jsx — Portfolio projects grid with filter tabs
 * Features: filter by project type, project cards with tech tags,
 * GitHub and live URL links.
 * All data comes from the projects prop (no internal fetching).
 */
import { useState }           from 'react';                   // State for active filter tab
import Card                   from '../ui/Card';              // Reusable card wrapper
import Badge                  from '../ui/Badge';             // Reusable badge for tech tags
import Button                 from '../ui/Button';            // Reusable button for links
import { SkeletonCardGrid }   from '../ui/SkeletonLoader';    // Skeleton while loading
import { formatDateRange,
         truncate }           from '../../utils/formatters';  // Date range and text truncation

/**
 * @param {object}      props
 * @param {object|null} props.projects - Projects object from /api/portfolio/projects
 */
export default function ProjectsSection({ projects }) {

  const [activeType, setActiveType] = useState('All');        // Currently selected filter tab

  // Show skeletons while loading
  if (!projects) {
    return (
      <section id="projects" className="section">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Portfolio</span>
            <h2 className="s-title">Projects</h2>
          </div>
          <SkeletonCardGrid count={6} height="240px" />
        </div>
      </section>
    );
  }

  const allProjects = projects.projects || [];                // Full projects array
  const types       = ['All', ...(projects.types || [])];    // Filter tabs including "All"

  // Apply type filter — show all if 'All' is selected
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
            {allProjects.length} projects shipped across {types.length - 1} categories
          </p>
        </div>

        {/* ── Filter tabs ── */}
        <div className="projects-filters">
          {types.map(type => (
            <button
              key={type}
              className={`projects-filter-btn ${activeType === type ? 'projects-filter-btn--active' : ''}`}
              onClick={() => setActiveType(type)}             /* Switch active filter */
            >
              {type}
            </button>
          ))}
        </div>

        {/* ── Projects grid ── */}
        <div className="projects-grid">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '3rem 0' }}>
            No projects found for this filter.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * ProjectCard — renders a single project card.
 * @param {{ project: object }} props
 */
function ProjectCard({ project }) {
  const dateRange = formatDateRange(                          // e.g. "2023 — 2024"
    project.start_date,
    project.end_date
  );

  // Show first project image or a placeholder gradient
  const coverImage = project.media?.project_images?.[0] || null;

  return (
    <Card interactive revealBar className="project-card">

      {/* ── Cover image or gradient placeholder ── */}
      <div className="project-card__cover">
        {coverImage
          ? <img src={coverImage} alt={project.project_name} className="project-card__img" />
          : <div className="project-card__cover-placeholder" aria-hidden="true" />
        }

        {/* Project type badge overlaid on cover */}
        {project.project_type && (
          <Badge
            label={project.project_type}
            variant="lime"
            className="project-card__type-badge"
          />
        )}
      </div>

      {/* ── Card body ── */}
      <div className="project-card__body">

        {/* Project name */}
        <h3 className="project-card__name">{project.project_name}</h3>

        {/* Date range */}
        {dateRange !== '—' && (
          <span className="project-card__date">{dateRange}</span>
        )}

        {/* Description (truncated) */}
        {project.description && (
          <p className="project-card__desc">
            {truncate(project.description, 120)}              {/* Max 120 chars */}
          </p>
        )}

        {/* Tech skills used */}
        {project.skills_used?.length > 0 && (
          <div className="project-card__tags">
            {project.skills_used.slice(0, 5).map(skill => (   /* Show max 5 tags */
              <Badge key={skill} label={skill} variant="muted" />
            ))}
            {project.skills_used.length > 5 && (             /* +N more indicator */}
              <Badge label={`+${project.skills_used.length - 5}`} variant="muted" />
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
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
    </Card>
  );
}