import Papa from 'papaparse';

/**
 * CSV Export utility with field selection and customization options
 * Supports custom templates, field mapping, and export configuration
 */

// Default field configurations for different export types
export const DEFAULT_FIELD_CONFIGS = {
  basic: {
    name: 'Basic Export',
    description: 'Essential fields for basic BOQ export',
    fields: [
      { key: 'name', label: 'Item Name', enabled: true },
      { key: 'category', label: 'Category', enabled: true },
      { key: 'quantity', label: 'Quantity', enabled: true },
      { key: 'unit', label: 'Unit', enabled: true },
      { key: 'unitPrice', label: 'Unit Price', enabled: true },
      { key: 'lineTotal', label: 'Line Total', enabled: true }
    ]
  },
  detailed: {
    name: 'Detailed Export',
    description: 'Comprehensive export with all available fields',
    fields: [
      { key: 'name', label: 'Item Name', enabled: true },
      { key: 'category', label: 'Category', enabled: true },
      { key: 'manufacturer', label: 'Manufacturer', enabled: true },
      { key: 'partNumber', label: 'Part Number', enabled: true },
      { key: 'description', label: 'Description', enabled: true },
      { key: 'unit', label: 'Unit', enabled: true },
      { key: 'quantity', label: 'Quantity', enabled: true },
      { key: 'unitPrice', label: 'Unit Price', enabled: true },
      { key: 'unitNetPrice', label: 'Unit Net Price', enabled: true },
      { key: 'discount', label: 'Discount %', enabled: true },
      { key: 'lineTotal', label: 'Line Total', enabled: true },
      { key: 'serviceDuration', label: 'Service Duration (Months)', enabled: true },
      { key: 'estimatedLeadTime', label: 'Lead Time (Days)', enabled: true },
      { key: 'pricingTerm', label: 'Pricing Term', enabled: true },
      { key: 'isDependency', label: 'Is Dependency', enabled: true },
      { key: 'requiredBy', label: 'Required By', enabled: false }
    ]
  },
  financial: {
    name: 'Financial Export',
    description: 'Focus on pricing and financial information',
    fields: [
      { key: 'name', label: 'Item Name', enabled: true },
      { key: 'category', label: 'Category', enabled: true },
      { key: 'quantity', label: 'Quantity', enabled: true },
      { key: 'unit', label: 'Unit', enabled: true },
      { key: 'unitPrice', label: 'Unit Price', enabled: true },
      { key: 'unitNetPrice', label: 'Unit Net Price', enabled: true },
      { key: 'discount', label: 'Discount %', enabled: true },
      { key: 'lineTotal', label: 'Line Total', enabled: true },
      { key: 'pricingTerm', label: 'Pricing Term', enabled: true }
    ]
  },
  procurement: {
    name: 'Procurement Export',
    description: 'Optimized for procurement and sourcing',
    fields: [
      { key: 'name', label: 'Item Name', enabled: true },
      { key: 'manufacturer', label: 'Manufacturer', enabled: true },
      { key: 'partNumber', label: 'Part Number', enabled: true },
      { key: 'description', label: 'Description', enabled: true },
      { key: 'quantity', label: 'Quantity', enabled: true },
      { key: 'unit', label: 'Unit', enabled: true },
      { key: 'estimatedLeadTime', label: 'Lead Time (Days)', enabled: true },
      { key: 'unitPrice', label: 'Unit Price', enabled: true }
    ]
  }
};

/**
 * Available field definitions with data transformation functions
 */
