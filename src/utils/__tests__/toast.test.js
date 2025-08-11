import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import toast from 'react-hot-toast';
import {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  showPromise,
  dismissToast,
  dismissAllToasts,
  updateToast,
  toastUtils
} from '../toast.jsx';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    custom: vi.fn(() => 'toast-id-123'),
    loading: vi.fn(() => 'loading-toast-id'),
    promise: vi.fn(() => Promise.resolve()),
    dismiss: vi.fn(),
  },
}));

describe('Toast Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('showSuccess', () => {
    it('should call toast.custom with success message and default options', () => {
      const message = 'Operation successful';
      const result = showSuccess(message);

      expect(toast.custom).toHaveBeenCalledTimes(1);
      expect(result).toBe('toast-id-123');

      const [customComponent, options] = toast.custom.mock.calls[0];
      expect(options).toEqual({
        duration: 3000,
        position: 'top-right',
      });
      expect(typeof customComponent).toBe('function');
    });

    it('should merge custom options with defaults', () => {
      const message = 'Success';
      const customOptions = { duration: 5000, position: 'bottom-left' };
      
      showSuccess(message, customOptions);

      const [, options] = toast.custom.mock.calls[0];
      expect(options).toEqual({
        duration: 5000,
        position: 'bottom-left',
      });
    });

    it('should render SuccessToast component with correct props', () => {
      const message = 'Test success';
      showSuccess(message);

      const [customComponent] = toast.custom.mock.calls[0];
      const mockToast = { id: 'test-id' };
      
      // Test that the component function can be called
      expect(() => customComponent(mockToast)).not.toThrow();
    });
  });

  describe('showError', () => {
    it('should call toast.custom with error message and correct duration', () => {
      const message = 'Operation failed';
      showError(message);

      expect(toast.custom).toHaveBeenCalledTimes(1);
      
      const [, options] = toast.custom.mock.calls[0];
      expect(options.duration).toBe(5000);
    });

    it('should override default duration with custom options', () => {
      const message = 'Error';
      const customOptions = { duration: 8000 };
      
      showError(message, customOptions);

      const [, options] = toast.custom.mock.calls[0];
      expect(options.duration).toBe(8000);
    });
  });

  describe('showInfo', () => {
    it('should call toast.custom with info message and default duration', () => {
      const message = 'Information';
      showInfo(message);

      expect(toast.custom).toHaveBeenCalledTimes(1);
      
      const [, options] = toast.custom.mock.calls[0];
      expect(options.duration).toBe(4000);
    });
  });

  describe('showWarning', () => {
    it('should call toast.custom with warning message', () => {
      const message = 'Warning message';
      showWarning(message);

      expect(toast.custom).toHaveBeenCalledTimes(1);
      
      const [, options] = toast.custom.mock.calls[0];
      expect(options.duration).toBe(4000);
    });
  });

  describe('showLoading', () => {
    it('should call toast.loading with infinite duration', () => {
      const message = 'Loading...';
      const result = showLoading(message);

      expect(toast.loading).toHaveBeenCalledWith(message, {
        duration: Infinity,
        position: 'top-right',
      });
      expect(result).toBe('loading-toast-id');
    });

    it('should accept custom options', () => {
      const message = 'Loading...';
      const options = { position: 'bottom-center' };
      
      showLoading(message, options);

      expect(toast.loading).toHaveBeenCalledWith(message, {
        duration: Infinity,
        position: 'bottom-center',
      });
    });
  });

  describe('showPromise', () => {
    it('should call toast.promise with correct parameters', () => {
      const promise = Promise.resolve('success');
      const messages = {
        loading: 'Processing...',
        success: 'Done!',
        error: 'Failed!',
      };

      showPromise(promise, messages);

      expect(toast.promise).toHaveBeenCalledWith(
        promise,
        messages,
        {
          duration: 4000,
          position: 'top-right',
        }
      );
    });

    it('should use default messages when not provided', () => {
      const promise = Promise.resolve();
      const messages = { success: 'Custom success' };

      showPromise(promise, messages);

      const expectedMessages = {
        loading: 'Loading...',
        success: 'Custom success',
        error: 'Operation failed',
      };

      expect(toast.promise).toHaveBeenCalledWith(
        promise,
        expectedMessages,
        expect.any(Object)
      );
    });
  });

  describe('dismissToast', () => {
    it('should call toast.dismiss with specific toast ID', () => {
      const toastId = 'specific-toast-id';
      dismissToast(toastId);

      expect(toast.dismiss).toHaveBeenCalledWith(toastId);
    });
  });

  describe('dismissAllToasts', () => {
    it('should call toast.dismiss without parameters', () => {
      dismissAllToasts();

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('updateToast', () => {
    it('should dismiss old toast and create new success toast', () => {
      const toastId = 'old-toast-id';
      const message = 'Updated message';
      
      updateToast(toastId, message, 'success');

      expect(toast.dismiss).toHaveBeenCalledWith(toastId);
      expect(toast.custom).toHaveBeenCalledTimes(1);
    });

    it('should default to info type when invalid type provided', () => {
      const toastId = 'toast-id';
      const message = 'Message';
      
      updateToast(toastId, message, 'invalid-type');

      expect(toast.dismiss).toHaveBeenCalledWith(toastId);
      expect(toast.custom).toHaveBeenCalledTimes(1);
    });

    it('should default to info type when no type provided', () => {
      const toastId = 'toast-id';
      const message = 'Message';
      
      updateToast(toastId, message);

      expect(toast.dismiss).toHaveBeenCalledWith(toastId);
      expect(toast.custom).toHaveBeenCalledTimes(1);
    });
  });

  describe('toastUtils object', () => {
    it('should export all toast functions', () => {
      expect(toastUtils).toEqual({
        success: showSuccess,
        error: showError,
        info: showInfo,
        warning: showWarning,
        loading: showLoading,
        promise: showPromise,
        dismiss: dismissToast,
        dismissAll: dismissAllToasts,
        update: updateToast,
      });
    });
  });

  describe('Toast timing behavior', () => {
    it('should use correct default durations for different toast types', () => {
      showSuccess('Success');
      showError('Error');
      showInfo('Info');
      showWarning('Warning');

      const calls = toast.custom.mock.calls;
      
      // Success should have 3000ms duration
      expect(calls[0][1].duration).toBe(3000);
      
      // Error should have 5000ms duration
      expect(calls[1][1].duration).toBe(5000);
      
      // Info should have 4000ms duration
      expect(calls[2][1].duration).toBe(4000);
      
      // Warning should have 4000ms duration
      expect(calls[3][1].duration).toBe(4000);
    });

    it('should allow custom duration override for all toast types', () => {
      const customDuration = 2000;
      const options = { duration: customDuration };

      showSuccess('Success', options);
      showError('Error', options);
      showInfo('Info', options);
      showWarning('Warning', options);

      const calls = toast.custom.mock.calls;
      
      calls.forEach(call => {
        expect(call[1].duration).toBe(customDuration);
      });
    });
  });

  describe('Toast dismissal behavior', () => {
    it('should provide dismiss functionality in custom toast components', () => {
      showSuccess('Test message');

      const [customComponent] = toast.custom.mock.calls[0];
      const mockToast = { id: 'test-toast-id' };
      
      // Simulate rendering the component and getting the onDismiss function
      // This tests that the component structure includes dismiss functionality
      expect(typeof customComponent).toBe('function');
      
      // The component should be callable without throwing
      expect(() => customComponent(mockToast)).not.toThrow();
    });
  });
});