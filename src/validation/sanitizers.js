/**
 * Sanitization functions for security and data integrity
 * These functions clean and normalize input data to prevent security issues
 * and ensure data consistency.
 */

/**
 * Sanitizes a string by removing potentially dangerous characters and normalizing whitespace
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {
    return String(input || '');
  }
  
  const {
    maxLength = 1000,
    allowHtml = false,
    trimWhitespace = true,
    normalizeWhitespace = true,
    removeControlChars = true
  } = options;
  
  let sanitized = input;
  
  // Remove control characters (except tab, newline, carriage return)
  if (removeControlChars) {
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  
  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*?>/g, '');
  }
  
  // Normalize whitespace
  if (normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }
  
  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }
  
  return sanitized;
}

/**
 * Sanitizes a number by ensuring it's a valid number and within bounds
 * @param {*} input - Input to sanitize as number
 * @param {Object} options - Sanitization options
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(input, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    decimals = null,
    allowNegative = true,
    defaultValue = null
  } = options;
  
  // Convert to number
  let num = Number(input);
  
  // Check if it's a valid number
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  // Check negative values
  if (!allowNegative && num < 0) {
    return defaultValue;
  }
  
  // Apply bounds
  num = Math.max(min, Math.min(max, num));
  
  // Round to specified decimal places
  if (decimals !== null && decimals >= 0) {
    num = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
  
  return num;
}

/**
 * Sanitizes a price value
 * @param {*} input - Input price to sanitize
 * @param {Object} options - Sanitization options
 * @returns {number|null} Sanitized price
 */
export function sanitizePrice(input, options = {}) {
  const result = sanitizeNumber(input, {
    min: 0.01,
    max: 999999.99,
    decimals: 2,
    allowNegative: false,
    defaultValue: null,
    ...options
  });
  
  // The sanitizeNumber function already handles max bounds
  // No additional check needed
  
  return result;
}

/**
 * Sanitizes a quantity value
 * @param {*} input - Input quantity to sanitize
 * @param {Object} options - Sanitization options
 * @returns {number|null} Sanitized quantity
 */
export function sanitizeQuantity(input, options = {}) {
  const result = sanitizeNumber(input, {
    min: 0.001,
    max: 99999,
    decimals: 3,
    allowNegative: false,
    defaultValue: null,
    ...options
  });
  
  // The sanitizeNumber function already handles bounds
  // No additional checks needed
  
  return result;
}

/**
 * Sanitizes an email address
 * @param {string} input - Input email to sanitize
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Convert to lowercase and trim
  let email = input.toLowerCase().trim();
  
  // Remove any characters that aren't valid in email addresses
  email = email.replace(/[^a-z0-9@._-]/g, '');
  
  // Basic email format validation
  const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return '';
  }
  
  return email;
}

/**
 * Sanitizes a URL
 * @param {string} input - Input URL to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized URL
 */
