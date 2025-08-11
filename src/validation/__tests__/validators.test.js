import { describe, it, expect } from 'vitest';
import {
  validateData,
  validateItem,
  validateBOQItem,
  validateCategory,
  validateProject,
  validateSearchFilters,
  validateExportConfig,
  validateBulkOperation,
  validateCreateItemForm,
  validateUpdateItemForm,
  validateBatch,
  validateRequiredFields,
  formatValidationErrors,
  customValidationRules,
  isEmpty
} from '../validators.js';
import { itemSchema } from '../schemas.js';
import { ZodError } from 'zod';

describe('Validation Utilities', () => {
  describe('formatValidationErrors', () => {
    it('should format single field errors', () => {
      const zodError = new ZodError([
        {
          path: ['name'],
          message: 'Name is required',
          code: 'invalid_type'
        }
      ]);
      
      const formatted = formatValidationErrors(zodError);
      expect(formatted).toEqual({
        name: 'Name is required'
      });
    });

    it('should format multiple errors for same field', () => {
      const zodError = new ZodError([
        {
          path: ['name'],
          message: 'Name is required',
          code: 'invalid_type'
        },
        {
          path: ['name'],
          message: 'Name must be string',
          code: 'invalid_type'
        }
      ]);
      
      const formatted = formatValidationErrors(zodError);
      expect(formatted.name).toContain('Name is required');
      expect(formatted.name).toContain('Name must be string');
    });

    it('should handle nested field paths', () => {
      const zodError = new ZodError([
        {
          path: ['metadata', 'supplierInfo', 'email'],
          message: 'Invalid email',
          code: 'invalid_string'
        }
      ]);
      
      const formatted = formatValidationErrors(zodError);
      expect(formatted['metadata.supplierInfo.email']).toBe('Invalid email');
    });

    it('should handle array index paths', () => {
      const zodError = new ZodError([
        {
          path: ['tags', 0],
          message: 'Tag too long',
          code: 'too_big'
        }
      ]);
      
      const formatted = formatValidationErrors(zodError);
      expect(formatted.tags).toBe('Tag too long');
    });
  });

  describe('validateData', () => {
    const testSchema = itemSchema;
    const validData = {
      name: 'Test Item',
      category: 'Electronics',
      unit: 'pcs',
      unitPrice: 100,
      pricingTerm: 'per unit'
    };

    it('should return success for valid data', () => {
      const result = validateData(testSchema, validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.data).toBeDefined();
    });

    it('should return errors for invalid data', () => {
      const invalidData = { ...validData };
      delete invalidData.name;
      
      const result = validateData(testSchema, invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should handle unexpected errors', () => {
      const result = validateData(null, validData);
      expect(result.isValid).toBe(false);
      expect(result.errors._general).toBeDefined();
    });
  });

  describe('validateItem', () => {
    const validItem = {
      name: 'Test Item',
      category: 'Electronics',
      unit: 'pcs',
      unitPrice: 100,
      pricingTerm: 'per unit'
    };

    it('should validate a valid item', () => {
      const result = validateItem(validItem);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid item', () => {
      const invalidItem = { ...validItem, unitPrice: -10 };
      const result = validateItem(invalidItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.unitPrice).toBeDefined();
    });
  });

  describe('validateBOQItem', () => {
    const validBOQItem = {
      name: 'Test Item',
      category: 'Electronics',
      unit: 'pcs',
      unitPrice: 100,
      pricingTerm: 'per unit',
      quantity: 5
    };

    it('should validate a valid BOQ item', () => {
      const result = validateBOQItem(validBOQItem);
      expect(result.isValid).toBe(true);
    });

    it('should require quantity', () => {
      const invalidItem = { ...validBOQItem };
      delete invalidItem.quantity;
      
      const result = validateBOQItem(invalidItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.quantity).toBeDefined();
    });
  });

  describe('validateCategory', () => {
    const validCategory = {
      name: 'Electronics'
    };

    it('should validate a valid category', () => {
      const result = validateCategory(validCategory);
      expect(result.isValid).toBe(true);
    });

    it('should require name', () => {
      const result = validateCategory({});
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });
  });

  describe('validateProject', () => {
    const validProject = {
      name: 'Test Project'
    };

    it('should validate a valid project', () => {
      const result = validateProject(validProject);
      expect(result.isValid).toBe(true);
    });

    it('should require name', () => {
      const result = validateProject({});
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });
  });

  describe('validateSearchFilters', () => {
    it('should validate empty filters', () => {
      const result = validateSearchFilters({});
      expect(result.isValid).toBe(true);
    });

    it('should validate price range', () => {
      const filters = { priceRange: [100, 500] };
      const result = validateSearchFilters(filters);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid price range', () => {
      const filters = { priceRange: [500, 100] };
      const result = validateSearchFilters(filters);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateExportConfig', () => {
    const validConfig = {
      format: 'pdf',
      fields: ['name', 'price']
    };

    it('should validate valid config', () => {
      const result = validateExportConfig(validConfig);
      expect(result.isValid).toBe(true);
    });

    it('should require fields', () => {
      const invalidConfig = { ...validConfig, fields: [] };
      const result = validateExportConfig(invalidConfig);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateBulkOperation', () => {
    const validOperation = {
      operation: 'add_to_boq',
      itemIds: ['item1', 'item2']
    };

    it('should validate valid operation', () => {
      const result = validateBulkOperation(validOperation);
      expect(result.isValid).toBe(true);
    });

    it('should require item IDs', () => {
      const invalidOperation = { ...validOperation, itemIds: [] };
      const result = validateBulkOperation(invalidOperation);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Form validation functions', () => {
    describe('validateCreateItemForm', () => {
      const validForm = {
        name: 'Test Item',
        category: 'Electronics',
        unit: 'pcs',
        unitPrice: 100,
        pricingTerm: 'per unit'
      };

      it('should validate valid form data', () => {
        const result = validateCreateItemForm(validForm);
        expect(result.isValid).toBe(true);
      });

      it('should not require id', () => {
        const result = validateCreateItemForm(validForm);
        expect(result.isValid).toBe(true);
        expect(result.data.id).toBeUndefined();
      });
    });

    describe('validateUpdateItemForm', () => {
      it('should require id', () => {
        const formData = { name: 'Updated Item' };
        const result = validateUpdateItemForm(formData);
        expect(result.isValid).toBe(false);
        expect(result.errors.id).toBeDefined();
      });

      it('should allow partial updates', () => {
        const formData = { id: 'item123', name: 'Updated Item' };
        const result = validateUpdateItemForm(formData);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateBatch', () => {
    const validItems = [
      { name: 'Item 1', category: 'Cat1', unit: 'pcs', unitPrice: 100, pricingTerm: 'per unit' },
      { name: 'Item 2', category: 'Cat2', unit: 'pcs', unitPrice: 200, pricingTerm: 'per unit' }
    ];

    const mixedItems = [
      ...validItems,
      { name: '', category: 'Cat3', unit: 'pcs', unitPrice: -10, pricingTerm: 'per unit' }
    ];

    it('should validate all valid items', () => {
      const result = validateBatch(validItems, validateItem);
      expect(result.summary.total).toBe(2);
      expect(result.summary.validCount).toBe(2);
      expect(result.summary.invalidCount).toBe(0);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
    });

    it('should separate valid and invalid items', () => {
      const result = validateBatch(mixedItems, validateItem);
      expect(result.summary.total).toBe(3);
      expect(result.summary.validCount).toBe(2);
      expect(result.summary.invalidCount).toBe(1);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });

    it('should include error details for invalid items', () => {
      const result = validateBatch(mixedItems, validateItem);
      expect(result.invalid[0].errors).toBeDefined();
      expect(result.errors[2]).toBeDefined();
    });
  });

  describe('validateRequiredFields', () => {
    const data = {
      name: 'Test',
      category: 'Electronics',
      description: '',
      price: null
    };

    it('should pass when all required fields are present', () => {
      const result = validateRequiredFields(data, ['name', 'category']);
      expect(result.isValid).toBe(true);
    });

    it('should fail when required fields are missing', () => {
      const result = validateRequiredFields(data, ['name', 'description', 'price']);
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBeDefined();
      expect(result.errors.price).toBeDefined();
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty(['item'])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('customValidationRules', () => {
    describe('reasonablePrice', () => {
      it('should accept reasonable prices', () => {
        expect(customValidationRules.reasonablePrice(10.50)).toBe(true);
        expect(customValidationRules.reasonablePrice(999.99)).toBe(true);
      });

      it('should reject unreasonable prices', () => {
        expect(customValidationRules.reasonablePrice(0)).toContain('at least');
        expect(customValidationRules.reasonablePrice(1000001)).toContain('unreasonably high');
      });
    });

    describe('reasonableQuantity', () => {
      it('should accept reasonable quantities', () => {
        expect(customValidationRules.reasonableQuantity(1)).toBe(true);
        expect(customValidationRules.reasonableQuantity(100)).toBe(true);
      });

      it('should reject unreasonable quantities', () => {
        expect(customValidationRules.reasonableQuantity(0)).toContain('at least');
        expect(customValidationRules.reasonableQuantity(100001)).toContain('unreasonably high');
      });
    });

    describe('safeName', () => {
      it('should accept safe names', () => {
        expect(customValidationRules.safeName('Test Item')).toBe(true);
        expect(customValidationRules.safeName('Item-123_v2')).toBe(true);
      });

      it('should reject unsafe names', () => {
        expect(customValidationRules.safeName('Item<script>')).toContain('invalid characters');
        expect(customValidationRules.safeName('Item/Path')).toContain('invalid characters');
      });
    });

    describe('futureDate', () => {
      it('should accept future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        expect(customValidationRules.futureDate(futureDate)).toBe(true);
      });

      it('should reject past dates', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        expect(customValidationRules.futureDate(pastDate)).toContain('cannot be in the past');
      });
    });
  });
});