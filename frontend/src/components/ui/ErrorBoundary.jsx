import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          background: '#0b0f1e',
          color: '#e8eef8',
          fontFamily: "'DM Sans', sans-serif",
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#f06292' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#8ba3c4', marginBottom: '24px', maxWidth: '400px' }}>
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(79,195,247,0.3)',
              background: 'rgba(79,195,247,0.1)',
              color: '#4fc3f7',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
