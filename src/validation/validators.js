import { ZodError } from 'zod';
import * as schemas from './schemas.js';

/**
 * Validation result interface
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {Object} errors - Object containing field-specific error messages
 * @property {Object} warnings - Object containing field-specific warning messages
 * @property {*} data - The validated and transformed data (if valid)
 */

/**
 * Formats Zod validation errors into a user-friendly format
 * @param {ZodError} zodError - The Zod validation error
 * @returns {Object} Formatted error object with field names as keys
 */
export function formatValidationErrors(zodError) {
  const errors = {};
  
  // Handle both ZodError.issues (newer versions) and ZodError.errors (older versions)
  const issues = zodError.issues || zodError.errors || [];
  
  issues.forEach(error => {
    const path = error.path.join('.');
    const message = error.message;
    
    // Handle array index paths (e.g., "tags.0" becomes "tags")
    const fieldPath = path.replace(/\.\d+$/, '');
    
    if (!errors[fieldPath]) {
      errors[fieldPath] = [];
    }
    
    errors[fieldPath].push(message);
  });
  
  // Convert arrays to strings for single errors, keep arrays for multiple
  Object.keys(errors).forEach(key => {
    if (errors[key].length === 1) {
      errors[key] = errors[key][0];
    } else {
      errors[key] = errors[key].join('; ');
    }
  });
  
  return errors;
}

/**
 * Generic validation function that validates data against a Zod schema
 * @param {*} schema - Zod schema to validate against
 * @param {*} data - Data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateData(schema, data, options = {}) {
  const { 
    stripUnknown = true, 
    abortEarly = false,
    transform = true 
  } = options;
  
  try {
    const validatedData = schema.parse(data);
    
    return {
      isValid: true,
      errors: {},
      warnings: {},
      data: validatedData
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: formatValidationErrors(error),
        warnings: {},
        data: null
      };
    }
    
    // Handle unexpected errors
    return {
      isValid: false,
      errors: { _general: 'An unexpected validation error occurred' },
      warnings: {},
      data: null
    };
  }
}

/**
 * Validates item data
 * @param {Object} itemData - Item data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateItem(itemData, options = {}) {
  return validateData(schemas.itemSchema, itemData, options);
}

/**
 * Validates BOQ item data
 * @param {Object} boqItemData - BOQ item data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateBOQItem(boqItemData, options = {}) {
  return validateData(schemas.boqItemSchema, boqItemData, options);
}

/**
 * Validates category data
 * @param {Object} categoryData - Category data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateCategory(categoryData, options = {}) {
  return validateData(schemas.categorySchema, categoryData, options);
}

/**
 * Validates project data
 * @param {Object} projectData - Project data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateProject(projectData, options = {}) {
  return validateData(schemas.projectSchema, projectData, options);
}

/**
 * Validates search filters
 * @param {Object} filtersData - Search filters to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateSearchFilters(filtersData, options = {}) {
  return validateData(schemas.searchFiltersSchema, filtersData, options);
}

/**
 * Validates export configuration
 * @param {Object} configData - Export configuration to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateExportConfig(configData, options = {}) {
  return validateData(schemas.exportConfigSchema, configData, options);
}

/**
 * Validates bulk operation data
 * @param {Object} operationData - Bulk operation data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateBulkOperation(operationData, options = {}) {
  return validateData(schemas.bulkOperationSchema, operationData, options);
}

/**
 * Validates form data for creating a new item
 * @param {Object} formData - Form data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateCreateItemForm(formData, options = {}) {
  return validateData(schemas.createItemFormSchema, formData, options);
}

/**
 * Validates form data for updating an existing item
 * @param {Object} formData - Form data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateUpdateItemForm(formData, options = {}) {
  return validateData(schemas.updateItemFormSchema, formData, options);
}

/**
 * Validates form data for creating a new project
 * @param {Object} formData - Form data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateCreateProjectForm(formData, options = {}) {
  return validateData(schemas.createProjectFormSchema, formData, options);
}

/**
 * Validates form data for updating an existing project
 * @param {Object} formData - Form data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateUpdateProjectForm(formData, options = {}) {
  return validateData(schemas.updateProjectFormSchema, formData, options);
}

/**
 * Validates form data for creating a new category
 * @param {Object} formData - Form data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateCreateCategoryForm(formData, options = {}) {
  return validateData(schemas.createCategoryFormSchema, formData, options);
}

/**
 * Validates form data for updating an existing category
 * @param {Object} formData - Form data to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export function validateUpdateCategoryForm(formData, options = {}) {
  return validateData(schemas.updateCategoryFormSchema, formData, options);
}

/**
 * Validates multiple items at once (for bulk operations)
 * @param {Array} items - Array of items to validate
 * @param {Function} validator - Validation function to use
 * @param {Object} options - Validation options
 * @returns {Object} Object containing valid items, invalid items, and errors
 */
export function validateBatch(items, validator, options = {}) {
  const results = {
    valid: [],
    invalid: [],
    errors: {},
    summary: {
      total: items.length,
      validCount: 0,
      invalidCount: 0
    }
  };
  
  items.forEach((item, index) => {
    const result = validator(item, options);
    
    if (result.isValid) {
      results.valid.push({
        index,
        data: result.data
      });
      results.summary.validCount++;
    } else {
      results.invalid.push({
        index,
        data: item,
        errors: result.errors
      });
      results.errors[index] = result.errors;
      results.summary.invalidCount++;
    }
  });
  
  return results;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if the value is considered empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validates required fields in an object
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {ValidationResult} Validation result
 */
export function validateRequiredFields(data, requiredFields) {
  const errors = {};
  
  requiredFields.forEach(field => {
    if (isEmpty(data[field])) {
      errors[field] = `${field} is required`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: {},
    data: Object.keys(errors).length === 0 ? data : null
  };
}

/**
 * Custom validation rules that can be used with the validation system
 */
export const customValidationRules = {
  /**
   * Validates that a price is reasonable (not too high or too low)
   * @param {number} price - Price to validate
   * @returns {boolean|string} True if valid, error message if invalid
   */
  reasonablePrice: (price) => {
    if (price < 0.01) return 'Price must be at least $0.01';
    if (price > 1000000) return 'Price seems unreasonably high (over $1,000,000)';
    return true;
  },
  
  /**
   * Validates that a quantity is reasonable
   * @param {number} quantity - Quantity to validate
   * @returns {boolean|string} True if valid, error message if invalid
   */
  reasonableQuantity: (quantity) => {
    if (quantity < 0.001) return 'Quantity must be at least 0.001';
    if (quantity > 100000) return 'Quantity seems unreasonably high (over 100,000)';
    return true;
  },
  
  /**
   * Validates that a name doesn't contain special characters that could cause issues
   * @param {string} name - Name to validate
   * @returns {boolean|string} True if valid, error message if invalid
   */
  safeName: (name) => {
    const unsafeChars = /[<>:"\/\\|?*\x00-\x1f]/;
    if (unsafeChars.test(name)) {
      return 'Name contains invalid characters';
    }
    return true;
  },
  
  /**
   * Validates that a date is not in the past (for deadlines, etc.)
   * @param {Date} date - Date to validate
   * @returns {boolean|string} True if valid, error message if invalid
   */
  futureDate: (date) => {
    const now = new Date();
    if (date < now) return 'Date cannot be in the past';
    return true;
  }
};