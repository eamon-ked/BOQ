import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BulkOperations from '../BulkOperations';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BulkOperations', () => {
  const mockOnOperation = vi.fn();
  const selectedItems = ['item1', 'item2', 'item3'];
  
  const defaultOperations = [
    {
      id: 'addToBOQ',
      label: 'Add to BOQ',
      icon: () => <span>Plus</span>,
      color: 'bg-blue-600 hover:bg-blue-700',
      requiresConfirmation: false,
      batchSize: 50
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: () => <span>Trash</span>,
      color: 'bg-red-600 hover:bg-red-700',
      requiresConfirmation: true,
      batchSize: 50
    }
  ];

  beforeEach(() => {
    mockOnOperation.mockClear();
  });

  it('should render nothing when no items are selected', () => {
    const { container } = render(
      <BulkOperations
        selectedItems={[]}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should display selected items count', () => {
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('items selected')).toBeInTheDocument();
  });

  it('should render operation buttons', () => {
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    expect(screen.getByText('Add to BOQ')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should execute operation without confirmation', async () => {
    mockOnOperation.mockResolvedValue({ successful: selectedItems, failed: [] });
    
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    fireEvent.click(screen.getByText('Add to BOQ'));
    
    await waitFor(() => {
      expect(mockOnOperation).toHaveBeenCalledWith('addToBOQ', selectedItems);
    });
  });

  it('should show confirmation dialog for destructive operations', () => {
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    
    expect(screen.getByRole('button', { name: /Confirm Delete/i })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete 3 selected items/)).toBeInTheDocument();
  });

  it('should execute operation after confirmation', async () => {
    mockOnOperation.mockResolvedValue({ successful: selectedItems, failed: [] });
    
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Delete/i }));
    
    await waitFor(() => {
      expect(mockOnOperation).toHaveBeenCalledWith('delete', selectedItems);
    });
  });

  it('should cancel confirmation dialog', () => {
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    expect(mockOnOperation).not.toHaveBeenCalled();
  });

  it('should handle operation errors', async () => {
    const error = new Error('Operation failed');
    mockOnOperation.mockRejectedValue(error);
    
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    fireEvent.click(screen.getByText('Add to BOQ'));
    
    await waitFor(() => {
      expect(mockOnOperation).toHaveBeenCalledWith('addToBOQ', selectedItems);
    });
  });

  it('should show progress during operation', async () => {
    // Mock a slow operation
    mockOnOperation.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ successful: selectedItems, failed: [] }), 100))
    );
    
    render(
      <BulkOperations
        selectedItems={selectedItems}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
      />
    );
    
    fireEvent.click(screen.getByText('Add to BOQ'));
    
    expect(screen.getByText(/Processing/)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/Processing/)).not.toBeInTheDocument();
    });
  });

  it('should handle batch processing', async () => {
    const largeSelection = Array.from({ length: 150 }, (_, i) => `item${i}`);
    mockOnOperation.mockResolvedValue({ successful: largeSelection, failed: [] });
    
    render(
      <BulkOperations
        selectedItems={largeSelection}
        availableOperations={defaultOperations}
        onOperation={mockOnOperation}
        maxBatchSize={50}
      />
    );
    
    fireEvent.click(screen.getByText('Add to BOQ'));
    
    await waitFor(() => {
      expect(mockOnOperation).toHaveBeenCalled();
    });
  });

  it('should use default operations when none provided', () => {
    render(
      <BulkOperations
        selectedItems={selectedItems}
        onOperation={mockOnOperation}
      />
    );
    
    // Should render default operations
    expect(screen.getByText('Add to BOQ')).toBeInTheDocument();
    expect(screen.getByText('Bulk Edit')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});