export const AVAILABLE_FIELDS = {
  name: {
    label: 'Item Name',
    description: 'Name of the item',
    transform: (item) => item.isDependency ? `└─ ${item.name}` : item.name
  },
  category: {
    label: 'Category',
    description: 'Item category',
    transform: (item) => item.category || 'Uncategorized'
  },
  manufacturer: {
    label: 'Manufacturer',
    description: 'Item manufacturer',
    transform: (item) => item.manufacturer || 'N/A'
  },
  partNumber: {
    label: 'Part Number',
    description: 'Manufacturer part number',
    transform: (item) => item.partNumber || 'N/A'
  },
  description: {
    label: 'Description',
    description: 'Item description',
    transform: (item) => item.description || 'N/A'
  },
  unit: {
    label: 'Unit',
    description: 'Unit of measurement',
    transform: (item) => item.unit || 'Each'
  },
  quantity: {
    label: 'Quantity',
    description: 'Required quantity',
    transform: (item) => item.quantity
  },
  unitPrice: {
    label: 'Unit Price',
    description: 'Price per unit',
    transform: (item) => item.unitPrice.toFixed(2)
  },
  unitNetPrice: {
    label: 'Unit Net Price',
    description: 'Net price per unit after discount',
    transform: (item) => (item.unitNetPrice || item.unitPrice).toFixed(2)
  },
  discount: {
    label: 'Discount %',
    description: 'Discount percentage',
    transform: (item) => `${item.discount || 0}%`
  },
  lineTotal: {
    label: 'Line Total',
    description: 'Total price for this line item',
    transform: (item) => (item.quantity * (item.unitNetPrice || item.unitPrice)).toFixed(2)
  },
  serviceDuration: {
    label: 'Service Duration (Months)',
    description: 'Service duration in months',
    transform: (item) => item.serviceDuration || 0
  },
  estimatedLeadTime: {
    label: 'Lead Time (Days)',
    description: 'Estimated lead time in days',
    transform: (item) => item.estimatedLeadTime || 0
  },
  pricingTerm: {
    label: 'Pricing Term',
    description: 'Pricing term or basis',
    transform: (item) => item.pricingTerm || 'Each'
  },
  isDependency: {
    label: 'Is Dependency',
    description: 'Whether this item is a dependency',
    transform: (item) => item.isDependency ? 'Yes' : 'No'
  },
  requiredBy: {
    label: 'Required By',
    description: 'Parent item that requires this dependency',
    transform: (item) => item.requiredByName || 'N/A'
  }
};

/**
 * Export configuration class for managing export settings
 */
export class ExportConfiguration {
  constructor(config = {}) {
    this.id = config.id || Date.now().toString();
    this.name = config.name || 'Custom Export';
    this.description = config.description || '';
    this.fields = config.fields || DEFAULT_FIELD_CONFIGS.basic.fields;
    this.options = {
      includeHeaders: config.options?.includeHeaders ?? true,
      delimiter: config.options?.delimiter || ',',
      quote: config.options?.quote || '"',
      escape: config.options?.escape || '"',
      newline: config.options?.newline || '\r\n',
      skipEmptyLines: config.options?.skipEmptyLines ?? true,
      includeProjectInfo: config.options?.includeProjectInfo ?? true,
      includeSummary: config.options?.includeSummary ?? true,
      groupByCategory: config.options?.groupByCategory ?? false,
      sortBy: config.options?.sortBy || 'name',
      sortOrder: config.options?.sortOrder || 'asc'
    };
    this.createdAt = config.createdAt || new Date();
    this.updatedAt = config.updatedAt || new Date();
  }

  /**
   * Get enabled fields for export
   */
  getEnabledFields() {
    return this.fields.filter(field => field.enabled);
  }

  /**
   * Update field configuration
   */
  updateField(fieldKey, updates) {
    const fieldIndex = this.fields.findIndex(f => f.key === fieldKey);
    if (fieldIndex !== -1) {
      this.fields[fieldIndex] = { ...this.fields[fieldIndex], ...updates };
      this.updatedAt = new Date();
    }
  }

