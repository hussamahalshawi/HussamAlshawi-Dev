/**
 * main.jsx — Entry point of the React application
 * Wraps the app with StrictMode and BrowserRouter for routing support
 */
import { StrictMode }        from 'react';                    // Highlights potential issues in dev
import { createRoot }        from 'react-dom/client';         // React 18 concurrent root API
import { BrowserRouter }     from 'react-router-dom';         // Client-side routing provider
import './styles/index.css';                                  // Global design tokens and reset
import App                   from './App.jsx';                // Root application component

// Mount the React app into the #root div in index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>                                           {/* Wrap entire app with router context */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);