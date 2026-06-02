import { useRef, useEffect, useState, useMemo } from 'react';
import { CHART_ANIMATION, createChartObserver, getChartTheme } from '../../utils/chartConfig';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/charts/WordCloudChart.css';

const MIN_FONT = 11;
const MAX_FONT = 42;

export default function WordCloudChart({ words = [], maxCount, totalUnique, colorPalette = [] }) {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const DEFAULT_COLORS = isDark
    ? ['#C8FF57', '#00E5FF', '#9B7FEA', '#F5A623', '#F06292', '#4ECCA3', '#4FC3F7', '#FFD700']
    : ['#6aB537', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a', '#1a9e6e', '#1a8fc7', '#c49b00'];

  const palette = colorPalette.length > 0 ? colorPalette : DEFAULT_COLORS;

  const cloud = useMemo(() => {
    if (!words || words.length === 0) return [];
    const max = maxCount || Math.max(...words.map(w => w.count || 0), 1);
    return words.map((w, i) => ({
      text: w.text || w.skill || `word-${i}`,
      count: w.count || 1,
      weight: w.weight ?? Math.round((w.count / max) * 100),
      fontSize: MIN_FONT + ((w.weight ?? (w.count / max) * 100) / 100) * (MAX_FONT - MIN_FONT),
      color: palette[i % palette.length],
    }));
  }, [words, maxCount, palette]);

  useEffect(() => {
    return createChartObserver(wrapRef.current, () => setVisible(true), 0.1);
  }, []);

  if (cloud.length === 0) {
    return (
      <div className="wordcloud wordcloud--empty" ref={wrapRef}>
        <span>No word cloud data available</span>
      </div>
    );
  }

  return (
    <div className="wordcloud" ref={wrapRef}>
      <div className="wordcloud__cloud">
        {cloud.map((w, i) => (
          <span
            key={`${w.text}-${i}`}
            className="wordcloud__word"
            style={{
              fontSize: w.fontSize,
              color: w.color,
              opacity: visible ? 1 : 0,
              transition: visible
                ? `opacity ${CHART_ANIMATION.duration}ms ${CHART_ANIMATION.easing} ${i * 25}ms`
                : 'none',
              '--word-glow': w.color,
            }}
            title={`${w.text}: ${w.count} occurrences`}
          >
            {w.text}
          </span>
        ))}
      </div>
      <div className="wordcloud__footer">
        <span className="wordcloud__stat">{cloud.length} skills</span>
        {totalUnique !== undefined && (
          <span className="wordcloud__stat">{totalUnique} unique</span>
        )}
      </div>
    </div>
  );
}
