/**
 * Error logging utilities for development debugging
 */

export const ErrorType = {
  COMPONENT_ERROR: 'component_error',
  API_ERROR: 'api_error',
  DATABASE_ERROR: 'database_error',
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  UNKNOWN_ERROR: 'unknown_error'
};

export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Keep only the last 100 errors
  }

  /**
   * Log an error with context information
   * @param {Error} error - The error object
   * @param {Object} context - Additional context information
   * @param {string} type - Error type from ErrorType enum
   * @param {string} severity - Error severity from ErrorSeverity enum
   */
  logError(error, context = {}, type = ErrorType.UNKNOWN_ERROR, severity = ErrorSeverity.MEDIUM) {
    const errorLog = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      type,
      severity,
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    // Add to logs array
    this.logs.unshift(errorLog);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(errorLog);
    }

    // Store in localStorage for persistence
    this.persistLogs();

    return errorLog.id;
  }

  /**
   * Log a component error (typically from Error Boundary)
   * @param {Error} error - The error object
   * @param {Object} errorInfo - React error info with component stack
   * @param {Object} context - Additional context
   */
  logComponentError(error, errorInfo, context = {}) {
    return this.logError(
      error,
      {
        ...context,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      },
      ErrorType.COMPONENT_ERROR,
      ErrorSeverity.HIGH
    );
  }

  /**
   * Log an API error
   * @param {Error} error - The error object
   * @param {Object} requestInfo - Information about the failed request
   */
  logApiError(error, requestInfo = {}) {
    return this.logError(
      error,
      {
        ...requestInfo,
        api: true
      },
      ErrorType.API_ERROR,
      ErrorSeverity.MEDIUM
    );
  }

  /**
   * Log a database error
   * @param {Error} error - The error object
   * @param {Object} queryInfo - Information about the failed query
   */
  logDatabaseError(error, queryInfo = {}) {
    return this.logError(
      error,
      {
        ...queryInfo,
        database: true
      },
      ErrorType.DATABASE_ERROR,
      ErrorSeverity.HIGH
    );
  }

  /**
   * Log a validation error
   * @param {Error} error - The error object
   * @param {Object} validationInfo - Information about the validation failure
   */
  logValidationError(error, validationInfo = {}) {
    return this.logError(
      error,
      {
        ...validationInfo,
        validation: true
      },
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.LOW
    );
  }

  /**
   * Get all logged errors
   * @param {string} type - Optional filter by error type
   * @param {string} severity - Optional filter by severity
   * @returns {Array} Array of error logs
   */
  getLogs(type = null, severity = null) {
    let filteredLogs = [...this.logs];

    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    return filteredLogs;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.persistLogs();
  }

  /**
   * Get error statistics
   * @returns {Object} Statistics about logged errors
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byType: {},
      bySeverity: {},
      recent: this.logs.slice(0, 5)
    };

    this.logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Log error to console with formatting
   * @private
   */
  logToConsole(errorLog) {
    const style = this.getConsoleStyle(errorLog.severity);
    
    console.group(`%c🚨 ${errorLog.type.toUpperCase()} [${errorLog.severity.toUpperCase()}]`, style);
    console.error('Message:', errorLog.message);
    console.error('Stack:', errorLog.stack);
    console.log('Context:', errorLog.context);
    console.log('Timestamp:', errorLog.timestamp);
    console.log('Error ID:', errorLog.id);
    console.groupEnd();
  }

  /**
   * Get console styling based on severity
   * @private
   */
  getConsoleStyle(severity) {
    const styles = {
      [ErrorSeverity.LOW]: 'color: #f59e0b; font-weight: bold;',
      [ErrorSeverity.MEDIUM]: 'color: #f97316; font-weight: bold;',
      [ErrorSeverity.HIGH]: 'color: #dc2626; font-weight: bold;',
      [ErrorSeverity.CRITICAL]: 'color: #991b1b; font-weight: bold; background: #fef2f2; padding: 2px 4px;'
    };
    return styles[severity] || styles[ErrorSeverity.MEDIUM];
  }

  /**
   * Persist logs to localStorage
   * @private
   */
  persistLogs() {
    try {
      localStorage.setItem('boq-error-logs', JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Failed to persist error logs:', e);
    }
  }

  /**
   * Load logs from localStorage
   * @private
   */
  loadPersistedLogs() {
    try {
      const stored = localStorage.getItem('boq-error-logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load persisted error logs:', e);
      this.logs = [];
    }
  }

  /**
   * Get user ID for error tracking (placeholder implementation)
   * @private
   */
  getUserId() {
    // In a real app, this would return the actual user ID
    // For now, we'll use a session-based identifier
    let userId = sessionStorage.getItem('boq-session-id');
    if (!userId) {
      userId = 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('boq-session-id', userId);
    }
    return userId;
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Load persisted logs on initialization
errorLogger.loadPersistedLogs();

export default errorLogger;