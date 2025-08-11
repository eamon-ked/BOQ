import * as XLSX from 'xlsx';

/**
 * Enhanced Excel export utility with multiple worksheet support
 * Supports BOQ summary, detailed items, and category summary sheets
 * with professional formatting and metadata
 */

/**
 * Creates a professionally formatted Excel workbook with multiple worksheets
 * @param {Array} boqItems - Array of BOQ items
 * @param {Object} projectInfo - Project metadata
 * @param {Object} options - Export options and customization
 * @returns {Object} Workbook object
 */
export const createExcelWorkbook = (boqItems = [], projectInfo = {}, options = {}) => {
  const wb = XLSX.utils.book_new();
  
  // Set workbook properties
  wb.Props = {
    Title: `BOQ Export - ${projectInfo.name || 'Untitled Project'}`,
    Subject: 'Bill of Quantities',
    Author: 'BOQ Builder Application',
    CreatedDate: new Date(),
    Company: projectInfo.company || 'BOQ Builder',
    Application: 'BOQ Builder v1.0'
  };

  // Create worksheets
  const summaryWs = createSummaryWorksheet(boqItems, projectInfo, options);
  const detailedWs = createDetailedItemsWorksheet(boqItems, projectInfo, options);
  const categoryWs = createCategorySummaryWorksheet(boqItems, projectInfo, options);

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(wb, summaryWs, 'BOQ Summary');
  XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed Items');
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Category Summary');

  return wb;
};

/**
 * Creates the BOQ Summary worksheet
 */
const createSummaryWorksheet = (boqItems, projectInfo, options) => {
  const totalValue = boqItems.reduce((sum, item) => sum + (item.quantity * (item.unitNetPrice || item.unitPrice)), 0);
  const totalItems = boqItems.length;
  const uniqueCategories = [...new Set(boqItems.map(item => item.category))].length;
  const dependencyItems = boqItems.filter(item => item.isDependency).length;
  const mainItems = totalItems - dependencyItems;

  const summaryData = [
    ['BILL OF QUANTITIES - PROJECT SUMMARY'],
    [''],
    ['Project Information'],
    ['Project Name:', projectInfo.name || 'Untitled Project'],
    ['Description:', projectInfo.description || 'N/A'],
    ['Client:', projectInfo.client || 'N/A'],
    ['Location:', projectInfo.location || 'N/A'],
    ['Export Date:', new Date().toLocaleDateString()],
    ['Export Time:', new Date().toLocaleTimeString()],
    [''],
    ['BOQ Statistics'],
    ['Total Items:', totalItems],
    ['Main Items:', mainItems],
    ['Dependency Items:', dependencyItems],
    ['Unique Categories:', uniqueCategories],
    [''],
    ['Financial Summary'],
    ['Total Project Value:', `$${totalValue.toFixed(2)}`],
    ['Average Item Value:', totalItems > 0 ? `$${(totalValue / totalItems).toFixed(2)}` : '$0.00'],
    [''],
    ['Category Breakdown']
  ];

  // Add category breakdown
  const categoryTotals = boqItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    const itemTotal = item.quantity * (item.unitNetPrice || item.unitPrice);
    
    if (!acc[category]) {
      acc[category] = { count: 0, total: 0 };
    }
    acc[category].count += 1;
    acc[category].total += itemTotal;
    
    return acc;
  }, {});

  summaryData.push(['Category', 'Item Count', 'Total Value', 'Percentage']);
  
  Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b.total - a.total)
    .forEach(([category, data]) => {
      const percentage = totalValue > 0 ? ((data.total / totalValue) * 100).toFixed(1) : '0.0';
      summaryData.push([
        category,
        data.count,
        `$${data.total.toFixed(2)}`,
        `${percentage}%`
      ]);
    });

  // Add notes if provided
  if (projectInfo.notes) {
    summaryData.push([''], ['Project Notes'], [projectInfo.notes]);
  }

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Apply formatting
  applySummaryFormatting(ws, summaryData.length);
  
  return ws;
};

/**
 * Creates the Detailed Items worksheet
 */
