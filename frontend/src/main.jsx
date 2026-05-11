/**
 * main.jsx — Entry point of the React application
 * Wraps the app with StrictMode, BrowserRouter, and ThemeProvider.
 * Order matters:
 *   ThemeProvider must wrap everything so all components
 *   can access the theme via useTheme() hook.
 */
import { StrictMode }       from 'react';                    // Highlights potential issues in dev
import { createRoot }       from 'react-dom/client';         // React 18 concurrent root API
import { BrowserRouter }    from 'react-router-dom';         // Client-side routing provider
import { ThemeProvider }    from './context/ThemeContext';   // Global dark/light mode provider
import './styles/index.css';                                 // Global design tokens and reset
import App                  from './App.jsx';                // Root application component

// Mount the React app into the #root div in index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ThemeProvider wraps everything — sets data-theme on <html> */}
    <ThemeProvider>
      {/* BrowserRouter provides routing context to all pages */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);