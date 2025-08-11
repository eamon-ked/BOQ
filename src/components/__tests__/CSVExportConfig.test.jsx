import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CSVExportConfig from '../CSVExportConfig';
import { ExportConfiguration, DEFAULT_FIELD_CONFIGS } from '../../utils/csvExport';

// Mock the csvExport utility
vi.mock('../../utils/csvExport', () => ({
    ExportConfiguration: vi.fn(),
    DEFAULT_FIELD_CONFIGS: {
        basic: {
            name: 'Basic Export',
            fields: [
                { key: 'name', label: 'Item Name', enabled: true },
                { key: 'quantity', label: 'Quantity', enabled: true }
            ]
        }
    },
    AVAILABLE_FIELDS: {
        name: { label: 'Item Name', description: 'Name of the item' },
        quantity: { label: 'Quantity', description: 'Required quantity' }
    }
}));

describe('CSVExportConfig', () => {
    const mockProps = {
        isOpen: true,
        onClose: vi.fn(),
        onExport: vi.fn(),
        boqItems: [
            { id: '1', name: 'Test Item', quantity: 2, unitPrice: 100 }
        ],
        projectInfo: { name: 'Test Project' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render when open', () => {
        render(<CSVExportConfig {...mockProps} />);
        expect(screen.getByText('CSV Export Configuration')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
        render(<CSVExportConfig {...mockProps} isOpen={false} />);
        expect(screen.queryByText('CSV Export Configuration')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
        render(<CSVExportConfig {...mockProps} />);
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onExport when export button is clicked', async () => {
        render(<CSVExportConfig {...mockProps} />);
        const exportButton = screen.getByRole('button', { name: /export/i });
        fireEvent.click(exportButton);

        await waitFor(() => {
            expect(mockProps.onExport).toHaveBeenCalled();
        });
    });
});