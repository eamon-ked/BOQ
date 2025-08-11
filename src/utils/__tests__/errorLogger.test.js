import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import errorLogger, { ErrorType, ErrorSeverity } from '../errorLogger';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)'
  }
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test'
  }
});

describe('ErrorLogger', () => {
  let consoleGroupSpy;
  let consoleGroupEndSpy;
  let consoleErrorSpy;
  let consoleLogSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Mock console methods
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();

    // Clear error logger logs
    errorLogger.clearLogs();
  });

  afterEach(() => {
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Basic Error Logging', () => {
    it('should log an error with basic information', () => {
      const testError = new Error('Test error message');
      const errorId = errorLogger.logError(testError);

      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');

      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        id: errorId,
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Test error message',
        name: 'Error'
      });
    });

    it('should include context information in error log', () => {
      const testError = new Error('Context test');
      const context = { userId: '123', action: 'test-action' };
      
      errorLogger.logError(testError, context);

      const logs = errorLogger.getLogs();
      expect(logs[0].context).toMatchObject(context);
    });

    it('should include environment information', () => {
      const testError = new Error('Environment test');
      
      errorLogger.logError(testError);

      const logs = errorLogger.getLogs();
      expect(logs[0]).toMatchObject({
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/test'
      });
    });

    it('should generate unique error IDs', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const id1 = errorLogger.logError(error1);
      const id2 = errorLogger.logError(error2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('Error Types and Severity', () => {
    it('should log component errors with correct type and severity', () => {
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'Component stack trace' };
      
      errorLogger.logComponentError(error, errorInfo, { component: 'TestComponent' });

      const logs = errorLogger.getLogs();
      expect(logs[0]).toMatchObject({
        type: ErrorType.COMPONENT_ERROR,
        severity: ErrorSeverity.HIGH,
        context: {
          component: 'TestComponent',
          componentStack: 'Component stack trace',
          errorBoundary: true
        }
      });
    });

    it('should log API errors with correct type', () => {
      const error = new Error('API request failed');
      const requestInfo = { url: '/api/test', method: 'POST' };
      
      errorLogger.logApiError(error, requestInfo);

      const logs = errorLogger.getLogs();
      expect(logs[0]).toMatchObject({
        type: ErrorType.API_ERROR,
        severity: ErrorSeverity.MEDIUM,
        context: {
          url: '/api/test',
          method: 'POST',
          api: true
        }
      });
    });

    it('should log database errors with correct type and severity', () => {
      const error = new Error('Database connection failed');
      const queryInfo = { query: 'SELECT * FROM items', table: 'items' };
      
      errorLogger.logDatabaseError(error, queryInfo);

      const logs = errorLogger.getLogs();
      expect(logs[0]).toMatchObject({
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH,
        context: {
          query: 'SELECT * FROM items',
          table: 'items',
          database: true
        }
      });
    });

    it('should log validation errors with correct type and severity', () => {
      const error = new Error('Validation failed');
      const validationInfo = { field: 'email', value: 'invalid-email' };
      
      errorLogger.logValidationError(error, validationInfo);

      const logs = errorLogger.getLogs();
      expect(logs[0]).toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        context: {
          field: 'email',
          value: 'invalid-email',
          validation: true
        }
      });
    });
  });

  describe('Console Logging', () => {
    it('should log to console in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev mode error');
      errorLogger.logError(error);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNKNOWN_ERROR'),
        expect.any(String)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('Message:', 'Dev mode error');
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log to console in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Prod mode error');
      errorLogger.logError(error);

      expect(consoleGroupSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should use different console styles for different severities', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      errorLogger.logError(new Error('Low'), {}, ErrorType.UNKNOWN_ERROR, ErrorSeverity.LOW);
      errorLogger.logError(new Error('Critical'), {}, ErrorType.UNKNOWN_ERROR, ErrorSeverity.CRITICAL);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LOW]'),
        expect.stringContaining('color: #f59e0b')
      );
      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL]'),
        expect.stringContaining('color: #991b1b')
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Log Management', () => {
    it('should retrieve logs by type', () => {
      errorLogger.logError(new Error('API Error'), {}, ErrorType.API_ERROR);
      errorLogger.logError(new Error('DB Error'), {}, ErrorType.DATABASE_ERROR);
      errorLogger.logError(new Error('Another API Error'), {}, ErrorType.API_ERROR);

      const apiLogs = errorLogger.getLogs(ErrorType.API_ERROR);
      expect(apiLogs).toHaveLength(2);
      expect(apiLogs.every(log => log.type === ErrorType.API_ERROR)).toBe(true);
    });

    it('should retrieve logs by severity', () => {
      errorLogger.logError(new Error('Low Error'), {}, ErrorType.UNKNOWN_ERROR, ErrorSeverity.LOW);
      errorLogger.logError(new Error('High Error'), {}, ErrorType.UNKNOWN_ERROR, ErrorSeverity.HIGH);
      errorLogger.logError(new Error('Another High Error'), {}, ErrorType.UNKNOWN_ERROR, ErrorSeverity.HIGH);

      const highLogs = errorLogger.getLogs(null, ErrorSeverity.HIGH);
      expect(highLogs).toHaveLength(2);
      expect(highLogs.every(log => log.severity === ErrorSeverity.HIGH)).toBe(true);
    });

    it('should filter logs by both type and severity', () => {
      errorLogger.logError(new Error('API Low'), {}, ErrorType.API_ERROR, ErrorSeverity.LOW);
      errorLogger.logError(new Error('API High'), {}, ErrorType.API_ERROR, ErrorSeverity.HIGH);
      errorLogger.logError(new Error('DB High'), {}, ErrorType.DATABASE_ERROR, ErrorSeverity.HIGH);

      const filteredLogs = errorLogger.getLogs(ErrorType.API_ERROR, ErrorSeverity.HIGH);
      expect(filteredLogs).toHaveLength(1);
      expect(filteredLogs[0].message).toBe('API High');
    });

    it('should clear all logs', () => {
      errorLogger.logError(new Error('Error 1'));
      errorLogger.logError(new Error('Error 2'));
      
      expect(errorLogger.getLogs()).toHaveLength(2);
      
      errorLogger.clearLogs();
      
      expect(errorLogger.getLogs()).toHaveLength(0);
    });

    it('should limit the number of stored logs', () => {
      // Log more than the maximum (100 errors)
      for (let i = 0; i < 105; i++) {
        errorLogger.logError(new Error(`Error ${i}`));
      }

      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(100);
      
      // Should keep the most recent logs
      expect(logs[0].message).toBe('Error 104');
      expect(logs[99].message).toBe('Error 5');
    });
  });

  describe('Statistics', () => {
    it('should provide error statistics', () => {
      errorLogger.logError(new Error('API 1'), {}, ErrorType.API_ERROR, ErrorSeverity.LOW);
      errorLogger.logError(new Error('API 2'), {}, ErrorType.API_ERROR, ErrorSeverity.HIGH);
      errorLogger.logError(new Error('DB 1'), {}, ErrorType.DATABASE_ERROR, ErrorSeverity.HIGH);

      const stats = errorLogger.getStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byType).toEqual({
        [ErrorType.API_ERROR]: 2,
        [ErrorType.DATABASE_ERROR]: 1
      });
      expect(stats.bySeverity).toEqual({
        [ErrorSeverity.LOW]: 1,
        [ErrorSeverity.HIGH]: 2
      });
      expect(stats.recent).toHaveLength(3);
    });

    it('should limit recent errors in stats', () => {
      // Log 10 errors
      for (let i = 0; i < 10; i++) {
        errorLogger.logError(new Error(`Error ${i}`));
      }

      const stats = errorLogger.getStats();
      expect(stats.recent).toHaveLength(5); // Should only return 5 most recent
    });
  });

  describe('Persistence', () => {
    it('should persist logs to localStorage', () => {
      const error = new Error('Persistent error');
      errorLogger.logError(error);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'boq-error-logs',
        expect.any(String)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });

      expect(() => {
        errorLogger.logError(new Error('Test error'));
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to persist error logs:',
        expect.any(Error)
      );
    });

    it('should load persisted logs on initialization', () => {
      const mockLogs = JSON.stringify([
        {
          id: 'test-id',
          message: 'Persisted error',
          timestamp: new Date().toISOString()
        }
      ]);
      
      localStorageMock.getItem.mockReturnValue(mockLogs);
      
      // Test loading directly on the existing instance
      errorLogger.loadPersistedLogs();
      
      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Persisted error');
    });

    it('should handle corrupted persisted logs gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        errorLogger.loadPersistedLogs();
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load persisted error logs:',
        expect.any(Error)
      );
    });
  });

  describe('User Session Tracking', () => {
    it('should generate and store session ID', () => {
      sessionStorageMock.getItem.mockReturnValue(null);
      
      errorLogger.logError(new Error('Session test'));

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'boq-session-id',
        expect.stringMatching(/^session_[a-z0-9]+$/)
      );
    });

    it('should reuse existing session ID', () => {
      const existingSessionId = 'session_existing123';
      sessionStorageMock.getItem.mockReturnValue(existingSessionId);
      
      errorLogger.logError(new Error('Reuse session test'));

      const logs = errorLogger.getLogs();
      expect(logs[0].userId).toBe(existingSessionId);
      
      // Should not create a new session ID
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});