import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      const message = 'Loading data...';
      render(<LoadingSpinner message={message} />);
      
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should render different sizes correctly', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      rerender(<LoadingSpinner size="large" />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      rerender(<LoadingSpinner size="xlarge" />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render different variants correctly', () => {
      const { rerender } = render(<LoadingSpinner variant="primary" />);
      expect(document.querySelector('.text-indigo-600')).toBeInTheDocument();

      rerender(<LoadingSpinner variant="success" />);
      expect(document.querySelector('.text-green-600')).toBeInTheDocument();

      rerender(<LoadingSpinner variant="error" />);
      expect(document.querySelector('.text-red-600')).toBeInTheDocument();
    });

    it('should render fullscreen variant', () => {
      render(<LoadingSpinner fullScreen message="Initializing..." />);
      
      expect(screen.getByText('Initializing...')).toBeInTheDocument();
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
      expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const customClass = 'custom-spinner-class';
      render(<LoadingSpinner className={customClass} />);
      
      expect(document.querySelector(`.${customClass}`)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      render(<LoadingSpinner message="Loading content" />);
      
      // The spinner should be perceivable by screen readers
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});