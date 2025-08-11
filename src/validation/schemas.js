import { z } from 'zod';

// Base validation schemas
const positiveNumber = z.coerce.number().positive('Must be a positive number');
const nonEmptyString = z.string().min(1, 'This field is required');
const optionalString = z.string().optional();
const email = z.string().email('Invalid email format').optional();
const url = z.string().url('Invalid URL format').optional();

// Item validation schema
export const itemSchema = z.object({
  id: z.string().optional(), // Optional for new items
  name: nonEmptyString.max(255, 'Name must be less than 255 characters'),
  category: nonEmptyString.max(100, 'Category must be less than 100 characters'),
  manufacturer: z.string().max(100, 'Manufacturer must be less than 100 characters').optional(),
  partNumber: z.string().max(50, 'Part number must be less than 50 characters').optional(),
  unit: nonEmptyString.max(20, 'Unit must be less than 20 characters'),
  unitPrice: positiveNumber.max(999999.99, 'Unit price must be less than 1,000,000'),
  unitNetPrice: z.coerce.number().min(0, 'Net price cannot be negative').max(999999.99, 'Net price must be less than 1,000,000').optional(),
  serviceDuration: z.coerce.number().int().min(0, 'Service duration cannot be negative').max(365, 'Service duration must be less than 365 days').optional(),
  estimatedLeadTime: z.coerce.number().int().min(0, 'Lead time cannot be negative').max(365, 'Lead time must be less than 365 days').optional(),
  pricingTerm: nonEmptyString.max(50, 'Pricing term must be less than 50 characters'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).max(10, 'Maximum 10 tags allowed').default([]),
  dependencies: z.array(z.object({
    itemId: nonEmptyString,
    quantity: positiveNumber.max(9999, 'Dependency quantity must be less than 10,000'),
    isOptional: z.boolean().default(false),
    description: z.string().max(255, 'Dependency description must be less than 255 characters').optional()
  })).default([]),
  metadata: z.object({
    isActive: z.boolean().default(true),
    stockLevel: z.coerce.number().int().min(0, 'Stock level cannot be negative').optional(),
    lastPriceUpdate: z.date().optional(),
    supplierInfo: z.object({
      name: z.string().max(100, 'Supplier name must be less than 100 characters').optional(),
      contact: z.string().max(100, 'Supplier contact must be less than 100 characters').optional(),
      email: email,
      website: url
    }).optional()
  }).default({}),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// BOQ Item validation schema (extends Item)
export const boqItemSchema = itemSchema.extend({
  quantity: positiveNumber.max(9999, 'Quantity must be less than 10,000'),
  isDependency: z.boolean().default(false),
  requiredBy: z.string().optional(),
  customPrice: z.coerce.number().min(0, 'Custom price cannot be negative').max(999999.99, 'Custom price must be less than 1,000,000').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  lineTotal: z.coerce.number().min(0, 'Line total cannot be negative').optional() // Calculated field
});

// Category validation schema
export const categorySchema = z.object({
  id: z.string().optional(),
  name: nonEmptyString.max(100, 'Category name must be less than 100 characters'),
  description: z.string().max(500, 'Category description must be less than 500 characters').optional(),
  parentCategory: z.string().max(100, 'Parent category must be less than 100 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0, 'Sort order cannot be negative').default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Project validation schema
export const projectSchema = z.object({
  id: z.string().optional(),
  name: nonEmptyString.max(255, 'Project name must be less than 255 characters'),
  description: z.string().max(2000, 'Project description must be less than 2000 characters').optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived'], {
    errorMap: () => ({ message: 'Status must be one of: draft, active, completed, archived' })
  }).default('draft'),
  metadata: z.object({
    client: z.string().max(255, 'Client name must be less than 255 characters').optional(),
    location: z.string().max(255, 'Location must be less than 255 characters').optional(),
    estimatedValue: z.coerce.number().min(0, 'Estimated value cannot be negative').max(99999999.99, 'Estimated value must be less than 100,000,000').optional(),
    deadline: z.date().optional(),
    tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).max(20, 'Maximum 20 tags allowed').default([])
  }).default({}),
  settings: z.object({
    currency: z.string().max(10, 'Currency must be less than 10 characters').default('USD'),
    taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').default(0),
    discountRate: z.coerce.number().min(0, 'Discount rate cannot be negative').max(100, 'Discount rate cannot exceed 100%').default(0),
    showPrices: z.boolean().default(true),
    showDescriptions: z.boolean().default(true),
    autoCalculateDependencies: z.boolean().default(true)
  }).default({
    currency: 'USD',
    taxRate: 0,
    discountRate: 0,
    showPrices: true,
    showDescriptions: true,
    autoCalculateDependencies: true
  }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Search filters validation schema
export const searchFiltersSchema = z.object({
  search: z.string().max(255, 'Search term must be less than 255 characters').default(''),
  category: z.string().max(100, 'Category must be less than 100 characters').default(''),
  priceRange: z.tuple([
    z.coerce.number().min(0, 'Minimum price cannot be negative'),
    z.coerce.number().min(0, 'Maximum price cannot be negative')
  ]).refine(([min, max]) => min <= max, 'Minimum price must be less than or equal to maximum price').default([0, 999999]),
  manufacturer: z.string().max(100, 'Manufacturer must be less than 100 characters').default(''),
  inStock: z.boolean().optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).max(10, 'Maximum 10 tags allowed').default([])
});

// Export configuration validation schema
export const exportConfigSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv'], {
    errorMap: () => ({ message: 'Format must be one of: pdf, excel, csv' })
  }),
  fields: z.array(z.string()).min(1, 'At least one field must be selected'),
  includeMetadata: z.boolean().default(true),
  includeSummary: z.boolean().default(true),
  groupByCategory: z.boolean().default(false),
  customTitle: z.string().max(255, 'Custom title must be less than 255 characters').optional(),
  template: z.string().max(100, 'Template name must be less than 100 characters').optional()
});

