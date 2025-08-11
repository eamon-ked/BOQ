import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportToCSV,
  ExportConfiguration,
  ConfigurationManager,
  DEFAULT_FIELD_CONFIGS,
  AVAILABLE_FIELDS,
  generateCSVPreview
} from '../csvExport';

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    unparse: vi.fn((data, options) => {
      // Simple CSV string generation for testing
      if (Array.isArray(data) && data.length > 0) {
        const headers = data[0];
        const rows = data.slice(1);
        return [
          headers.join(options?.delimiter || ','),
          ...rows.map(row => row.join(options?.delimiter || ','))
        ].join(options?.newline || '\n');
      }
      return '';
    })
  }
}));

// Mock DOM methods
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      setAttribute: vi.fn(),
      style: { visibility: '' },
      click: vi.fn()
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  }
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
});

Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(content, options) {
      this.content = content;
      this.options = options;
    }
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('CSV Export Utilities', () => {
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
      lineTotal: 190.00,
      serviceDuration: 12,
      estimatedLeadTime: 30,
      pricingTerm: 'Each',
      isDependency: false,
      requiredBy: null
    },
    {
      id: '2',
      name: 'Dependency Item',
      category: 'Accessories',
      manufacturer: 'Dep Manufacturer',
      partNumber: 'DM001',
      description: 'Dependency description',
      unit: 'Each',
      quantity: 1,
      unitPrice: 25.00,
      unitNetPrice: 25.00,
      discount: 0,
      lineTotal: 25.00,
      serviceDuration: 0,
      estimatedLeadTime: 7,
      pricingTerm: 'Each',
      isDependency: true,
      requiredBy: '1',
      requiredByName: 'Test Item 1'
    }
  ];

  const mockProjectInfo = {
    name: 'Test Project',
    description: 'Test project description',
    client: 'Test Client',
    location: 'Test Location',
    notes: 'Test notes',
    company: 'Test Company'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('ExportConfiguration', () => {
    it('should create configuration with default values', () => {
      const config = new ExportConfiguration();
      
      expect(config.name).toBe('Custom Export');
      expect(config.description).toBe('');
      expect(config.fields).toEqual(DEFAULT_FIELD_CONFIGS.basic.fields);
      expect(config.options.includeHeaders).toBe(true);
      expect(config.options.delimiter).toBe(',');
    });

    it('should create configuration with custom values', () => {
      const customConfig = {
        name: 'Custom Config',
        description: 'Custom description',
        fields: [{ key: 'name', label: 'Item Name', enabled: true }],
        options: {
          delimiter: ';',
          includeHeaders: false
        }
      };

      const config = new ExportConfiguration(customConfig);
      
      expect(config.name).toBe('Custom Config');
      expect(config.description).toBe('Custom description');
      expect(config.options.delimiter).toBe(';');
      expect(config.options.includeHeaders).toBe(false);
    });

    it('should get enabled fields correctly', () => {
      const config = new ExportConfiguration({
        fields: [
          { key: 'name', label: 'Name', enabled: true },
          { key: 'category', label: 'Category', enabled: false },
          { key: 'quantity', label: 'Quantity', enabled: true }
        ]
      });

      const enabledFields = config.getEnabledFields();
      
      expect(enabledFields).toHaveLength(2);
      expect(enabledFields[0].key).toBe('name');
      expect(enabledFields[1].key).toBe('quantity');
    });

    it('should update field configuration', () => {
      const config = new ExportConfiguration();
      const originalUpdatedAt = config.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        config.updateField('name', { enabled: false, label: 'Updated Name' });
        
        const nameField = config.fields.find(f => f.key === 'name');
        expect(nameField.enabled).toBe(false);
        expect(nameField.label).toBe('Updated Name');
        expect(config.updatedAt).not.toEqual(originalUpdatedAt);
      }, 10);
    });

    it('should clone configuration with new name', () => {
      const originalConfig = new ExportConfiguration({
        name: 'Original',
        description: 'Original description'
      });

      const clonedConfig = originalConfig.clone('Cloned Config');
      
      expect(clonedConfig.name).toBe('Cloned Config');
      expect(clonedConfig.description).toBe('Original description');
      expect(clonedConfig.id).not.toBe(originalConfig.id);
      expect(clonedConfig.fields).toEqual(originalConfig.fields);
    });

    it('should validate configuration correctly', () => {
      // Valid configuration
      const validConfig = new ExportConfiguration({
        name: 'Valid Config',
        fields: [{ key: 'name', label: 'Name', enabled: true }]
      });

      const validResult = validConfig.validate();
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid configuration - no name
      const invalidConfig1 = new ExportConfiguration({
        name: '',
        fields: [{ key: 'name', label: 'Name', enabled: true }]
      });

      const invalidResult1 = invalidConfig1.validate();
      expect(invalidResult1.isValid).toBe(false);
      expect(invalidResult1.errors).toContain('Configuration name is required');

      // Invalid configuration - no enabled fields
      const invalidConfig2 = new ExportConfiguration({
        name: 'Valid Name',
        fields: [{ key: 'name', label: 'Name', enabled: false }]
      });

      const invalidResult2 = invalidConfig2.validate();
      expect(invalidResult2.isValid).toBe(false);
      expect(invalidResult2.errors).toContain('At least one field must be enabled');
    });
  });

  describe('generateCSVPreview', () => {
    it('should generate preview data correctly', () => {
      const config = new ExportConfiguration({
        fields: [
          { key: 'name', label: 'Item Name', enabled: true },
          { key: 'quantity', label: 'Quantity', enabled: true },
          { key: 'unitPrice', label: 'Unit Price', enabled: true }
        ]
      });

      const preview = generateCSVPreview(mockBOQItems, config, 2);
      
      expect(preview.headers).toEqual(['Item Name', 'Quantity', 'Unit Price']);
      expect(preview.data).toHaveLength(2);
      expect(preview.totalRows).toBe(2);
      expect(preview.previewRows).toBe(2);
      expect(preview.hasMore).toBe(false);
      
      // Check first row data
      expect(preview.data[0]).toEqual(['Test Item 1', 2, '100.00']);
      expect(preview.data[1]).toEqual(['└─ Dependency Item', 1, '25.00']);
    });

    it('should limit preview rows correctly', () => {
      const config = new ExportConfiguration();
      const preview = generateCSVPreview(mockBOQItems, config, 1);
      
      expect(preview.previewRows).toBe(1);
      expect(preview.totalRows).toBe(2);
      expect(preview.hasMore).toBe(true);
    });
  });

  describe('exportToCSV', () => {
    it('should export CSV with basic configuration', () => {
      const config = new ExportConfiguration(DEFAULT_FIELD_CONFIGS.basic);
      const result = exportToCSV(mockBOQItems, mockProjectInfo, config);
      
      expect(result.success).toBe(true);
      expect(result.fileName).toContain('Test_Project');
      expect(result.fileName).toContain('.csv');
      expect(result.recordCount).toBe(2);
      expect(result.message).toContain('CSV file exported successfully');
    });

    it('should handle export with project info and summary', () => {
      const config = new ExportConfiguration({
        ...DEFAULT_FIELD_CONFIGS.basic,
        options: {
          includeProjectInfo: true,
          includeSummary: true,
          includeHeaders: true
        }
      });

      const result = exportToCSV(mockBOQItems, mockProjectInfo, config);
      
      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(2);
    });

    it('should handle export with custom delimiter', () => {
      const config = new ExportConfiguration({
        ...DEFAULT_FIELD_CONFIGS.basic,
        options: {
          delimiter: ';',
          includeHeaders: true
        }
      });

      const result = exportToCSV(mockBOQItems, mockProjectInfo, config);
      
      expect(result.success).toBe(true);
    });

    it('should handle export with grouping by category', () => {
      const config = new ExportConfiguration({
        ...DEFAULT_FIELD_CONFIGS.basic,
        options: {
          groupByCategory: true,
          sortBy: 'category'
        }
      });

      const result = exportToCSV(mockBOQItems, mockProjectInfo, config);
      
      expect(result.success).toBe(true);
    });

    it('should handle export errors gracefully', () => {
      // Invalid configuration
      const invalidConfig = new ExportConfiguration({
        name: '', // Invalid name
        fields: []
      });

      const result = exportToCSV(mockBOQItems, mockProjectInfo, invalidConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid configuration');
      expect(result.message).toBe('Failed to export CSV file');
    });

    it('should use default configuration when none provided', () => {
      const result = exportToCSV(mockBOQItems, mockProjectInfo);
      
      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(2);
    });

    it('should handle empty BOQ items', () => {
      const config = new ExportConfiguration(DEFAULT_FIELD_CONFIGS.basic);
      const result = exportToCSV([], mockProjectInfo, config);
      
      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(0);
    });
  });

  describe('ConfigurationManager', () => {
    let configManager;

    beforeEach(() => {
      configManager = new ConfigurationManager();
    });

    it('should load configurations from localStorage', () => {
      const savedConfigs = [
        {
          id: 'test1',
          name: 'Test Config 1',
          description: 'Test description',
          fields: DEFAULT_FIELD_CONFIGS.basic.fields
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfigs));
      
      const configs = configManager.loadConfigurations();
      
      expect(configs).toHaveLength(1);
      expect(configs[0]).toBeInstanceOf(ExportConfiguration);
      expect(configs[0].name).toBe('Test Config 1');
    });

    it('should return empty array when no saved configurations', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const configs = configManager.loadConfigurations();
      
      expect(configs).toEqual([]);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const configs = configManager.loadConfigurations();
      
      expect(configs).toEqual([]);
    });

    it('should save configuration successfully', () => {
      const config = new ExportConfiguration({
        name: 'Test Config',
        description: 'Test description'
      });

      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = configManager.saveConfiguration(config);
      
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'boq_csv_export_configs',
        expect.stringContaining('Test Config')
      );
    });

    it('should update existing configuration', () => {
      const existingConfig = new ExportConfiguration({
        id: 'existing',
        name: 'Existing Config'
      });

      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingConfig]));
      
      const updatedConfig = new ExportConfiguration({
        id: 'existing',
        name: 'Updated Config'
      });

      const result = configManager.saveConfiguration(updatedConfig);
      
      expect(result.success).toBe(true);
    });

    it('should handle save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const config = new ExportConfiguration();
      const result = configManager.saveConfiguration(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('localStorage error');
    });

    it('should delete configuration successfully', () => {
      const configs = [
        { id: 'config1', name: 'Config 1' },
        { id: 'config2', name: 'Config 2' }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(configs));
      
      const result = configManager.deleteConfiguration('config1');
      
      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'boq_csv_export_configs',
        expect.not.stringContaining('Config 1')
      );
    });

    it('should handle delete errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = configManager.deleteConfiguration('config1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('localStorage error');
    });

    it('should get default configurations', () => {
      const defaults = configManager.getDefaultConfigurations();
      
      expect(defaults.length).toBeGreaterThan(0);
      expect(defaults[0]).toBeInstanceOf(ExportConfiguration);
      expect(defaults[0].id).toContain('default_');
    });
  });

  describe('AVAILABLE_FIELDS transformations', () => {
    it('should transform name field correctly for dependencies', () => {
      const mainItem = { name: 'Main Item', isDependency: false };
      const depItem = { name: 'Dep Item', isDependency: true };
      
      expect(AVAILABLE_FIELDS.name.transform(mainItem)).toBe('Main Item');
      expect(AVAILABLE_FIELDS.name.transform(depItem)).toBe('└─ Dep Item');
    });

    it('should transform category field with fallback', () => {
      const itemWithCategory = { category: 'Electronics' };
      const itemWithoutCategory = {};
      
      expect(AVAILABLE_FIELDS.category.transform(itemWithCategory)).toBe('Electronics');
      expect(AVAILABLE_FIELDS.category.transform(itemWithoutCategory)).toBe('Uncategorized');
    });

    it('should transform price fields correctly', () => {
      const item = { unitPrice: 123.456, unitNetPrice: 120.00 };
      
      expect(AVAILABLE_FIELDS.unitPrice.transform(item)).toBe('123.46');
      expect(AVAILABLE_FIELDS.unitNetPrice.transform(item)).toBe('120.00');
    });

    it('should transform discount field correctly', () => {
      const itemWithDiscount = { discount: 15 };
      const itemWithoutDiscount = {};
      
      expect(AVAILABLE_FIELDS.discount.transform(itemWithDiscount)).toBe('15%');
      expect(AVAILABLE_FIELDS.discount.transform(itemWithoutDiscount)).toBe('0%');
    });

    it('should calculate line total correctly', () => {
      const item = { quantity: 3, unitPrice: 100, unitNetPrice: 95 };
      
      expect(AVAILABLE_FIELDS.lineTotal.transform(item)).toBe('285.00');
    });

    it('should transform boolean fields correctly', () => {
      const dependencyItem = { isDependency: true };
      const mainItem = { isDependency: false };
      
      expect(AVAILABLE_FIELDS.isDependency.transform(dependencyItem)).toBe('Yes');
      expect(AVAILABLE_FIELDS.isDependency.transform(mainItem)).toBe('No');
    });
  });

  describe('DEFAULT_FIELD_CONFIGS', () => {
    it('should have all required default configurations', () => {
      expect(DEFAULT_FIELD_CONFIGS.basic).toBeDefined();
      expect(DEFAULT_FIELD_CONFIGS.detailed).toBeDefined();
      expect(DEFAULT_FIELD_CONFIGS.financial).toBeDefined();
      expect(DEFAULT_FIELD_CONFIGS.procurement).toBeDefined();
    });

    it('should have valid field structures', () => {
      Object.values(DEFAULT_FIELD_CONFIGS).forEach(config => {
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        expect(Array.isArray(config.fields)).toBe(true);
        
        config.fields.forEach(field => {
          expect(field.key).toBeDefined();
          expect(field.label).toBeDefined();
          expect(typeof field.enabled).toBe('boolean');
          expect(AVAILABLE_FIELDS[field.key]).toBeDefined();
        });
      });
    });
  });
});