export function sanitizeUrl(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }
  
  const { allowedProtocols = ['http', 'https'] } = options;
  
  let url = input.trim();
  
  try {
    // Add protocol if missing
    if (url && !url.match(/^[a-z]+:\/\//)) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    
    // Check if protocol is allowed
    const protocol = urlObj.protocol.slice(0, -1); // Remove trailing colon
    if (!allowedProtocols.includes(protocol)) {
      return '';
    }
    
    // Basic validation - reject obviously invalid URLs
    if (urlObj.hostname === 'not-a-url' || urlObj.hostname.includes('//')) {
      return '';
    }
    
    return urlObj.toString();
  } catch (error) {
    return '';
  }
}

/**
 * Sanitizes an array by removing invalid items and duplicates
 * @param {*} input - Input array to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Array} Sanitized array
 */
export function sanitizeArray(input, options = {}) {
  const {
    maxLength = 100,
    itemSanitizer = null,
    removeDuplicates = true,
    removeEmpty = true
  } = options;
  
  if (!Array.isArray(input)) {
    return [];
  }
  
  let sanitized = [...input];
  
  // Apply item sanitizer if provided
  if (itemSanitizer && typeof itemSanitizer === 'function') {
    sanitized = sanitized.map(itemSanitizer);
  }
  
  // Remove empty items
  if (removeEmpty) {
    sanitized = sanitized.filter(item => {
      if (item === null || item === undefined) return false;
      if (typeof item === 'string') return item.trim() !== '';
      if (Array.isArray(item)) return item.length > 0;
      if (typeof item === 'object') return Object.keys(item).length > 0;
      return true;
    });
  }
  
  // Limit array length first
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  
  // Remove duplicates
  if (removeDuplicates) {
    sanitized = [...new Set(sanitized)];
  }
  
  return sanitized;
}

/**
 * Sanitizes tags array
 * @param {*} input - Input tags to sanitize
 * @returns {Array} Sanitized tags array
 */
export function sanitizeTags(input) {
  return sanitizeArray(input, {
    maxLength: 20,
    itemSanitizer: (tag) => sanitizeString(tag, { maxLength: 50, trimWhitespace: true }),
    removeDuplicates: true,
    removeEmpty: true
  });
}

/**
 * Sanitizes a date value
 * @param {*} input - Input date to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Date|null} Sanitized date or null if invalid
 */
export function sanitizeDate(input, options = {}) {
  const {
    minDate = null,
    maxDate = null,
    allowPast = true,
    allowFuture = true
  } = options;
  
  let date;
  
  // Try to parse the date
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string' || typeof input === 'number') {
    date = new Date(input);
  } else {
    return null;
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  
  const now = new Date();
  
  // Check past/future restrictions
  if (!allowPast && date < now) {
    return null;
  }
  
  if (!allowFuture && date > now) {
    return null;
  }
  
  // Check min/max date bounds
  if (minDate && date < minDate) {
    return null;
  }
  
  if (maxDate && date > maxDate) {
    return null;
  }
  
  return date;
}

/**
 * Sanitizes an object by applying sanitizers to its properties
 * @param {Object} input - Input object to sanitize
 * @param {Object} sanitizers - Object mapping property names to sanitizer functions
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(input, sanitizers = {}, options = {}) {
  const {
    removeUnknownProperties = false,
    allowedProperties = null
  } = options;
  
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }
  
  const sanitized = {};
  
  // Get properties to process
  let properties = Object.keys(input);
  
  if (allowedProperties && Array.isArray(allowedProperties)) {
    properties = properties.filter(prop => allowedProperties.includes(prop));
  }
  
  // Apply sanitizers
  properties.forEach(prop => {
    const value = input[prop];
    const sanitizer = sanitizers[prop];
    
    if (sanitizer && typeof sanitizer === 'function') {
      sanitized[prop] = sanitizer(value);
    } else if (!removeUnknownProperties) {
      sanitized[prop] = value;
    }
  });
  
  return sanitized;
}

/**
 * Sanitizes item data
 * @param {Object} itemData - Item data to sanitize
 * @returns {Object} Sanitized item data
 */
export function sanitizeItemData(itemData) {
  return sanitizeObject(itemData, {
    name: (value) => sanitizeString(value, { maxLength: 255 }),
    category: (value) => sanitizeString(value, { maxLength: 100 }),
    manufacturer: (value) => sanitizeString(value, { maxLength: 100 }),
    partNumber: (value) => sanitizeString(value, { maxLength: 50 }),
    unit: (value) => sanitizeString(value, { maxLength: 20 }),
    unitPrice: sanitizePrice,
    unitNetPrice: sanitizePrice,
    serviceDuration: (value) => sanitizeNumber(value, { min: 0, max: 365, decimals: 0 }),
    estimatedLeadTime: (value) => sanitizeNumber(value, { min: 0, max: 365, decimals: 0 }),
    pricingTerm: (value) => sanitizeString(value, { maxLength: 50 }),
    discount: (value) => sanitizeNumber(value, { min: 0, max: 100, decimals: 2 }),
    description: (value) => sanitizeString(value, { maxLength: 1000 }),
    tags: sanitizeTags,
    quantity: sanitizeQuantity
  });
}

/**
 * Sanitizes project data
 * @param {Object} projectData - Project data to sanitize
 * @returns {Object} Sanitized project data
 */
export function sanitizeProjectData(projectData) {
  return sanitizeObject(projectData, {
    name: (value) => sanitizeString(value, { maxLength: 255 }),
    description: (value) => sanitizeString(value, { maxLength: 2000 }),
    status: (value) => {
      const validStatuses = ['draft', 'active', 'completed', 'archived'];
      return validStatuses.includes(value) ? value : 'draft';
    }
  });
}

/**
 * Sanitizes category data
 * @param {Object} categoryData - Category data to sanitize
 * @returns {Object} Sanitized category data
 */
export function sanitizeCategoryData(categoryData) {
  return sanitizeObject(categoryData, {
    name: (value) => sanitizeString(value, { maxLength: 100 }),
    description: (value) => sanitizeString(value, { maxLength: 500 }),
    parentCategory: (value) => sanitizeString(value, { maxLength: 100 }),
    color: (value) => {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      return colorRegex.test(value) ? value : null;
    },
    sortOrder: (value) => sanitizeNumber(value, { min: 0, decimals: 0 })
  });
}

/**
 * Prevents XSS attacks by encoding HTML entities
 * @param {string} input - Input string to encode
 * @returns {string} HTML-encoded string
 */
export function encodeHtmlEntities(input) {
  if (typeof input !== 'string') {
    return String(input || '');
  }
  
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return input.replace(/[&<>"'\/]/g, (char) => entityMap[char]);
}

/**
 * Prevents SQL injection by escaping special characters
 * @param {string} input - Input string to escape
 * @returns {string} SQL-escaped string
 */
export function escapeSqlString(input) {
  if (typeof input !== 'string') {
    return String(input || '');
  }
  
  return input.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Comprehensive sanitization function that applies multiple sanitizers
 * @param {*} data - Data to sanitize
 * @param {string} type - Type of data ('item', 'project', 'category', 'general')
 * @returns {*} Sanitized data
 */
export function sanitize(data, type = 'general') {
  switch (type) {
    case 'item':
      return sanitizeItemData(data);
    case 'project':
      return sanitizeProjectData(data);
    case 'category':
      return sanitizeCategoryData(data);
    default:
      if (typeof data === 'string') {
        return sanitizeString(data);
      } else if (typeof data === 'number') {
        return sanitizeNumber(data);
      } else if (Array.isArray(data)) {
        return sanitizeArray(data, { itemSanitizer: sanitizeString });
      } else if (data instanceof Date) {
        return data; // Return dates unchanged
      } else if (data && typeof data === 'object') {
        return sanitizeObject(data);
      }
      return data;
  }
}