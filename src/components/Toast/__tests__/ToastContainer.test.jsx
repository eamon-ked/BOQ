import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ToastContainer from '../ToastContainer';
import { Toaster } from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  Toaster: vi.fn(() => <div data-testid="toaster" />),
}));

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render Toaster component', () => {
    render(<ToastContainer />);
    
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(Toaster).toHaveBeenCalledTimes(1);
  });

  it('should configure Toaster with correct default options', () => {
    render(<ToastContainer />);
    
    expect(Toaster).toHaveBeenCalledWith(
      expect.objectContaining({
        position: 'top-right',
        reverseOrder: false,
        gutter: 8,
        containerClassName: '',
        containerStyle: {},
        toastOptions: expect.objectContaining({
          duration: 4000,
          style: expect.objectContaining({
            background: '#fff',
            color: '#333',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
          }),
          success: expect.objectContaining({
            duration: 3000,
            style: expect.objectContaining({
              background: '#f0f9ff',
              color: '#0c4a6e',
              border: '1px solid #7dd3fc',
            }),
          }),
          error: expect.objectContaining({
            duration: 5000,
            style: expect.objectContaining({
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
            }),
          }),
          loading: expect.objectContaining({
            duration: Infinity,
            style: expect.objectContaining({
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #cbd5e1',
            }),
          }),
        }),
      }),
      {}
    );
  });

  it('should have correct success toast configuration', () => {
    render(<ToastContainer />);
    
    const toasterCall = Toaster.mock.calls[0][0];
    const successConfig = toasterCall.toastOptions.success;
    
    expect(successConfig.duration).toBe(3000);
    expect(successConfig.style.background).toBe('#f0f9ff');
    expect(successConfig.style.color).toBe('#0c4a6e');
    expect(successConfig.iconTheme.primary).toBe('#0ea5e9');
  });

  it('should have correct error toast configuration', () => {
    render(<ToastContainer />);
    
    const toasterCall = Toaster.mock.calls[0][0];
    const errorConfig = toasterCall.toastOptions.error;
    
    expect(errorConfig.duration).toBe(5000);
    expect(errorConfig.style.background).toBe('#fef2f2');
    expect(errorConfig.style.color).toBe('#991b1b');
    expect(errorConfig.iconTheme.primary).toBe('#ef4444');
  });

  it('should have correct loading toast configuration', () => {
    render(<ToastContainer />);
    
    const toasterCall = Toaster.mock.calls[0][0];
    const loadingConfig = toasterCall.toastOptions.loading;
    
    expect(loadingConfig.duration).toBe(Infinity);
    expect(loadingConfig.style.background).toBe('#f8fafc');
    expect(loadingConfig.style.color).toBe('#475569');
    expect(loadingConfig.iconTheme.primary).toBe('#64748b');
  });
});