export default function PlaceholderSection({ title }) {
  return (
    <div
      className="section-placeholder"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        borderRadius: 'var(--r-lg)',
        background: 'var(--glass-medium)',
        color: 'var(--text-muted)',
        fontSize: '1.1rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        letterSpacing: '0.02em',
      }}
    >
      {title || 'Coming Soon'}
    </div>
  );
}
