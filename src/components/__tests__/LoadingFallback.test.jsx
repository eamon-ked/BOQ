import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingFallback from '../LoadingFallback';

describe('LoadingFallback', () => {
  it('renders with default props', () => {
    render(<LoadingFallback />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Loading spinner' })).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingFallback message="Loading Component..." />);
    
    expect(screen.getByText('Loading Component...')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingFallback size="small" />);
    // Find the spinner container div
    let spinnerContainer = screen.getByText('Loading...').previousElementSibling;
    expect(spinnerContainer).toHaveClass('w-4', 'h-4');

    rerender(<LoadingFallback size="large" />);
    spinnerContainer = screen.getByText('Loading...').previousElementSibling;
    expect(spinnerContainer).toHaveClass('w-12', 'h-12');
  });

  it('renders as overlay when specified', () => {
    const { container } = render(<LoadingFallback overlay />);
    
    // Get the root container
    const rootContainer = container.firstChild;
    expect(rootContainer).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });

  it('renders without overlay by default', () => {
    const { container } = render(<LoadingFallback />);
    
    // Get the root container
    const rootContainer = container.firstChild;
    expect(rootContainer).not.toHaveClass('fixed');
    expect(rootContainer).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingFallback />);
    
    const spinner = screen.getByRole('img', { name: 'Loading spinner' });
    expect(spinner).toBeInTheDocument();
    
    const spinnerContainer = screen.getByText('Loading...').previousElementSibling;
    expect(spinnerContainer).toHaveClass('animate-spin');
  });
});