const createDetailedItemsWorksheet = (boqItems, projectInfo, options) => {
  const headers = [
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
  ];

  const detailedData = [
    ['DETAILED ITEMS LIST'],
    [''],
    ['Project:', projectInfo.name || 'Untitled Project'],
    ['Generated:', new Date().toLocaleString()],
    [''],
    headers
  ];

  // Add item data
  boqItems.forEach((item, index) => {
    const unitNetPrice = item.unitNetPrice || item.unitPrice;
    const extendedPrice = item.quantity * unitNetPrice;
    const discountPercent = item.discount || 0;
    
    detailedData.push([
      index + 1,
      item.isDependency ? `└─ ${item.name}` : item.name,
      item.category || 'Uncategorized',
      item.manufacturer || 'N/A',
      item.partNumber || 'N/A',
      item.description || 'N/A',
      item.unit || 'Each',
      item.quantity,
      `$${item.unitPrice.toFixed(2)}`,
      `$${unitNetPrice.toFixed(2)}`,
      `${discountPercent}%`,
      `$${extendedPrice.toFixed(2)}`,
      item.serviceDuration || 0,
      item.estimatedLeadTime || 0,
      item.pricingTerm || 'Each',
      item.isDependency ? 'Dependency' : 'Main Item',
      item.requiredByName || 'N/A'
    ]);
  });

  // Add totals
  const totalValue = boqItems.reduce((sum, item) => sum + (item.quantity * (item.unitNetPrice || item.unitPrice)), 0);
  detailedData.push(
    [''],
    ['', '', '', '', '', '', '', '', '', '', 'TOTAL:', `$${totalValue.toFixed(2)}`]
  );

  const ws = XLSX.utils.aoa_to_sheet(detailedData);
  
  // Apply formatting
  applyDetailedFormatting(ws, detailedData.length, headers.length);
  
  return ws;
};

/**
 * Creates the Category Summary worksheet
 */
const createCategorySummaryWorksheet = (boqItems, projectInfo, options) => {
  const categoryData = [
    ['CATEGORY SUMMARY'],
    [''],
    ['Project:', projectInfo.name || 'Untitled Project'],
    ['Generated:', new Date().toLocaleString()],
    [''],
    ['Category', 'Item Count', 'Total Quantity', 'Total Value', 'Avg Unit Price', 'Percentage of Total']
  ];

  // Calculate category statistics
  const categoryStats = boqItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    const itemTotal = item.quantity * (item.unitNetPrice || item.unitPrice);
    
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        totalQuantity: 0,
        totalValue: 0,
        items: []
      };
    }
    
    acc[category].count += 1;
    acc[category].totalQuantity += item.quantity;
    acc[category].totalValue += itemTotal;
    acc[category].items.push(item);
    
    return acc;
  }, {});

  const grandTotal = Object.values(categoryStats).reduce((sum, cat) => sum + cat.totalValue, 0);

  // Add category rows
  Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.totalValue - a.totalValue)
    .forEach(([category, stats]) => {
      const avgUnitPrice = stats.totalQuantity > 0 ? stats.totalValue / stats.totalQuantity : 0;
      const percentage = grandTotal > 0 ? ((stats.totalValue / grandTotal) * 100).toFixed(1) : '0.0';
      
      categoryData.push([
        category,
        stats.count,
        stats.totalQuantity,
        `$${stats.totalValue.toFixed(2)}`,
        `$${avgUnitPrice.toFixed(2)}`,
        `${percentage}%`
      ]);
    });

  // Add totals
  const totalItems = Object.values(categoryStats).reduce((sum, cat) => sum + cat.count, 0);
  const totalQuantity = Object.values(categoryStats).reduce((sum, cat) => sum + cat.totalQuantity, 0);
  
  categoryData.push(
    [''],
    ['TOTALS', totalItems, totalQuantity, `$${grandTotal.toFixed(2)}`, '', '100.0%']
  );

  const ws = XLSX.utils.aoa_to_sheet(categoryData);
  
  // Apply formatting
  applyCategoryFormatting(ws, categoryData.length);
  
  return ws;
};

/**
 * Apply formatting to Summary worksheet
 */
