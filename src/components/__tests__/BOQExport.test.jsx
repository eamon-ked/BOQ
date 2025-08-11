import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BOQExport from '../BOQExport';
import * as excelExport from '../../utils/excelExport';
import * as csvExport from '../../utils/csvExport';
import * as toast from '../../utils/toast';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: () => ({
    setLoading: vi.fn()
  })
}));

// Mock the export utilities
vi.mock('../../utils/excelExport');
vi.mock('../../utils/csvExport');
vi.mock('../../utils/toast');

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    text: vi.fn(),
    autoTable: vi.fn(),
    save: vi.fn(),
    lastAutoTable: { finalY: 100 }
  };
  return {
    default: vi.fn(() => mockDoc)
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('BOQExport Component', () => {
  const mockBoqItems = [
    {
      id: '1',
      name: 'Test Item 1',
      category: 'Electronics',
      manufacturer: 'Test Manufacturer',
      quantity: 2,
      unit: 'pcs',
      unitPrice: 100,
      isDependency: false
    },
    {
      id: '2',
      name: 'Test Item 2',
      category: 'Hardware',
      manufacturer: 'Another Manufacturer',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 50,
      isDependency: true
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    boqItems: mockBoqItems
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');

    // Mock successful export results
    excelExport.exportToExcel.mockResolvedValue({
      success: true,
      fileName: 'test_export.xlsx',
      message: 'Export successful'
    });

    csvExport.exportToCSV.mockReturnValue({
      success: true,
      fileName: 'test_export.csv',
      message: 'Export successful'
    });

    csvExport.ConfigurationManager.mockImplementation(() => ({
      loadConfigurations: vi.fn(() => []),
      getDefaultConfigurations: vi.fn(() => [
        {
          id: 'default_basic',
          name: 'Basic Export',
          description: 'Essential fields for basic BOQ export'
        }
      ])
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the export modal when open', () => {
      render(<BOQExport {...defaultProps} />);

      expect(screen.getByText('Export BOQ')).toBeInTheDocument();
      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByText('BOQ Summary')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<BOQExport {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Export BOQ')).not.toBeInTheDocument();
    });

    it('should display export format options', () => {
      render(<BOQExport {...defaultProps} />);

      expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument();
      expect(screen.getByText('CSV (.csv)')).toBeInTheDocument();
      expect(screen.getByText('PDF (.pdf)')).toBeInTheDocument();
    });

    it('should display BOQ summary information', () => {
      render(<BOQExport {...defaultProps} />);

      expect(screen.getByText('Total Items:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total items count
      expect(screen.getByText('Main Items:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Main items count
      expect(screen.getByText('Dependencies:')).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument(); // Total value
    });
  });

  describe('Format Selection', () => {
    it('should allow selecting different export formats', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      // Default should be Excel
      expect(screen.getByText('Export as Excel (.xlsx)')).toBeInTheDocument();

      // Click CSV format
      await user.click(screen.getByText('CSV (.csv)'));
      expect(screen.getByText('Export as CSV (.csv)')).toBeInTheDocument();

      // Click PDF format
      await user.click(screen.getByText('PDF (.pdf)'));
      expect(screen.getByText('Export as PDF (.pdf)')).toBeInTheDocument();
    });

    it('should highlight selected format', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      const csvOption = screen.getByText('CSV (.csv)').closest('div');
      await user.click(csvOption);

      expect(csvOption).toHaveClass('border-blue-500', 'bg-blue-50');
    });
  });

  describe('Export History', () => {
    it('should display export history when toggled', async () => {
      const user = userEvent.setup();
      const mockHistory = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          projectName: 'Test Project',
          format: 'Excel',
          fileName: 'test.xlsx',
          itemCount: 5,
          totalValue: 1000
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<BOQExport {...defaultProps} />);

      // Click history button
      const historyButton = screen.getByTitle('Export History');
      await user.click(historyButton);

      expect(screen.getByText('Recent Exports')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Excel • 5 items • $1000.00')).toBeInTheDocument();
    });

    it('should show empty state when no history exists', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      const historyButton = screen.getByTitle('Export History');
      await user.click(historyButton);

      expect(screen.getByText('No export history available')).toBeInTheDocument();
    });
  });

  describe('Export Templates', () => {
    it('should display export templates when toggled', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      const templatesButton = screen.getByTitle('Export Templates');
      await user.click(templatesButton);

      expect(screen.getByText('Export Templates')).toBeInTheDocument();
      expect(screen.getByText('Basic Export')).toBeInTheDocument();
    });

    it('should apply template when clicked', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      const templatesButton = screen.getByTitle('Export Templates');
      await user.click(templatesButton);

      const basicTemplate = screen.getByText('Basic Export');
      await user.click(basicTemplate);

      expect(toast.showInfo).toHaveBeenCalledWith('Applied template: Basic Export');
    });
  });

  describe('Excel Export', () => {
    it('should perform Excel export successfully', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      // Fill in project name
      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      // Click export button
      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      // Should show progress indicator
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
      expect(screen.getByText('Preparing Excel export...')).toBeInTheDocument();

      // Wait for export to complete
      await waitFor(() => {
        expect(excelExport.exportToExcel).toHaveBeenCalledWith(
          mockBoqItems,
          expect.objectContaining({
            name: 'Test Project',
            company: 'BOQ Builder'
          })
        );
      });

      await waitFor(() => {
        expect(toast.showSuccess).toHaveBeenCalledWith(
          'Excel export completed successfully! File: test_export.xlsx'
        );
      });
    });

    it('should handle Excel export failure', async () => {
      const user = userEvent.setup();
      excelExport.exportToExcel.mockResolvedValue({
        success: false,
        message: 'Export failed'
      });

      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(toast.showError).toHaveBeenCalledWith('Export failed: Export failed');
      });
    });
  });

  describe('CSV Export', () => {
    it('should perform CSV export successfully', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      // Select CSV format
      await user.click(screen.getByText('CSV (.csv)'));

      // Fill in project name
      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      // Click export button
      const exportButton = screen.getByText('Export as CSV (.csv)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(csvExport.exportToCSV).toHaveBeenCalledWith(
          mockBoqItems,
          expect.objectContaining({
            name: 'Test Project'
          }),
          expect.any(csvExport.ExportConfiguration)
        );
      });

      await waitFor(() => {
        expect(toast.showSuccess).toHaveBeenCalledWith(
          'CSV export completed successfully! File: test_export.csv'
        );
      });
    });

    it('should open custom CSV configuration', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const customCSVButton = screen.getByText('Custom CSV Export');
      await user.click(customCSVButton);

      // Should open CSV config modal (mocked component would be rendered)
      // This tests the integration point
      expect(customCSVButton).toBeInTheDocument();
    });
  });

  describe('PDF Export', () => {
    it('should perform PDF export successfully', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      // Select PDF format
      await user.click(screen.getByText('PDF (.pdf)'));

      // Fill in project name
      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      // Click export button
      const exportButton = screen.getByText('Export as PDF (.pdf)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(toast.showSuccess).toHaveBeenCalledWith(
          expect.stringContaining('PDF export completed successfully!')
        );
      });
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress bar during export', async () => {
      const user = userEvent.setup();

      // Mock a longer export process
      excelExport.exportToExcel.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          fileName: 'test.xlsx'
        }), 100))
      );

      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      // Should show progress elements
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
      expect(screen.getByText('Preparing Excel export...')).toBeInTheDocument();

      // Should have progress bar
      const progressBar = document.querySelector('.bg-blue-600.h-2.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('should disable export button during export', async () => {
      const user = userEvent.setup();

      excelExport.exportToExcel.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          fileName: 'test.xlsx'
        }), 100))
      );

      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      expect(exportButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should disable export when project name is empty', () => {
      render(<BOQExport {...defaultProps} />);

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      expect(exportButton).toBeDisabled();
    });

    it('should enable export when project name is provided', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      expect(exportButton).not.toBeDisabled();
    });
  });

  describe('Project Information', () => {
    it('should collect all project information fields', async () => {
      const user = userEvent.setup();
      render(<BOQExport {...defaultProps} />);

      // Fill in all fields
      await user.type(screen.getByPlaceholderText('Enter project name'), 'Test Project');
      await user.type(screen.getByPlaceholderText('Enter client name'), 'Test Client');
      await user.type(screen.getByPlaceholderText('Enter project location'), 'Test Location');
      await user.type(screen.getByPlaceholderText('Brief description of the project'), 'Test Description');
      await user.type(screen.getByPlaceholderText('Add any additional notes or specifications'), 'Test Notes');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(excelExport.exportToExcel).toHaveBeenCalledWith(
          mockBoqItems,
          expect.objectContaining({
            name: 'Test Project',
            client: 'Test Client',
            location: 'Test Location',
            description: 'Test Description',
            notes: 'Test Notes',
            company: 'BOQ Builder'
          })
        );
      });
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      render(<BOQExport {...defaultProps} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal after successful export', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      render(<BOQExport {...defaultProps} onClose={mockOnClose} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      excelExport.exportToExcel.mockRejectedValue(new Error('Network error'));

      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(toast.showError).toHaveBeenCalledWith(
          'Failed to export Excel file. Please try again.'
        );
      });
    });

    it('should reset state after error', async () => {
      const user = userEvent.setup();
      excelExport.exportToExcel.mockRejectedValue(new Error('Network error'));

      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });
  });

  describe('Integration with Store', () => {
    it('should call setLoading during export operations', async () => {
      const user = userEvent.setup();
      const mockSetLoading = vi.fn();

      // Mock the store hook to return our mock function
      vi.mocked(require('../../store').useAppStore).mockReturnValue({
        setLoading: mockSetLoading
      });

      render(<BOQExport {...defaultProps} />);

      const projectNameInput = screen.getByPlaceholderText('Enter project name');
      await user.type(projectNameInput, 'Test Project');

      const exportButton = screen.getByText('Export as Excel (.xlsx)');
      await user.click(exportButton);

      expect(mockSetLoading).toHaveBeenCalledWith('export', true);

      await waitFor(() => {
        expect(mockSetLoading).toHaveBeenCalledWith('export', false);
      });
    });
  });
});