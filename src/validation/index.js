/**
 * Validation System Entry Point
 * 
 * This module provides a comprehensive validation system for the BOQ Builder application.
 * It includes schema validation using Zod, data sanitization for security, and utility
 * functions for form validation and error handling.
 * 
 * Key Features:
 * - Schema-based validation using Zod
 * - Data sanitization for security and integrity
 * - Clear error messaging and formatting
 * - Batch validation for bulk operations
 * - Custom validation rules
 * - Form-specific validation helpers
 */

// Export all schemas
export * from './schemas.js';

// Export all validators
export * from './validators.js';

// Export all sanitizers
export * from './sanitizers.js';

// Re-export commonly used functions for convenience
export {
  validateItem,
  validateBOQItem,
  validateCategory,
  validateProject,
  validateSearchFilters,
  validateExportConfig,
  validateBulkOperation,
  validateCreateItemForm,
  validateUpdateItemForm,
  validateCreateProjectForm,
  validateUpdateProjectForm,
  validateCreateCategoryForm,
  validateUpdateCategoryForm,
  validateBatch,
  validateRequiredFields,
  formatValidationErrors,
  customValidationRules
} from './validators.js';

export {
  sanitize,
  sanitizeString,
  sanitizeNumber,
  sanitizePrice,
  sanitizeQuantity,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeArray,
  sanitizeTags,
  sanitizeDate,
  sanitizeObject,
  sanitizeItemData,
  sanitizeProjectData,
  sanitizeCategoryData,
  encodeHtmlEntities,
  escapeSqlString
} from './sanitizers.js';

/**
 * Validation pipeline that combines sanitization and validation
 * @param {*} data - Data to process
 * @param {string} type - Type of data for sanitization
 * @param {Function} validator - Validation function to use
 * @param {Object} options - Processing options
 * @returns {Object} Processing result with sanitized data and validation
 */
export function validateAndSanitize(data, type, validator, options = {}) {
  const { sanitizeFirst = true, validateFirst = false } = options;
  
  let processedData = data;
  let validationResult;
  
  if (sanitizeFirst && !validateFirst) {
    // Sanitize first, then validate
    processedData = sanitize(data, type);
    validationResult = validator(processedData, options);
  } else if (validateFirst && !sanitizeFirst) {
    // Validate first, then sanitize if valid
    validationResult = validator(data, options);
    if (validationResult.isValid) {
      processedData = sanitize(validationResult.data, type);
      validationResult.data = processedData;
    }
  } else {
    // Default: sanitize first, then validate
    processedData = sanitize(data, type);
    validationResult = validator(processedData, options);
  }
  
  return {
    ...validationResult,
    sanitizedData: processedData,
    originalData: data
  };
}

/**
 * Quick validation helpers for common use cases
 */