// Bulk operation validation schema
export const bulkOperationSchema = z.object({
  operation: z.enum(['add_to_boq', 'update_price', 'update_category', 'delete', 'export'], {
    errorMap: () => ({ message: 'Operation must be one of: add_to_boq, update_price, update_category, delete, export' })
  }),
  itemIds: z.array(z.string()).min(1, 'At least one item must be selected').max(1000, 'Maximum 1000 items can be processed at once'),
  data: z.record(z.any()).optional(), // Additional data for the operation
  confirmDestructive: z.boolean().default(false) // Required for delete operations
});

// Form validation schemas for different contexts
export const createItemFormSchema = itemSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateItemFormSchema = itemSchema.partial().required({ id: true });
export const createProjectFormSchema = projectSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateProjectFormSchema = projectSchema.partial().required({ id: true });
export const createCategoryFormSchema = categorySchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateCategoryFormSchema = categorySchema.partial().required({ id: true });

// Template validation schema
export const templateSchema = z.object({
  id: z.string().optional(),
  name: nonEmptyString.max(255, 'Template name must be less than 255 characters'),
  templateDescription: z.string().max(2000, 'Template description must be less than 2000 characters').optional(),
  templateCategory: z.string().max(100, 'Template category must be less than 100 characters').optional(),
  isPublic: z.boolean().default(false),
  usageCount: z.coerce.number().int().min(0, 'Usage count cannot be negative').default(0),
  templateData: z.record(z.any()).optional(), // JSON data for template structure
  createdBy: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Simplified schemas for UI forms that only use basic fields
export const simpleProjectFormSchema = z.object({
  name: nonEmptyString.max(255, 'Project name must be less than 255 characters'),
  description: z.string().max(2000, 'Project description must be less than 2000 characters').optional()
});

// Enhanced project form schema with metadata fields
export const enhancedProjectFormSchema = z.object({
  name: nonEmptyString.max(255, 'Project name must be less than 255 characters'),
  description: z.string().max(2000, 'Project description must be less than 2000 characters').optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived'], {
    errorMap: () => ({ message: 'Status must be one of: draft, active, completed, archived' })
  }).default('draft'),
  clientName: z.string().max(255, 'Client name must be less than 255 characters').optional(),
  clientContact: z.string().max(255, 'Client contact must be less than 255 characters').optional(),
  clientEmail: z.string().email('Invalid email format').or(z.literal('')).optional(),
  location: z.string().max(255, 'Location must be less than 255 characters').optional(),
  estimatedValue: z.string().refine((val) => {
    if (!val || val === '') return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 99999999.99;
  }, 'Estimated value must be a valid number between 0 and 99,999,999.99').optional(),
  deadline: z.string().refine((val) => {
    if (!val || val === '') return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format').optional(),
  priority: z.coerce.number().int().min(1, 'Priority must be at least 1').max(3, 'Priority must be at most 3').default(1),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional()
});

export const simpleCategoryFormSchema = z.object({
  name: nonEmptyString.max(100, 'Category name must be less than 100 characters')
});

export const templateFormSchema = z.object({
  name: nonEmptyString.max(255, 'Template name must be less than 255 characters'),
  templateDescription: z.string().max(2000, 'Template description must be less than 2000 characters').optional(),
  templateCategory: z.string().max(100, 'Template category must be less than 100 characters').optional(),
  isPublic: z.boolean().default(false)
});