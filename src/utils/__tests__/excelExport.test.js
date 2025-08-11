import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as XLSX from 'xlsx';
import {
  exportToExcel,
  exportToExcelBuffer,
  createExcelWorkbook,
  validateExportData
} from '../excelExport';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({ Props: {}, Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
    aoa_to_sheet: vi.fn(() => ({})),
    encode_cell: vi.fn(({ r, c }) => `${String.fromCharCode(65 + c)}${r + 1}`)
  },
  writeFile: vi.fn(),
  write: vi.fn(() => new ArrayBuffer(8))
}));

describe('excelExport', () => {
  const mockBOQItems = [
    {
      id: '1',
      name: 'Test Item 1',
      category: 'Electronics',
      manufacturer: 'Test Manufacturer',
      partNumber: 'TM001',
      description: 'Test description',
      unit: 'Each',
      quantity: 2,
      unitPrice: 100.00,
      unitNetPrice: 95.00,
      discount: 5,
      serviceDuration: 12,
      estimatedLeadTime: 30,
      pricingTerm: 'Each',
      isDependency: false
    },
    {
      id: '2',
      name: 'Test Item 2',
      category: 'Hardware',
      manufacturer: 'Test Manufacturer 2',
      partNumber: 'TM002',
      description: 'Test description 2',
      unit: 'Each',
      quantity: 1,
      unitPrice: 200.00,
      unitNetPrice: 180.00,
      discount: 10,
      serviceDuration: 6,
      estimatedLeadTime: 15,
      pricingTerm: 'Each',
      isDependency: true,
      requiredByName: 'Test Item 1'
    }
  ];

  const mockProjectInfo = {
    name: 'Test Project',
    description: 'Test project description',
    client: 'Test Client',
    location: 'Test Location',
    company: 'Test Company',
    notes: 'Test project notes'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to ensure consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
    
    // Reset XLSX.writeFile mock to not throw by default
    XLSX.writeFile.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validateExportData', () => {
    it('should validate valid BOQ items', () => {
      const result = validateExportData(mockBOQItems);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for non-array input', () => {
      const result = validateExportData('not an array');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('BOQ items must be an array');
    });

    it('should return warning for empty array', () => {
      const result = validateExportData([]);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No items to export');
    });

    it('should validate item properties', () => {
      const invalidItems = [
        { name: '', quantity: 0, unitPrice: -10 },
        { name: 'Valid Item', quantity: 'invalid', unitPrice: 'invalid' }
      ];
      
      const result = validateExportData(invalidItems);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item at index 0 is missing a name');
      expect(result.errors).toContain('Item "" has invalid quantity');
      expect(result.errors).toContain('Item "" has invalid unit price');
      expect(result.errors).toContain('Item "Valid Item" has invalid quantity');
      expect(result.errors).toContain('Item "Valid Item" has invalid unit price');
    });
  });

  describe('createExcelWorkbook', () => {
    it('should create workbook with proper structure', () => {
      const mockWorkbook = { Props: {}, Sheets: {}, SheetNames: [] };
      XLSX.utils.book_new.mockReturnValue(mockWorkbook);
      XLSX.utils.aoa_to_sheet.mockReturnValue({});

      const workbook = createExcelWorkbook(mockBOQItems, mockProjectInfo);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3);
      
      // Check that worksheets were added with correct names
      const calls = XLSX.utils.book_append_sheet.mock.calls;
      expect(calls[0][2]).toBe('BOQ Summary');
      expect(calls[1][2]).toBe('Detailed Items');
      expect(calls[2][2]).toBe('Category Summary');
    });

    it('should set workbook properties correctly', () => {
      const mockWorkbook = { Props: {}, Sheets: {}, SheetNames: [] };
      XLSX.utils.book_new.mockReturnValue(mockWorkbook);

      createExcelWorkbook(mockBOQItems, mockProjectInfo);

      expect(mockWorkbook.Props.Title).toBe('BOQ Export - Test Project');
      expect(mockWorkbook.Props.Subject).toBe('Bill of Quantities');
      expect(mockWorkbook.Props.Author).toBe('BOQ Builder Application');
      expect(mockWorkbook.Props.Company).toBe('Test Company');
    });

    it('should handle empty project info', () => {
      const mockWorkbook = { Props: {}, Sheets: {}, SheetNames: [] };
      XLSX.utils.book_new.mockReturnValue(mockWorkbook);

      createExcelWorkbook(mockBOQItems, {});

      expect(mockWorkbook.Props.Title).toBe('BOQ Export - Untitled Project');
      expect(mockWorkbook.Props.Company).toBe('BOQ Builder');
    });
  });

  describe('exportToExcel', () => {
    it('should export successfully with valid data', () => {
      const result = exportToExcel(mockBOQItems, mockProjectInfo);

      expect(result.success).toBe(true);
      expect(result.fileName).toBe('Test_Project_2024-01-15.xlsx');
      expect(result.message).toContain('Excel file exported successfully');
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle export with default values', () => {
      const result = exportToExcel();

      expect(result.success).toBe(true);
      expect(result.fileName).toBe('BOQ_Export_2024-01-15.xlsx');
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should sanitize project name for filename', () => {
      const projectWithSpecialChars = {
        name: 'Project/With\\Special:Characters*?<>|'
      };

      const result = exportToExcel(mockBOQItems, projectWithSpecialChars);

      expect(result.fileName).toBe('Project_With_Special_Characters______2024-01-15.xlsx');
    });

    it('should handle export errors gracefully', () => {
      XLSX.writeFile.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const result = exportToExcel(mockBOQItems, mockProjectInfo);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Write failed');
      expect(result.message).toBe('Failed to export Excel file');
    });
  });

  describe('exportToExcelBuffer', () => {
    it('should return buffer for programmatic use', () => {
      const mockBuffer = new ArrayBuffer(8);
      XLSX.write.mockReturnValue(mockBuffer);

      const buffer = exportToExcelBuffer(mockBOQItems, mockProjectInfo);

      expect(buffer).toBe(mockBuffer);
      expect(XLSX.write).toHaveBeenCalledWith(
        expect.any(Object),
        { bookType: 'xlsx', type: 'array' }
      );
    });
  });

  describe('worksheet content validation', () => {
    it('should create summary worksheet with correct data structure', () => {
      let summaryData;
      XLSX.utils.aoa_to_sheet.mockImplementation((data) => {
        if (data[0][0] === 'BILL OF QUANTITIES - PROJECT SUMMARY') {
          summaryData = data;
        }
        return {};
      });

      createExcelWorkbook(mockBOQItems, mockProjectInfo);

      expect(summaryData).toBeDefined();
      expect(summaryData[0][0]).toBe('BILL OF QUANTITIES - PROJECT SUMMARY');
      expect(summaryData[3][1]).toBe('Test Project'); // Project name
      expect(summaryData[4][1]).toBe('Test project description'); // Description
      expect(summaryData[5][1]).toBe('Test Client'); // Client
    });

    it('should create detailed items worksheet with correct headers', () => {
      let detailedData;
      XLSX.utils.aoa_to_sheet.mockImplementation((data) => {
        if (data[0][0] === 'DETAILED ITEMS LIST') {
          detailedData = data;
        }
        return {};
      });

      createExcelWorkbook(mockBOQItems, mockProjectInfo);

      expect(detailedData).toBeDefined();
      expect(detailedData[0][0]).toBe('DETAILED ITEMS LIST');
      expect(detailedData[5]).toEqual([
        'Line #',
        'Item Name',
        'Category',
        'Manufacturer',
        'Part Number',
        'Description',
        'Unit',
        'Quantity',
        'Unit Price',
        'Unit Net Price',
        'Discount %',
        'Extended Price',
        'Service Duration (Months)',
        'Lead Time (Days)',
        'Pricing Term',
        'Type',
        'Required By'
      ]);
    });

    it('should create category summary worksheet with aggregated data', () => {
      let categoryData;
      XLSX.utils.aoa_to_sheet.mockImplementation((data) => {
        if (data[0][0] === 'CATEGORY SUMMARY') {
          categoryData = data;
        }
        return {};
      });

      createExcelWorkbook(mockBOQItems, mockProjectInfo);

      expect(categoryData).toBeDefined();
      expect(categoryData[0][0]).toBe('CATEGORY SUMMARY');
      expect(categoryData[5]).toEqual([
        'Category',
        'Item Count',
        'Total Quantity',
        'Total Value',
        'Avg Unit Price',
        'Percentage of Total'
      ]);
    });

    it('should handle dependency items correctly in detailed worksheet', () => {
      let detailedData;
      XLSX.utils.aoa_to_sheet.mockImplementation((data) => {
        if (data[0][0] === 'DETAILED ITEMS LIST') {
          detailedData = data;
        }
        return {};
      });

      createExcelWorkbook(mockBOQItems, mockProjectInfo);

      // Check that dependency item is marked with └─ prefix
      const dependencyRow = detailedData.find(row => 
        row[1] && row[1].includes('└─ Test Item 2')
      );
      expect(dependencyRow).toBeDefined();
      expect(dependencyRow[15]).toBe('Dependency'); // Type column
      expect(dependencyRow[16]).toBe('Test Item 1'); // Required By column
    });

    it('should calculate totals correctly', () => {
      let summaryData, detailedData;
      XLSX.utils.aoa_to_sheet.mockImplementation((data) => {
        if (data[0][0] === 'BILL OF QUANTITIES - PROJECT SUMMARY') {
          summaryData = data;
        } else if (data[0][0] === 'DETAILED ITEMS LIST') {
          detailedData = data;
        }
        return {};
      });

      createExcelWorkbook(mockBOQItems, mockProjectInfo);

      // Expected total: (2 * 95.00) + (1 * 180.00) = 370.00
      const expectedTotal = '$370.00';
      
      // Check summary total
      const summaryTotalRow = summaryData.find(row => 
        row[0] === 'Total Project Value:'
      );
      expect(summaryTotalRow[1]).toBe(expectedTotal);

      // Check detailed total
      const detailedTotalRow = detailedData.find(row => 
        row[10] === 'TOTAL:'
      );
      expect(detailedTotalRow[11]).toBe(expectedTotal);
    });
  });

  describe('edge cases', () => {
    it('should handle items without optional fields', () => {
      const minimalItems = [{
        id: '1',
        name: 'Minimal Item',
        quantity: 1,
        unitPrice: 50.00
      }];

      const result = exportToExcel(minimalItems, {});
      expect(result.success).toBe(true);
    });

    it('should handle empty BOQ items array', () => {
      const result = exportToExcel([], mockProjectInfo);
      expect(result.success).toBe(true);
    });

    it('should handle items with zero prices', () => {
      const freeItems = [{
        id: '1',
        name: 'Free Item',
        quantity: 1,
        unitPrice: 0.00
      }];

      const result = exportToExcel(freeItems, mockProjectInfo);
      expect(result.success).toBe(true);
    });
  });
});