export const quickValidate = {
  /**
   * Validates and sanitizes item data
   * @param {Object} itemData - Item data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  item: (itemData, options = {}) => {
    return validateAndSanitize(itemData, 'item', validateItem, options);
  },
  
  /**
   * Validates and sanitizes BOQ item data
   * @param {Object} boqItemData - BOQ item data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  boqItem: (boqItemData, options = {}) => {
    return validateAndSanitize(boqItemData, 'item', validateBOQItem, options);
  },
  
  /**
   * Validates and sanitizes project data
   * @param {Object} projectData - Project data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  project: (projectData, options = {}) => {
    return validateAndSanitize(projectData, 'project', validateProject, options);
  },
  
  /**
   * Validates and sanitizes category data
   * @param {Object} categoryData - Category data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  category: (categoryData, options = {}) => {
    return validateAndSanitize(categoryData, 'category', validateCategory, options);
  }
};

/**
 * Form validation helpers that provide real-time validation feedback
 */
export const formValidation = {
  /**
   * Creates a field validator function for real-time validation
   * @param {Function} validator - Validation function to use
   * @param {string} fieldName - Name of the field being validated
   * @returns {Function} Field validator function
   */
  createFieldValidator: (validator, fieldName) => {
    return (value, formData = {}) => {
      const testData = { ...formData, [fieldName]: value };
      const result = validator(testData);
      
      return {
        isValid: !result.errors[fieldName],
        error: result.errors[fieldName] || null,
        value: result.data ? result.data[fieldName] : value
      };
    };
  },
  
  /**
   * Validates a single form field
   * @param {string} fieldName - Name of the field
   * @param {*} value - Field value
   * @param {Object} formData - Complete form data
   * @param {Function} validator - Validation function
   * @returns {Object} Field validation result
   */
  validateField: (fieldName, value, formData, validator) => {
    const testData = { ...formData, [fieldName]: value };
    const result = validator(testData);
    
    return {
      isValid: !result.errors[fieldName],
      error: result.errors[fieldName] || null,
      value: result.data ? result.data[fieldName] : value,
      hasWarning: result.warnings && result.warnings[fieldName],
      warning: result.warnings ? result.warnings[fieldName] : null
    };
  }
};

/**
 * Error handling utilities
 */
export const errorHandling = {
  /**
   * Converts validation errors to a format suitable for form libraries
   * @param {Object} errors - Validation errors object
   * @returns {Object} Formatted errors for form libraries
   */
  toFormErrors: (errors) => {
    const formErrors = {};
    
    Object.keys(errors).forEach(key => {
      if (key === '_general') {
        formErrors.root = { message: errors[key] };
      } else {
        formErrors[key] = { message: errors[key] };
      }
    });
    
    return formErrors;
  },
  
  /**
   * Gets user-friendly error messages
   * @param {Object} errors - Validation errors object
   * @returns {Array} Array of user-friendly error messages
   */
  getUserFriendlyMessages: (errors) => {
    const messages = [];
    
    Object.keys(errors).forEach(key => {
      if (key === '_general') {
        messages.push(errors[key]);
      } else {
        const fieldName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        messages.push(`${fieldName}: ${errors[key]}`);
      }
    });
    
    return messages;
  },
  
  /**
   * Checks if errors are critical (prevent form submission)
   * @param {Object} errors - Validation errors object
   * @param {Array} criticalFields - Array of field names that are critical
   * @returns {boolean} True if there are critical errors
   */
  hasCriticalErrors: (errors, criticalFields = []) => {
    if (errors._general) return true;
    
    return criticalFields.some(field => errors[field]);
  }
};

/**
 * Default validation configuration
 */
export const defaultValidationConfig = {
  // Global validation options
  stripUnknown: true,
  abortEarly: false,
  transform: true,
  
  // Sanitization options
  sanitizeFirst: true,
  maxStringLength: 1000,
  allowHtml: false,
  
  // Error handling options
  showWarnings: true,
  focusFirstError: true,
  
  // Form validation options
  validateOnChange: true,
  validateOnBlur: true,
  revalidateOnChange: true
};

/**
 * Creates a validation context with custom configuration
 * @param {Object} config - Custom validation configuration
 * @returns {Object} Validation context with configured functions
 */
export function createValidationContext(config = {}) {
  const mergedConfig = { ...defaultValidationConfig, ...config };
  
  return {
    config: mergedConfig,
    
    // Configured validation functions
    validateItem: (data, options = {}) => validateItem(data, { ...mergedConfig, ...options }),
    validateProject: (data, options = {}) => validateProject(data, { ...mergedConfig, ...options }),
    validateCategory: (data, options = {}) => validateCategory(data, { ...mergedConfig, ...options }),
    
    // Configured sanitization functions
    sanitize: (data, type) => sanitize(data, type),
    
    // Configured pipeline function
    validateAndSanitize: (data, type, validator, options = {}) => 
      validateAndSanitize(data, type, validator, { ...mergedConfig, ...options })
  };
}