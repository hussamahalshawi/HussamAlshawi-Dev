/**
 * SkillsSection.jsx — Skills Grid with Animated Bars and Radar Chart
 * ─────────────────────────────────────────────────────────
 * Left column: skill bars grouped by category (top 6 per category)
 * Right column: RadarChart showing category averages
 * All data comes from the skills prop (no internal fetching).
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useRef }  from 'react';                   // Refs and side effects
import SkillRadarChart        from '../charts/RadarChart';    // Recharts radar component
import { SkeletonSkillRow }   from '../ui/SkeletonLoader';    // Skeleton while loading
import { formatScore }        from '../../utils/formatters';  // Score → "92%" formatter
import '../../styles/components/SkillsSection.css';           // Component-specific styles

/**
 * @param {object}      props
 * @param {object|null} props.skills - Skills object from /api/portfolio/skills
 */
export default function SkillsSection({ skills }) {

  const barsRef = useRef(null);                               // Ref to trigger bar animations

  // ── Animate skill bars when section scrolls into view ───────────────────
  useEffect(() => {
    if (!barsRef.current) return;                             // Guard: not mounted yet

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;                  // Only when visible

          // Find all fill bars and trigger the CSS scale animation
          const fills = entry.target.querySelectorAll('.skill-row__fill');
          fills.forEach(fill => {
            fill.style.transform = 'scaleX(1)';              // Animate from 0 → 1
          });

          observer.unobserve(entry.target);                  // Only animate once
        });
      },
      { threshold: 0.2 }                                     // 20% visible threshold
    );

    observer.observe(barsRef.current);
    return () => observer.disconnect();                       // Cleanup on unmount
  }, [skills]);                                               // Re-run when data arrives

  // ── Derive display data from skills prop ────────────────────────────────
  const grouped   = skills?.grouped   || {};                  // { "Backend": [...] }
  const radarData = skills?.grouped
    ? buildRadarData(skills.grouped)                          // Build from grouped
    : [];

  // Show skeletons while loading
  if (!skills) {
    return (
      <section id="skills" className="section section--alt">
        <div className="container">
          <div className="s-head">
            <span className="s-tag">Technical Skills</span>
            <h2 className="s-title">What I Build With</h2>
          </div>
          <div className="skills-layout">
            <div className="skill-groups">
              {Array.from({ length: 8 }, (_, i) => (
                <SkeletonSkillRow key={i} />                  // 8 skeleton rows
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="section section--alt">
      <div className="container">

        {/* ── Section header ── */}
        <div className="s-head">
          <span className="s-tag">Technical Skills</span>
          <h2 className="s-title">What I Build With</h2>
          <p className="s-sub">
            {skills.count} skills across {Object.keys(grouped).length} categories
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="skills-layout">

          {/* ── LEFT: skill bars grouped by category ── */}
          <div className="skill-groups" ref={barsRef}>
            {Object.entries(grouped).map(([category, skillList]) => (
              <div key={category}>

                {/* Category heading */}
                <p className="skill-group__title">{category}</p>

                {/* Skill bars — top 6 per category */}
                {skillList.slice(0, 6).map(skill => (
                  <div key={skill.skill_name} className="skill-row">

                    {/* Skill name */}
                    <span className="skill-row__name">{skill.skill_name}</span>

                    {/* Animated track */}
                    <div className="skill-row__track">
                      <div
                        className="skill-row__fill"
                        style={{
                          width:      `${skill.score}%`,      // Bar width = score
                          background: skill.color
                            ? `linear-gradient(90deg, ${skill.color}, #4FC3F7)` // API color
                            : 'linear-gradient(90deg, #4ECCA3, #4FC3F7)',        // Default
                        }}
                      />
                    </div>

                    {/* Score percentage */}
                    <span className="skill-row__pct">
                      {formatScore(skill.score)}              // "92%"
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── RIGHT: radar chart ── */}
          <div className="radar-wrap">
            <p className="skill-group__title" style={{ marginBottom: 'var(--s5)' }}>
              Category Overview
            </p>
            <SkillRadarChart
              data={radarData}                                // Category averages
              height={300}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Builds radar chart data from grouped skills.
 * Calculates average score per category.
 * @param {object} grouped - { category: skill[] }
 * @returns {{ category: string, avg_score: number }[]}
 */
function buildRadarData(grouped = {}) {
  return Object.entries(grouped).map(([category, skillsList]) => ({
    category,                                                 // Category name for axis label
    avg_score: Math.round(                                    // Rounded integer average
      skillsList.reduce((sum, s) => sum + s.score, 0) / skillsList.length
    ),
  }));
}