const applySummaryFormatting = (ws, rowCount) => {
  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Column A
    { wch: 20 }, // Column B
    { wch: 15 }, // Column C
    { wch: 15 }  // Column D
  ];

  // Title formatting
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center" }
    };
  }

  // Section headers formatting
  const sectionHeaders = ['A3', 'A11', 'A17', 'A21'];
  sectionHeaders.forEach(cell => {
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } }
      };
    }
  });

  // Currency formatting for financial values
  const currencyCells = ['B18', 'B19'];
  currencyCells.forEach(cell => {
    if (ws[cell]) {
      ws[cell].s = {
        numFmt: '"$"#,##0.00',
        font: { bold: true }
      };
    }
  });
};

/**
 * Apply formatting to Detailed Items worksheet
 */
const applyDetailedFormatting = (ws, rowCount, colCount) => {
  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Line #
    { wch: 30 }, // Item Name
    { wch: 15 }, // Category
    { wch: 15 }, // Manufacturer
    { wch: 15 }, // Part Number
    { wch: 25 }, // Description
    { wch: 8 },  // Unit
    { wch: 10 }, // Quantity
    { wch: 12 }, // Unit Price
    { wch: 12 }, // Unit Net Price
    { wch: 10 }, // Discount %
    { wch: 15 }, // Extended Price
    { wch: 12 }, // Service Duration
    { wch: 12 }, // Lead Time
    { wch: 12 }, // Pricing Term
    { wch: 12 }, // Type
    { wch: 15 }  // Required By
  ];

  // Title formatting
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center" }
    };
  }

  // Header row formatting (row 6)
  for (let col = 0; col < colCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 5, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" }
      };
    }
  }
};

/**
 * Apply formatting to Category Summary worksheet
 */
const applyCategoryFormatting = (ws, rowCount) => {
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Category
    { wch: 12 }, // Item Count
    { wch: 15 }, // Total Quantity
    { wch: 15 }, // Total Value
    { wch: 15 }, // Avg Unit Price
    { wch: 18 }  // Percentage
  ];

  // Title formatting
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center" }
    };
  }

  // Header row formatting (row 6)
  const headerCells = ['A6', 'B6', 'C6', 'D6', 'E6', 'F6'];
  headerCells.forEach(cell => {
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" }
      };
    }
  });
};

/**
 * Export BOQ data to Excel file with multiple worksheets
 * @param {Array} boqItems - Array of BOQ items
 * @param {Object} projectInfo - Project metadata
 * @param {Object} options - Export options
 */
export const exportToExcel = (boqItems = [], projectInfo = {}, options = {}) => {
  try {
    const wb = createExcelWorkbook(boqItems, projectInfo, options);
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const projectName = projectInfo.name || 'BOQ_Export';
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${sanitizedName}_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, fileName);
    
    return {
      success: true,
      fileName,
      message: `Excel file exported successfully as ${fileName}`
    };
  } catch (error) {
    console.error('Excel export error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to export Excel file'
    };
  }
};

/**
 * Export BOQ data to Excel buffer (for programmatic use)
 * @param {Array} boqItems - Array of BOQ items
 * @param {Object} projectInfo - Project metadata
 * @param {Object} options - Export options
 * @returns {ArrayBuffer} Excel file buffer
 */
export const exportToExcelBuffer = (boqItems = [], projectInfo = {}, options = {}) => {
  const wb = createExcelWorkbook(boqItems, projectInfo, options);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};

/**
 * Validate BOQ items before export
 * @param {Array} boqItems - Array of BOQ items to validate
 * @returns {Object} Validation result
 */
export const validateExportData = (boqItems = []) => {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(boqItems)) {
    errors.push('BOQ items must be an array');
    return { isValid: false, errors, warnings };
  }

  if (boqItems.length === 0) {
    warnings.push('No items to export');
  }

  boqItems.forEach((item, index) => {
    if (!item.name) {
      errors.push(`Item at index ${index} is missing a name`);
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item "${item.name}" has invalid quantity`);
    }
    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
      errors.push(`Item "${item.name}" has invalid unit price`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default {
  exportToExcel,
  exportToExcelBuffer,
  createExcelWorkbook,
  validateExportData
};