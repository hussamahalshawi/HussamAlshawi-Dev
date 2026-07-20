import { useMemo, useState, useEffect } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';

const SOURCE_COLORS = {
  courses: '#F5A623',
  self_study: '#F06292',
  education: '#9B7FEA',
  experience: '#4ECCA3',
  projects: '#4FC3F7',
  achievements: '#FFD700',
};

const SOURCE_LABELS = {
  courses: 'Courses',
  self_study: 'Self Study',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  achievements: 'Achievements',
};

const GOAL_COLOR = '#4FC3F7';
const MAX_SKILLS = 18;
const MAX_GOALS = 8;

function buildSankeyData(skillsWithSources = [], goals = []) {
  const sourceKeys = Object.keys(SOURCE_COLORS);

  const scoredSkills = skillsWithSources
    .filter(s => {
      const hasSources = sourceKeys.some(k => (s.sources?.[k]?.length || 0) > 0);
      const hasGoals = (s.related_goals?.length || 0) > 0;
      return hasSources || hasGoals;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SKILLS);

  if (scoredSkills.length === 0) return null;

  const linkedGoalNames = new Set();
  scoredSkills.forEach(s => (s.related_goals || []).forEach(g => linkedGoalNames.add(g)));

  const sortedGoals = goals
    .filter(g => linkedGoalNames.has(g.goal_name))
    .sort((a, b) => (b.skills_needed?.length || 0) - (a.skills_needed?.length || 0))
    .slice(0, MAX_GOALS);

  const activeGoalSet = new Set(sortedGoals.map(g => g.goal_name));

  const skillMap = {};
  scoredSkills.forEach(s => {
    skillMap[s.skill_name] = s;
  });

  const usedSources = new Set();
  const usedSkills = new Set();
  const usedGoals = new Set();

  const linkSet = new Set();

  const sourceLinks = [];
  scoredSkills.forEach(skill => {
    sourceKeys.forEach(srcKey => {
      const entries = skill.sources?.[srcKey];
      if (entries && entries.length > 0) {
        const value = entries.length;
        const linkId = `${srcKey}||${skill.skill_name}`;
        if (!linkSet.has(linkId)) {
          linkSet.add(linkId);
          sourceLinks.push({ source: srcKey, target: skill.skill_name, value });
          usedSources.add(srcKey);
          usedSkills.add(skill.skill_name);
        }
      }
    });
  });

  const goalLinks = [];
  scoredSkills.forEach(skill => {
    (skill.related_goals || []).forEach(gName => {
      if (activeGoalSet.has(gName)) {
        const value = skill.score;
        const linkId = `${skill.skill_name}||${gName}`;
        if (!linkSet.has(linkId)) {
          linkSet.add(linkId);
          goalLinks.push({ source: skill.skill_name, target: gName, value });
          usedSkills.add(skill.skill_name);
          usedGoals.add(gName);
        }
      }
    });
  });

  const sourceNodes = Array.from(usedSources).map(id => ({
    id,
    label: SOURCE_LABELS[id] || id,
    color: SOURCE_COLORS[id] || '#666',
  }));

  const skillNodes = Array.from(usedSkills).map(id => ({
    id,
    color: skillMap[id]?.color || '#4FC3F7',
  }));

  const goalNodes = Array.from(usedGoals).map(id => ({
    id,
    color: GOAL_COLOR,
  }));

  return {
    nodes: [...sourceNodes, ...skillNodes, ...goalNodes],
    links: [...sourceLinks, ...goalLinks],
  };
}

export default function SankeyChart({ skillsWithSources, goals }) {
  const data = useMemo(
    () => buildSankeyData(skillsWithSources, goals),
    [skillsWithSources, goals]
  );

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 860 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 860);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const sideMargin = isMobile ? 80 : 160;

  if (!data || data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="portfolio-sankey-empty">
        <p>No skill-source-goal connections available</p>
      </div>
    );
  }

  return (
    <div className="portfolio-sankey-wrapper">
      <ResponsiveSankey
        data={data}
        margin={{ top: 24, right: sideMargin, bottom: 24, left: sideMargin }}
        align="justify"
        colors={node => node.color || '#4FC3F7'}
        nodeOpacity={0.85}
        nodeHoverOpacity={1}
        nodeHoverOthersOpacity={0.25}
        nodeThickness={isMobile ? 12 : 18}
        nodeSpacing={isMobile ? 12 : 24}
        nodeBorderWidth={0}
        nodeBorderColor={{
          from: 'color',
          modifiers: [['darker', 0.3]],
        }}
        linkOpacity={0.35}
        linkHoverOpacity={0.7}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation={isMobile ? 'vertical' : 'horizontal'}
        labelPadding={isMobile ? 10 : 20}
        labelTextColor="#ffffff"
        animate
        motionConfig="gentle"
        theme={{
          text: {
            fontSize: isMobile ? 11 : 13,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
          },
          labels: {
            text: {
              fontSize: isMobile ? 10 : 13,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              textShadow: '0 1px 6px rgba(0,0,0,0.7), 0 0 12px rgba(0,0,0,0.4)',
            },
          },
          tooltip: {
            container: {
              background: 'rgba(13, 17, 38, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(79, 195, 247, 0.2)',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
              color: '#E8EEF8',
              padding: '10px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
          },
        }}
      />
    </div>
  );
}
