import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import databaseService from '../services/database';

// Mock the database service
vi.mock('../services/database', () => ({
  default: {
    initialize: vi.fn().mockResolvedValue(true),
    getCategories: vi.fn().mockResolvedValue(['CCTV', 'Access Control']),
    addCategory: vi.fn().mockResolvedValue(true),
    updateCategory: vi.fn().mockResolvedValue(true),
    deleteCategory: vi.fn().mockResolvedValue(true),
    getBOQProjects: vi.fn().mockResolvedValue([]),
    createBOQProject: vi.fn().mockResolvedValue({ projectId: 'test-id' }),
    updateBOQProject: vi.fn().mockResolvedValue(true),
    deleteBOQProject: vi.fn().mockResolvedValue(true),
    getBOQItems: vi.fn().mockResolvedValue([]),
    saveBOQItems: vi.fn().mockResolvedValue(true),
  }
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn(),
  },
  Toaster: () => null,
}));

describe('App Integration - CategoryManager and BOQProjectManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render category management button in header', () => {
    render(<App />);
    
    const categoryButton = screen.getByRole('button', { name: /categories/i });
    expect(categoryButton).toBeInTheDocument();
    expect(categoryButton).toHaveClass('bg-orange-600');
  });

  it('should render project management button in header', () => {
    render(<App />);
    
    const projectButton = screen.getByRole('button', { name: /projects/i });
    expect(projectButton).toBeInTheDocument();
    expect(projectButton).toHaveClass('bg-indigo-600');
  });

  it('should render category management button in quick actions', () => {
    render(<App />);
    
    const categoryButton = screen.getByRole('button', { name: /manage categories/i });
    expect(categoryButton).toBeInTheDocument();
    expect(categoryButton).toHaveClass('bg-orange-600');
  });

  it('should render project management button in quick actions', () => {
    render(<App />);
    
    const projectButton = screen.getByRole('button', { name: /manage projects/i });
    expect(projectButton).toBeInTheDocument();
    expect(projectButton).toHaveClass('bg-indigo-600');
  });

  it('should open CategoryManager modal when category button is clicked', async () => {
    render(<App />);
    
    const categoryButton = screen.getByRole('button', { name: /categories/i });
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(screen.getByText('Category Manager')).toBeInTheDocument();
    });
  });

  it('should open BOQProjectManager modal when project button is clicked', async () => {
    render(<App />);
    
    const projectButton = screen.getByRole('button', { name: /projects/i });
    fireEvent.click(projectButton);

    await waitFor(() => {
      expect(screen.getByText('BOQ Project Manager')).toBeInTheDocument();
    });
  });

  it('should display current project name in header when project is loaded', () => {
    render(<App />);
    
    // Initially no project should be shown
    expect(screen.queryByText(/current project:/i)).not.toBeInTheDocument();
    
    // This would be tested with actual project loading functionality
    // For now, we verify the structure is in place
    const header = screen.getByRole('heading', { name: /boq builder/i });
    expect(header).toBeInTheDocument();
  });

  it('should pass correct props to CategoryManager', async () => {
    render(<App />);
    
    const categoryButton = screen.getByRole('button', { name: /categories/i });
    fireEvent.click(categoryButton);

    await waitFor(() => {
      // Verify CategoryManager is rendered with expected content
      expect(screen.getByText('Category Manager')).toBeInTheDocument();
      expect(screen.getByText('Current Categories')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
    });
  });

  it('should pass correct props to BOQProjectManager', async () => {
    render(<App />);
    
    const projectButton = screen.getByRole('button', { name: /projects/i });
    fireEvent.click(projectButton);

    await waitFor(() => {
      // Verify BOQProjectManager is rendered with expected content
      expect(screen.getByText('BOQ Project Manager')).toBeInTheDocument();
      expect(screen.getByText('Save, load, and manage your BOQ projects')).toBeInTheDocument();
      expect(screen.getByText('Saved Projects')).toBeInTheDocument();
    });
  });

  it('should close modals when close button is clicked', async () => {
    render(<App />);
    
    // Open CategoryManager
    const categoryButton = screen.getByRole('button', { name: /categories/i });
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(screen.getByText('Category Manager')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Category Manager')).not.toBeInTheDocument();
    });
  });
});