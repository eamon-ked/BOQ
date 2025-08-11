import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuccessToast, ErrorToast, InfoToast, WarningToast } from '../CustomToast';

describe('CustomToast Components', () => {
  describe('SuccessToast', () => {
    it('should render success message with correct styling', () => {
      const { container } = render(<SuccessToast message="Operation successful" />);
      
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
      
      // Check for success icon (checkmark)
      const successIcon = container.querySelector('svg');
      expect(successIcon).toHaveClass('text-green-600');
      
      // Check for green styling classes
      const toastContainer = screen.getByText('Operation successful').closest('div').parentElement;
      expect(toastContainer).toHaveClass('bg-green-50', 'border-green-200');
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<SuccessToast message="Test message" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not render dismiss button when onDismiss is not provided', () => {
      render(<SuccessToast message="Test message" />);
      
      expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
    });
  });

  describe('ErrorToast', () => {
    it('should render error message with correct styling', () => {
      const { container } = render(<ErrorToast message="Operation failed" />);
      
      expect(screen.getByText('Operation failed')).toBeInTheDocument();
      
      // Check for error icon (X mark)
      const errorIcon = container.querySelector('svg');
      expect(errorIcon).toHaveClass('text-red-600');
      
      // Check for red styling classes
      const toastContainer = screen.getByText('Operation failed').closest('div').parentElement;
      expect(toastContainer).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<ErrorToast message="Test error" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('InfoToast', () => {
    it('should render info message with correct styling', () => {
      const { container } = render(<InfoToast message="Information message" />);
      
      expect(screen.getByText('Information message')).toBeInTheDocument();
      
      // Check for info icon (i)
      const infoIcon = container.querySelector('svg');
      expect(infoIcon).toHaveClass('text-blue-600');
      
      // Check for blue styling classes
      const toastContainer = screen.getByText('Information message').closest('div').parentElement;
      expect(toastContainer).toHaveClass('bg-blue-50', 'border-blue-200');
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<InfoToast message="Test info" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('WarningToast', () => {
    it('should render warning message with correct styling', () => {
      const { container } = render(<WarningToast message="Warning message" />);
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      
      // Check for warning icon (triangle with exclamation)
      const warningIcon = container.querySelector('svg');
      expect(warningIcon).toHaveClass('text-yellow-600');
      
      // Check for yellow styling classes
      const toastContainer = screen.getByText('Warning message').closest('div').parentElement;
      expect(toastContainer).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<WarningToast message="Test warning" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Common Toast Behavior', () => {
    it('should render messages with proper text styling', () => {
      render(<SuccessToast message="Test message" />);
      
      const messageElement = screen.getByText('Test message');
      expect(messageElement).toHaveClass('text-sm', 'font-medium');
    });

    it('should have proper accessibility attributes', () => {
      const onDismiss = vi.fn();
      render(<SuccessToast message="Test message" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
    });

    it('should have consistent layout structure', () => {
      render(<InfoToast message="Test message" onDismiss={vi.fn()} />);
      
      const container = screen.getByText('Test message').closest('div').parentElement;
      expect(container).toHaveClass('flex', 'items-center', 'gap-3', 'p-3');
    });
  });
});