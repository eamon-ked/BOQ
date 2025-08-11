import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import errorLogger from './utils/errorLogger.js'
import './index.css'

// Global error handler for the entire app
const handleGlobalError = (error, errorInfo) => {
  errorLogger.logComponentError(error, errorInfo, {
    component: 'Root',
    level: 'global'
  });
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary onError={handleGlobalError}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)