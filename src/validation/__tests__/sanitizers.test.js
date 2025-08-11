import { describe, it, expect } from 'vitest';
import {
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
  escapeSqlString,
  sanitize
} from '../sanitizers.js';

describe('Sanitization Functions', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace by default', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeString('test   multiple   spaces')).toBe('test multiple spaces');
    });

    it('should remove HTML tags by default', () => {
      expect(sanitizeString('<script>alert("xss")</script>test')).toBe('alert("xss")test');
      expect(sanitizeString('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('should allow HTML when specified', () => {
      const result = sanitizeString('<p>Hello</p>', { allowHtml: true });
      expect(result).toBe('<p>Hello</p>');
    });

    it('should remove control characters', () => {
      expect(sanitizeString('test\x00\x01\x02')).toBe('test');
    });

    it('should truncate to max length', () => {
      const longString = 'a'.repeat(100);
      const result = sanitizeString(longString, { maxLength: 50 });
      expect(result.length).toBe(50);
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe('123');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('should convert valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('123.45')).toBe(123.45);
    });

    it('should return default for invalid numbers', () => {
      expect(sanitizeNumber('abc')).toBeNull();
      expect(sanitizeNumber('abc', { defaultValue: 0 })).toBe(0);
    });

    it('should apply bounds', () => {
      expect(sanitizeNumber(150, { min: 0, max: 100 })).toBe(100);
      expect(sanitizeNumber(-10, { min: 0, max: 100 })).toBe(0);
    });

    it('should handle negative values', () => {
      expect(sanitizeNumber(-10, { allowNegative: false })).toBeNull();
      expect(sanitizeNumber(-10, { allowNegative: true })).toBe(-10);
    });

    it('should round to specified decimals', () => {
      expect(sanitizeNumber(123.456, { decimals: 2 })).toBe(123.46);
      expect(sanitizeNumber(123.456, { decimals: 0 })).toBe(123);
    });

    it('should handle infinity and NaN', () => {
      expect(sanitizeNumber(Infinity)).toBeNull();
      expect(sanitizeNumber(NaN)).toBeNull();
    });
  });

  describe('sanitizePrice', () => {
    it('should sanitize valid prices', () => {
      expect(sanitizePrice('123.45')).toBe(123.45);
      expect(sanitizePrice(99.999)).toBe(100.00);
    });

    it('should reject negative prices', () => {
      expect(sanitizePrice(-10)).toBeNull();
    });

    it('should enforce maximum price', () => {
      expect(sanitizePrice(1000000)).toBeNull();
    });

    it('should round to 2 decimal places', () => {
      expect(sanitizePrice(123.456)).toBe(123.46);
    });
  });

  describe('sanitizeQuantity', () => {
    it('should sanitize valid quantities', () => {
      expect(sanitizeQuantity('5')).toBe(5);
      expect(sanitizeQuantity(1.5)).toBe(1.5);
    });

    it('should enforce minimum quantity', () => {
      expect(sanitizeQuantity(0)).toBeNull();
    });

    it('should enforce maximum quantity', () => {
      expect(sanitizeQuantity(100000)).toBeNull();
    });

    it('should round to 3 decimal places', () => {
      expect(sanitizeQuantity(1.2345)).toBe(1.235);
    });
  });

  describe('sanitizeEmail', () => {
    it('should sanitize valid emails', () => {
      expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(sanitizeEmail('  user@domain.com  ')).toBe('user@domain.com');
    });

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('invalid-email')).toBe('');
      expect(sanitizeEmail('user@')).toBe('');
      expect(sanitizeEmail('@domain.com')).toBe('');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeEmail('user!@domain.com')).toBe('user@domain.com');
    });

    it('should handle non-string input', () => {
      expect(sanitizeEmail(123)).toBe('');
      expect(sanitizeEmail(null)).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should add protocol if missing', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com/');
    });

    it('should preserve existing protocol', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should reject invalid protocols', () => {
      const result = sanitizeUrl('ftp://example.com', { allowedProtocols: ['http', 'https'] });
      expect(result).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBe('');
      expect(sanitizeUrl('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeUrl(123)).toBe('');
      expect(sanitizeUrl(null)).toBe('');
    });
  });

  describe('sanitizeArray', () => {
    it('should remove empty items by default', () => {
      const input = ['item1', '', null, 'item2', undefined];
      const result = sanitizeArray(input);
      expect(result).toEqual(['item1', 'item2']);
    });

    it('should remove duplicates by default', () => {
      const input = ['item1', 'item2', 'item1', 'item3'];
      const result = sanitizeArray(input);
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should apply item sanitizer', () => {
      const input = ['  item1  ', '  item2  '];
      const result = sanitizeArray(input, {
        itemSanitizer: (item) => item.trim()
      });
      expect(result).toEqual(['item1', 'item2']);
    });

    it('should limit array length', () => {
      const input = Array(10).fill(0).map((_, i) => `item${i}`); // Create unique items
      const result = sanitizeArray(input, { maxLength: 5, removeDuplicates: false });
      expect(result).toHaveLength(5);
    });

    it('should handle non-array input', () => {
      expect(sanitizeArray('not-array')).toEqual([]);
      expect(sanitizeArray(null)).toEqual([]);
    });
  });

  describe('sanitizeTags', () => {
    it('should sanitize tag strings', () => {
      const input = ['  tag1  ', 'tag2', '', 'tag1'];
      const result = sanitizeTags(input);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should limit tag count', () => {
      const input = Array(25).fill('tag');
      const result = sanitizeTags(input);
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('sanitizeDate', () => {
    it('should handle valid dates', () => {
      const date = new Date('2024-01-01');
      expect(sanitizeDate(date)).toEqual(date);
    });

    it('should parse string dates', () => {
      const result = sanitizeDate('2024-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should reject invalid dates', () => {
      expect(sanitizeDate('invalid-date')).toBeNull();
      expect(sanitizeDate('2024-13-01')).toBeNull();
    });

    it('should enforce past/future restrictions', () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');
      
      expect(sanitizeDate(pastDate, { allowPast: false })).toBeNull();
      expect(sanitizeDate(futureDate, { allowFuture: false })).toBeNull();
    });

    it('should enforce date bounds', () => {
      const date = new Date('2024-01-01');
      const minDate = new Date('2024-06-01');
      const maxDate = new Date('2023-06-01');
      
      expect(sanitizeDate(date, { minDate })).toBeNull();
      expect(sanitizeDate(date, { maxDate })).toBeNull();
    });
  });

  describe('sanitizeObject', () => {
    const sanitizers = {
      name: (value) => sanitizeString(value),
      price: (value) => sanitizePrice(value)
    };

    it('should apply sanitizers to properties', () => {
      const input = {
        name: '  Test Item  ',
        price: '123.45',
        category: 'Electronics'
      };
      
      const result = sanitizeObject(input, sanitizers);
      expect(result.name).toBe('Test Item');
      expect(result.price).toBe(123.45);
      expect(result.category).toBe('Electronics');
    });

    it('should filter allowed properties', () => {
      const input = {
        name: 'Test',
        price: 100,
        unwanted: 'remove'
      };
      
      const result = sanitizeObject(input, sanitizers, {
        allowedProperties: ['name', 'price']
      });
      
      expect(result.unwanted).toBeUndefined();
    });

    it('should handle non-object input', () => {
      expect(sanitizeObject('not-object', sanitizers)).toEqual({});
      expect(sanitizeObject(null, sanitizers)).toEqual({});
      expect(sanitizeObject([], sanitizers)).toEqual({});
    });
  });

  describe('sanitizeItemData', () => {
    const itemData = {
      name: '  Test Item  ',
      category: '  Electronics  ',
      unitPrice: '123.45',
      quantity: '5.5',
      tags: ['  tag1  ', '', 'tag2'],
      description: '<script>alert("xss")</script>Description'
    };

    it('should sanitize all item fields', () => {
      const result = sanitizeItemData(itemData);
      
      expect(result.name).toBe('Test Item');
      expect(result.category).toBe('Electronics');
      expect(result.unitPrice).toBe(123.45);
      expect(result.quantity).toBe(5.5);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.description).toBe('alert("xss")Description');
    });
  });

  describe('sanitizeProjectData', () => {
    const projectData = {
      name: '  Test Project  ',
      description: '  Project description  ',
      status: 'invalid-status'
    };

    it('should sanitize project fields', () => {
      const result = sanitizeProjectData(projectData);
      
      expect(result.name).toBe('Test Project');
      expect(result.description).toBe('Project description');
      expect(result.status).toBe('draft'); // Invalid status defaults to draft
    });
  });

  describe('sanitizeCategoryData', () => {
    const categoryData = {
      name: '  Electronics  ',
      description: '  Category description  ',
      color: '#FF5733',
      sortOrder: '5.7'
    };

    it('should sanitize category fields', () => {
      const result = sanitizeCategoryData(categoryData);
      
      expect(result.name).toBe('Electronics');
      expect(result.description).toBe('Category description');
      expect(result.color).toBe('#FF5733');
      expect(result.sortOrder).toBe(6); // Rounded to integer
    });

    it('should reject invalid colors', () => {
      const invalidData = { ...categoryData, color: 'red' };
      const result = sanitizeCategoryData(invalidData);
      expect(result.color).toBeNull();
    });
  });

  describe('encodeHtmlEntities', () => {
    it('should encode HTML entities', () => {
      expect(encodeHtmlEntities('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle non-string input', () => {
      expect(encodeHtmlEntities(123)).toBe('123');
      expect(encodeHtmlEntities(null)).toBe('');
    });
  });

  describe('escapeSqlString', () => {
    it('should escape SQL special characters', () => {
      expect(escapeSqlString("O'Reilly")).toBe("O''Reilly");
      expect(escapeSqlString("test\\path")).toBe("test\\\\path");
    });

    it('should handle non-string input', () => {
      expect(escapeSqlString(123)).toBe('123');
      expect(escapeSqlString(null)).toBe('');
    });
  });

  describe('sanitize (general function)', () => {
    it('should route to specific sanitizers based on type', () => {
      const itemData = { name: '  Test  ', unitPrice: '100' };
      const result = sanitize(itemData, 'item');
      expect(result.name).toBe('Test');
      expect(result.unitPrice).toBe(100);
    });

    it('should handle general types', () => {
      expect(sanitize('  test  ')).toBe('test');
      expect(sanitize('123.45')).toBe(123.45);
      expect(sanitize(['  item  '])).toEqual(['item']);
    });

    it('should return unchanged for unsupported types', () => {
      const date = new Date();
      expect(sanitize(date)).toBe(date);
    });
  });
});