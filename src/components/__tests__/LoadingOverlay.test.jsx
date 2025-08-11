import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingOverlay from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  describe('rendering', () => {
    it('should render children without overlay when not loading', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Child content')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should render children with overlay when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Child content')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render custom loading message', () => {
      const customMessage = 'Processing data...';
      render(
        <LoadingOverlay isLoading={true} message={customMessage}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should apply custom className to container', () => {
      const customClass = 'custom-container-class';
      render(
        <LoadingOverlay className={customClass} isLoading={false}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      expect(document.querySelector(`.${customClass}`)).toBeInTheDocument();
    });

    it('should apply custom overlayClassName to overlay', () => {
      const customOverlayClass = 'custom-overlay-class';
      render(
        <LoadingOverlay 
          isLoading={true} 
          overlayClassName={customOverlayClass}
        >
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      expect(document.querySelector(`.${customOverlayClass}`)).toBeInTheDocument();
    });
  });

  describe('overlay behavior', () => {
    it('should show overlay with backdrop blur by default', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('should not show backdrop blur when blur is false', () => {
      render(
        <LoadingOverlay isLoading={true} blur={false}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).not.toHaveClass('backdrop-blur-sm');
    });

    it('should position overlay correctly', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).toHaveClass('absolute', 'inset-0', 'z-10');
    });
  });

  describe('spinner configuration', () => {
    it('should render spinner with default size', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render spinner with custom size', () => {
      render(
        <LoadingOverlay isLoading={true} spinnerSize="large">
          <div>Child content</div>
        </LoadingOverlay>
      );
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should maintain proper DOM structure for screen readers', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div role="main">Main content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not interfere with child accessibility when not loading', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <button>Clickable button</button>
        </LoadingOverlay>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  describe('layout', () => {
    it('should maintain relative positioning for container', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      const container = document.querySelector('.relative');
      expect(container).toBeInTheDocument();
    });

    it('should center loading content', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });
});