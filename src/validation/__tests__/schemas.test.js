import { describe, it, expect } from 'vitest';
import {
  itemSchema,
  boqItemSchema,
  categorySchema,
  projectSchema,
  searchFiltersSchema,
  exportConfigSchema,
  bulkOperationSchema,
  createItemFormSchema,
  updateItemFormSchema
} from '../schemas.js';

describe('Validation Schemas', () => {
  describe('itemSchema', () => {
    const validItem = {
      name: 'Test Item',
      category: 'Electronics',
      unit: 'pcs',
      unitPrice: 100.50,
      pricingTerm: 'per unit'
    };

    it('should validate a valid item', () => {
      const result = itemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual([]);
      expect(result.data.dependencies).toEqual([]);
    });

    it('should require name field', () => {
      const invalidItem = { ...validItem };
      delete invalidItem.name;
      
      const result = itemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toEqual(['name']);
    });

    it('should validate price constraints', () => {
      const invalidItem = { ...validItem, unitPrice: -10 };
      const result = itemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('positive');
    });

    it('should validate price maximum', () => {
      const invalidItem = { ...validItem, unitPrice: 1000000 };
      const result = itemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('less than 1,000,000');
    });

    it('should validate string length constraints', () => {
      const invalidItem = { ...validItem, name: 'a'.repeat(256) };
      const result = itemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('less than 255');
    });

    it('should validate optional fields', () => {
      const itemWithOptionals = {
        ...validItem,
        manufacturer: 'Test Manufacturer',
        partNumber: 'PN123',
        unitNetPrice: 90.00,
        serviceDuration: 30,
        estimatedLeadTime: 14,
        discount: 10.5,
        description: 'Test description'
      };
      
      const result = itemSchema.safeParse(itemWithOptionals);
      expect(result.success).toBe(true);
    });

    it('should validate tags array', () => {
      const itemWithTags = {
        ...validItem,
        tags: ['tag1', 'tag2', 'tag3']
      };
      
      const result = itemSchema.safeParse(itemWithTags);
      expect(result.success).toBe(true);
      expect(result.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should reject too many tags', () => {
      const itemWithManyTags = {
        ...validItem,
        tags: Array(11).fill('tag')
      };
      
      const result = itemSchema.safeParse(itemWithManyTags);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Maximum 10 tags');
    });

    it('should validate dependencies', () => {
      const itemWithDeps = {
        ...validItem,
        dependencies: [
          {
            itemId: 'dep1',
            quantity: 2,
            isOptional: false,
            description: 'Required dependency'
          }
        ]
      };
      
      const result = itemSchema.safeParse(itemWithDeps);
      expect(result.success).toBe(true);
    });

    it('should validate metadata structure', () => {
      const itemWithMetadata = {
        ...validItem,
        metadata: {
          isActive: true,
          stockLevel: 100,
          supplierInfo: {
            name: 'Supplier Inc',
            contact: 'John Doe',
            email: 'john@supplier.com',
            website: 'https://supplier.com'
          }
        }
      };
      
      const result = itemSchema.safeParse(itemWithMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe('boqItemSchema', () => {
    const validBOQItem = {
      name: 'Test Item',
      category: 'Electronics',
      unit: 'pcs',
      unitPrice: 100.50,
      pricingTerm: 'per unit',
      quantity: 5
    };

    it('should validate a valid BOQ item', () => {
      const result = boqItemSchema.safeParse(validBOQItem);
      expect(result.success).toBe(true);
      expect(result.data.isDependency).toBe(false);
    });

    it('should require quantity field', () => {
      const invalidItem = { ...validBOQItem };
      delete invalidItem.quantity;
      
      const result = boqItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toEqual(['quantity']);
    });

    it('should validate quantity constraints', () => {
      const invalidItem = { ...validBOQItem, quantity: 0 };
      const result = boqItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('positive');
    });

    it('should validate custom price', () => {
      const itemWithCustomPrice = {
        ...validBOQItem,
        customPrice: 95.00
      };
      
      const result = boqItemSchema.safeParse(itemWithCustomPrice);
      expect(result.success).toBe(true);
    });
  });

  describe('categorySchema', () => {
    const validCategory = {
      name: 'Electronics'
    };

    it('should validate a valid category', () => {
      const result = categorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
      expect(result.data.isActive).toBe(true);
      expect(result.data.sortOrder).toBe(0);
    });

    it('should require name field', () => {
      const result = categorySchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toEqual(['name']);
    });

    it('should validate color format', () => {
      const categoryWithColor = {
        ...validCategory,
        color: '#FF5733'
      };
      
      const result = categorySchema.safeParse(categoryWithColor);
      expect(result.success).toBe(true);
    });

    it('should reject invalid color format', () => {
      const categoryWithInvalidColor = {
        ...validCategory,
        color: 'red'
      };
      
      const result = categorySchema.safeParse(categoryWithInvalidColor);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('valid hex color');
    });
  });

  describe('projectSchema', () => {
    const validProject = {
      name: 'Test Project'
    };

    it('should validate a valid project', () => {
      const result = projectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('draft');
      expect(result.data.metadata).toEqual({});
      expect(result.data.settings.currency).toBe('USD');
    });

    it('should require name field', () => {
      const result = projectSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toEqual(['name']);
    });

    it('should validate status enum', () => {
      const projectWithStatus = {
        ...validProject,
        status: 'active'
      };
      
      const result = projectSchema.safeParse(projectWithStatus);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const projectWithInvalidStatus = {
        ...validProject,
        status: 'invalid'
      };
      
      const result = projectSchema.safeParse(projectWithInvalidStatus);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('expected one of');
    });

    it('should validate metadata fields', () => {
      const projectWithMetadata = {
        ...validProject,
        metadata: {
          client: 'Test Client',
          location: 'Test Location',
          estimatedValue: 50000,
          deadline: new Date('2024-12-31'),
          tags: ['urgent', 'commercial']
        }
      };
      
      const result = projectSchema.safeParse(projectWithMetadata);
      expect(result.success).toBe(true);
    });

    it('should validate settings fields', () => {
      const projectWithSettings = {
        ...validProject,
        settings: {
          currency: 'EUR',
          taxRate: 20,
          discountRate: 5,
          showPrices: false,
          showDescriptions: true,
          autoCalculateDependencies: false
        }
      };
      
      const result = projectSchema.safeParse(projectWithSettings);
      expect(result.success).toBe(true);
    });
  });

  describe('searchFiltersSchema', () => {
    it('should validate empty filters', () => {
      const result = searchFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.search).toBe('');
      expect(result.data.priceRange).toEqual([0, 999999]);
    });

    it('should validate price range', () => {
      const filters = {
        priceRange: [100, 500]
      };
      
      const result = searchFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should reject invalid price range', () => {
      const filters = {
        priceRange: [500, 100] // min > max
      };
      
      const result = searchFiltersSchema.safeParse(filters);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('less than or equal to maximum');
    });
  });

  describe('exportConfigSchema', () => {
    const validConfig = {
      format: 'pdf',
      fields: ['name', 'price', 'quantity']
    };

    it('should validate a valid export config', () => {
      const result = exportConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      expect(result.data.includeMetadata).toBe(true);
    });

    it('should require format field', () => {
      const invalidConfig = { ...validConfig };
      delete invalidConfig.format;
      
      const result = exportConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toEqual(['format']);
    });

    it('should require at least one field', () => {
      const invalidConfig = { ...validConfig, fields: [] };
      const result = exportConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('At least one field');
    });
  });

  describe('bulkOperationSchema', () => {
    const validOperation = {
      operation: 'add_to_boq',
      itemIds: ['item1', 'item2']
    };

    it('should validate a valid bulk operation', () => {
      const result = bulkOperationSchema.safeParse(validOperation);
      expect(result.success).toBe(true);
      expect(result.data.confirmDestructive).toBe(false);
    });

    it('should require at least one item', () => {
      const invalidOperation = { ...validOperation, itemIds: [] };
      const result = bulkOperationSchema.safeParse(invalidOperation);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('At least one item');
    });

    it('should limit maximum items', () => {
      const invalidOperation = {
        ...validOperation,
        itemIds: Array(1001).fill('item')
      };
      
      const result = bulkOperationSchema.safeParse(invalidOperation);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Maximum 1000 items');
    });
  });

  describe('Form schemas', () => {
    describe('createItemFormSchema', () => {
      it('should not require id field', () => {
        const formData = {
          name: 'Test Item',
          category: 'Electronics',
          unit: 'pcs',
          unitPrice: 100,
          pricingTerm: 'per unit'
        };
        
        const result = createItemFormSchema.safeParse(formData);
        expect(result.success).toBe(true);
        expect(result.data.id).toBeUndefined();
      });
    });

    describe('updateItemFormSchema', () => {
      it('should require id field', () => {
        const formData = {
          name: 'Updated Item'
        };
        
        const result = updateItemFormSchema.safeParse(formData);
        expect(result.success).toBe(false);
        expect(result.error.issues[0].path).toEqual(['id']);
      });

      it('should allow partial updates', () => {
        const formData = {
          id: 'item123',
          name: 'Updated Item'
        };
        
        const result = updateItemFormSchema.safeParse(formData);
        expect(result.success).toBe(true);
      });
    });
  });
});