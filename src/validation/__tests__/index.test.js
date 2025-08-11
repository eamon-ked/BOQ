import { describe, it, expect } from 'vitest';
import {
  validateAndSanitize,
  quickValidate,
  formValidation,
  errorHandling,
  createValidationContext,
  defaultValidationConfig
} from '../index.js';
import { validateItem, validateProject } from '../validators.js';

describe('Validation System Integration', () => {
  describe('validateAndSanitize', () => {
    const itemData = {
      name: '  Test Item  ',
      category: 'Electronics',
      unit: 'pcs',
      unitPrice: '123.45',
      pricingTerm: 'per unit'
    };

    it('should sanitize first then validate by default', () => {
      const result = validateAndSanitize(itemData, 'item', validateItem);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData.name).toBe('Test Item');
      expect(result.sanitizedData.unitPrice).toBe(123.45);
      expect(result.originalData).toEqual(itemData);
    });

    it('should validate first when specified', () => {
      const result = validateAndSanitize(itemData, 'item', validateItem, {
        validateFirst: true,
        sanitizeFirst: false
      });
      
      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('Test Item'); // Sanitized after validation
    });

    it('should handle validation failures', () => {
      const invalidData = { ...itemData, unitPrice: -10 };
      const result = validateAndSanitize(invalidData, 'item', validateItem);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.unitPrice).toBeDefined();
    });
  });

  describe('quickValidate', () => {
    describe('item', () => {
      const itemData = {
        name: '  Test Item  ',
        category: 'Electronics',
        unit: 'pcs',
        unitPrice: '123.45',
        pricingTerm: 'per unit'
      };

      it('should validate and sanitize item data', () => {
        const result = quickValidate.item(itemData);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData.name).toBe('Test Item');
        expect(result.sanitizedData.unitPrice).toBe(123.45);
      });
    });

    describe('boqItem', () => {
      const boqItemData = {
        name: '  Test Item  ',
        category: 'Electronics',
        unit: 'pcs',
        unitPrice: '123.45',
        pricingTerm: 'per unit',
        quantity: '5'
      };

      it('should validate and sanitize BOQ item data', () => {
        const result = quickValidate.boqItem(boqItemData);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData.quantity).toBe(5);
      });
    });

    describe('project', () => {
      const projectData = {
        name: '  Test Project  ',
        description: '  Project description  '
      };

      it('should validate and sanitize project data', () => {
        const result = quickValidate.project(projectData);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData.name).toBe('Test Project');
      });
    });

    describe('category', () => {
      const categoryData = {
        name: '  Electronics  '
      };

      it('should validate and sanitize category data', () => {
        const result = quickValidate.category(categoryData);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData.name).toBe('Electronics');
      });
    });
  });

  describe('formValidation', () => {
    describe('createFieldValidator', () => {
      it('should create a field validator function', () => {
        const validator = formValidation.createFieldValidator(validateItem, 'name');
        
        const result = validator('Test Item', {
          category: 'Electronics',
          unit: 'pcs',
          unitPrice: 100,
          pricingTerm: 'per unit'
        });
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
        expect(result.value).toBe('Test Item');
      });

      it('should return error for invalid field', () => {
        const validator = formValidation.createFieldValidator(validateItem, 'name');
        
        const result = validator('', {
          category: 'Electronics',
          unit: 'pcs',
          unitPrice: 100,
          pricingTerm: 'per unit'
        });
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('validateField', () => {
      const formData = {
        category: 'Electronics',
        unit: 'pcs',
        unitPrice: 100,
        pricingTerm: 'per unit'
      };

      it('should validate a single field', () => {
        const result = formValidation.validateField('name', 'Test Item', formData, validateItem);
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should return error for invalid field', () => {
        const result = formValidation.validateField('name', '', formData, validateItem);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('errorHandling', () => {
    const errors = {
      name: 'Name is required',
      unitPrice: 'Price must be positive',
      _general: 'General validation error'
    };

    describe('toFormErrors', () => {
      it('should convert to form library format', () => {
        const formErrors = errorHandling.toFormErrors(errors);
        
        expect(formErrors.name.message).toBe('Name is required');
        expect(formErrors.unitPrice.message).toBe('Price must be positive');
        expect(formErrors.root.message).toBe('General validation error');
      });
    });

    describe('getUserFriendlyMessages', () => {
      it('should create user-friendly messages', () => {
        const messages = errorHandling.getUserFriendlyMessages(errors);
        
        expect(messages).toContain('General validation error');
        expect(messages).toContain('name: Name is required');
        expect(messages).toContain('unit price: Price must be positive');
      });
    });

    describe('hasCriticalErrors', () => {
      it('should detect general errors as critical', () => {
        expect(errorHandling.hasCriticalErrors(errors)).toBe(true);
      });

      it('should detect critical field errors', () => {
        const fieldErrors = { name: 'Name is required', category: 'Category is required' };
        expect(errorHandling.hasCriticalErrors(fieldErrors, ['name'])).toBe(true);
        expect(errorHandling.hasCriticalErrors(fieldErrors, ['description'])).toBe(false);
      });
    });
  });

  describe('createValidationContext', () => {
    it('should create context with default config', () => {
      const context = createValidationContext();
      
      expect(context.config).toEqual(defaultValidationConfig);
      expect(typeof context.validateItem).toBe('function');
      expect(typeof context.validateProject).toBe('function');
      expect(typeof context.sanitize).toBe('function');
    });

    it('should merge custom config', () => {
      const customConfig = {
        stripUnknown: false,
        maxStringLength: 500
      };
      
      const context = createValidationContext(customConfig);
      
      expect(context.config.stripUnknown).toBe(false);
      expect(context.config.maxStringLength).toBe(500);
      expect(context.config.abortEarly).toBe(defaultValidationConfig.abortEarly);
    });

    it('should use configured options in validation functions', () => {
      const context = createValidationContext({
        stripUnknown: false
      });
      
      const itemData = {
        name: 'Test Item',
        category: 'Electronics',
        unit: 'pcs',
        unitPrice: 100,
        pricingTerm: 'per unit'
      };
      
      const result = context.validateItem(itemData);
      expect(result.isValid).toBe(true);
    });
  });

  describe('defaultValidationConfig', () => {
    it('should have expected default values', () => {
      expect(defaultValidationConfig.stripUnknown).toBe(true);
      expect(defaultValidationConfig.abortEarly).toBe(false);
      expect(defaultValidationConfig.transform).toBe(true);
      expect(defaultValidationConfig.sanitizeFirst).toBe(true);
      expect(defaultValidationConfig.maxStringLength).toBe(1000);
      expect(defaultValidationConfig.allowHtml).toBe(false);
      expect(defaultValidationConfig.showWarnings).toBe(true);
      expect(defaultValidationConfig.focusFirstError).toBe(true);
      expect(defaultValidationConfig.validateOnChange).toBe(true);
      expect(defaultValidationConfig.validateOnBlur).toBe(true);
      expect(defaultValidationConfig.revalidateOnChange).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete item validation workflow', () => {
      const rawItemData = {
        name: '  <script>Test Item</script>  ',
        category: '  Electronics  ',
        unit: 'pcs',
        unitPrice: '123.456',
        pricingTerm: 'per unit',
        tags: ['  tag1  ', '', 'tag2', 'tag1'],
        description: '<p>Item description</p>'
      };

      const result = quickValidate.item(rawItemData);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData.name).toBe('Test Item'); // HTML removed, trimmed
      expect(result.sanitizedData.category).toBe('Electronics'); // Trimmed
      expect(result.sanitizedData.unitPrice).toBe(123.46); // Rounded to 2 decimals
      expect(result.sanitizedData.tags).toEqual(['tag1', 'tag2']); // Duplicates and empty removed
      expect(result.sanitizedData.description).toBe('Item description'); // HTML removed
    });

    it('should handle validation errors with sanitization', () => {
      const invalidItemData = {
        name: '', // Required field empty
        category: 'Electronics',
        unit: 'pcs',
        unitPrice: -10, // Invalid negative price
        pricingTerm: 'per unit'
      };

      const result = quickValidate.item(invalidItemData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.unitPrice).toBeDefined();
    });

    it('should handle batch validation with mixed data', () => {
      const items = [
        {
          name: '  Valid Item  ',
          category: 'Electronics',
          unit: 'pcs',
          unitPrice: '100',
          pricingTerm: 'per unit'
        },
        {
          name: '', // Invalid
          category: 'Electronics',
          unit: 'pcs',
          unitPrice: -10, // Invalid
          pricingTerm: 'per unit'
        }
      ];

      // This would be used in a real scenario with validateBatch
      const results = items.map(item => quickValidate.item(item));
      
      expect(results[0].isValid).toBe(true);
      expect(results[0].sanitizedData.name).toBe('Valid Item');
      expect(results[0].sanitizedData.unitPrice).toBe(100);
      
      expect(results[1].isValid).toBe(false);
      expect(results[1].errors.name).toBeDefined();
      expect(results[1].errors.unitPrice).toBeDefined();
    });
  });
});