  /**
   * Clone configuration with new name
   */
  clone(newName) {
    return new ExportConfiguration({
      ...this,
      id: Date.now().toString(),
      name: newName,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    
    if (!this.name.trim()) {
      errors.push('Configuration name is required');
    }
    
    const enabledFields = this.getEnabledFields();
    if (enabledFields.length === 0) {
      errors.push('At least one field must be enabled');
    }
    
    // Validate field keys
    enabledFields.forEach(field => {
      if (!AVAILABLE_FIELDS[field.key]) {
        errors.push(`Unknown field: ${field.key}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Generate CSV preview data
 */
export const generateCSVPreview = (boqItems, config, maxRows = 5) => {
  const enabledFields = config.getEnabledFields();
  const headers = enabledFields.map(field => field.label);
  
  // Process items
  let processedItems = processItemsForExport(boqItems, config);
  
  // Limit for preview
  const previewItems = processedItems.slice(0, maxRows);
  
  // Generate preview data
  const previewData = previewItems.map(item => 
    enabledFields.map(field => AVAILABLE_FIELDS[field.key].transform(item))
  );
  
  return {
    headers,
    data: previewData,
    totalRows: processedItems.length,
    previewRows: previewData.length,
    hasMore: processedItems.length > maxRows
  };
};

/**
 * Process items according to export configuration
 */
const processItemsForExport = (boqItems, config) => {
  let processedItems = [...boqItems];
  
  // Sort items
  if (config.options.sortBy) {
    processedItems.sort((a, b) => {
      const aValue = a[config.options.sortBy] || '';
      const bValue = b[config.options.sortBy] || '';
      
      if (config.options.sortOrder === 'desc') {
        return bValue.toString().localeCompare(aValue.toString());
      }
      return aValue.toString().localeCompare(bValue.toString());
    });
  }
  
  // Group by category if requested
  if (config.options.groupByCategory) {
    processedItems.sort((a, b) => {
      const categoryCompare = (a.category || '').localeCompare(b.category || '');
      if (categoryCompare !== 0) return categoryCompare;
      
      // Secondary sort by name within category
      return (a.name || '').localeCompare(b.name || '');
    });
  }
  
  return processedItems;
};

/**
 * Export BOQ items to CSV with customization
 */
export const exportToCSV = (boqItems = [], projectInfo = {}, config = null) => {
  try {
    // Use default config if none provided
    if (!config) {
      config = new ExportConfiguration(DEFAULT_FIELD_CONFIGS.basic);
    }
    
    // Validate configuration
    const validation = config.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    const enabledFields = config.getEnabledFields();
    const headers = enabledFields.map(field => field.label);
    
    // Process items
    const processedItems = processItemsForExport(boqItems, config);
    
    // Build CSV data
    const csvData = [];
    
    // Add project info if enabled
    if (config.options.includeProjectInfo && projectInfo.name) {
      csvData.push(['Project Information']);
      csvData.push(['Project Name', projectInfo.name]);
      if (projectInfo.description) csvData.push(['Description', projectInfo.description]);
      if (projectInfo.client) csvData.push(['Client', projectInfo.client]);
      if (projectInfo.location) csvData.push(['Location', projectInfo.location]);
      csvData.push(['Export Date', new Date().toLocaleDateString()]);
      csvData.push(['Export Time', new Date().toLocaleTimeString()]);
      csvData.push([]); // Empty row
    }
    
    // Add summary if enabled
    if (config.options.includeSummary) {
      const totalValue = processedItems.reduce((sum, item) => 
        sum + (item.quantity * (item.unitNetPrice || item.unitPrice)), 0
      );
      const mainItems = processedItems.filter(item => !item.isDependency).length;
      const dependencyItems = processedItems.length - mainItems;
      
      csvData.push(['BOQ Summary']);
      csvData.push(['Total Items', processedItems.length]);
      csvData.push(['Main Items', mainItems]);
      csvData.push(['Dependency Items', dependencyItems]);
      csvData.push(['Total Value', `$${totalValue.toFixed(2)}`]);
      csvData.push([]); // Empty row
    }
    
    // Add headers
    if (config.options.includeHeaders) {
      csvData.push(headers);
    }
    
    // Add item data
    processedItems.forEach(item => {
      const row = enabledFields.map(field => 
        AVAILABLE_FIELDS[field.key].transform(item)
      );
      csvData.push(row);
    });
    
    // Generate CSV string
    const csvString = Papa.unparse(csvData, {
      delimiter: config.options.delimiter,
      quotes: true,
      quoteChar: config.options.quote,
      escapeChar: config.options.escape,
      newline: config.options.newline,
      skipEmptyLines: config.options.skipEmptyLines
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const projectName = projectInfo.name || 'BOQ_Export';
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${sanitizedName}_${timestamp}.csv`;
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      fileName,
      message: `CSV file exported successfully as ${fileName}`,
      recordCount: processedItems.length
    };
    
  } catch (error) {
    console.error('CSV export error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to export CSV file'
    };
  }
};

/**
 * Export configuration management
 */
export class ConfigurationManager {
  constructor() {
    this.storageKey = 'boq_csv_export_configs';
  }
  
  /**
   * Load all saved configurations
   */
  loadConfigurations() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return [];
      
      const configs = JSON.parse(saved);
      return configs.map(config => new ExportConfiguration(config));
    } catch (error) {
      console.error('Error loading configurations:', error);
      return [];
    }
  }
  
  /**
   * Save configuration
   */
  saveConfiguration(config) {
    try {
      const configs = this.loadConfigurations();
      const existingIndex = configs.findIndex(c => c.id === config.id);
      
      if (existingIndex !== -1) {
        configs[existingIndex] = config;
      } else {
        configs.push(config);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
      return { success: true };
    } catch (error) {
      console.error('Error saving configuration:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete configuration
   */
  deleteConfiguration(configId) {
    try {
      const configs = this.loadConfigurations();
      const filtered = configs.filter(c => c.id !== configId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return { success: true };
    } catch (error) {
      console.error('Error deleting configuration:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get default configurations
   */
  getDefaultConfigurations() {
    return Object.entries(DEFAULT_FIELD_CONFIGS).map(([key, config]) => 
      new ExportConfiguration({
        id: `default_${key}`,
        name: config.name,
        description: config.description,
        fields: config.fields
      })
    );
  }
}

export default {
  exportToCSV,
  ExportConfiguration,
  ConfigurationManager,
  DEFAULT_FIELD_CONFIGS,
  AVAILABLE_FIELDS,
  generateCSVPreview
};