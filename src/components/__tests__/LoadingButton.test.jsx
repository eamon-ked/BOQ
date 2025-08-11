import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoadingButton from '../LoadingButton';

describe('LoadingButton', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<LoadingButton>Click me</LoadingButton>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should render loading state correctly', () => {
      render(
        <LoadingButton isLoading loadingText="Processing...">
          Submit
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should render different variants correctly', () => {
      const { rerender } = render(
        <LoadingButton variant="primary">Primary</LoadingButton>
      );
      expect(screen.getByRole('button')).toHaveClass('from-blue-500');

      rerender(<LoadingButton variant="success">Success</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('from-green-500');

      rerender(<LoadingButton variant="danger">Danger</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('from-red-500');
    });

    it('should render different sizes correctly', () => {
      const { rerender } = render(
        <LoadingButton size="small">Small</LoadingButton>
      );
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

      rerender(<LoadingButton size="large">Large</LoadingButton>);
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base');
    });

    it('should apply custom className', () => {
      const customClass = 'custom-button-class';
      render(
        <LoadingButton className={customClass}>Custom</LoadingButton>
      );
      
      expect(screen.getByRole('button')).toHaveClass(customClass);
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked and not loading', () => {
      const handleClick = vi.fn();
      render(
        <LoadingButton onClick={handleClick}>Click me</LoadingButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <LoadingButton isLoading onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <LoadingButton disabled onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should be properly disabled when loading', () => {
      render(<LoadingButton isLoading>Loading Button</LoadingButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
    });

    it('should be properly disabled when disabled prop is true', () => {
      render(<LoadingButton disabled>Disabled Button</LoadingButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
    });

    it('should maintain focus management', () => {
      render(<LoadingButton>Focusable Button</LoadingButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('loading states', () => {
    it('should show spinner when loading', () => {
      render(<LoadingButton isLoading>Submit</LoadingButton>);
      
      // Check for spinner (Loader2 icon with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should use default loading text when not provided', () => {
      render(<LoadingButton isLoading>Submit</LoadingButton>);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should use custom loading text when provided', () => {
      render(
        <LoadingButton isLoading loadingText="Saving...">
          Save
        </LoadingButton>
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });
});