import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveDependencies,
  addItemToBOQ,
  updateItemQuantityById,
  removeItemFromBOQById,
  groupBOQItems,
  validateBOQ
} from '../boqHelpers.js';

describe('BOQ Helpers', () => {
  let masterDatabase;
  let sampleBOQ;

  beforeEach(() => {
    masterDatabase = [
      {
        id: 'item1',
        name: 'Main Item 1',
        unitPrice: 100,
        dependencies: [
          { itemId: 'item2', quantity: 2 },
          { itemId: 'item3', quantity: 1 }
        ]
      },
      {
        id: 'item2',
        name: 'Dependency Item 2',
        unitPrice: 50,
        dependencies: [
          { itemId: 'item4', quantity: 1 }
        ]
      },
      {
        id: 'item3',
        name: 'Dependency Item 3',
        unitPrice: 25,
        dependencies: []
      },
      {
        id: 'item4',
        name: 'Nested Dependency Item 4',
        unitPrice: 10,
        dependencies: []
      },
      {
        id: 'item5',
        name: 'Circular Item 5',
        unitPrice: 75,
        dependencies: [
          { itemId: 'item6', quantity: 1 }
        ]
      },
      {
        id: 'item6',
        name: 'Circular Item 6',
        unitPrice: 30,
        dependencies: [
          { itemId: 'item5', quantity: 1 }
        ]
      }
    ];

    sampleBOQ = [
      {
        id: 'item1',
        name: 'Main Item 1',
        quantity: 5,
        isDependency: false
      },
      {
        id: 'item2',
        name: 'Dependency Item 2',
        quantity: 10,
        isDependency: true,
        requiredBy: 'item1'
      }
    ];
  });

  describe('resolveDependencies', () => {
    it('should resolve simple dependencies correctly', () => {
      const item = masterDatabase[0]; // item1
      const dependencies = resolveDependencies(item, 1, masterDatabase);

      expect(dependencies).toHaveLength(3);
      expect(dependencies[0].id).toBe('item2');
      expect(dependencies[0].quantity).toBe(2);
      expect(dependencies[1].id).toBe('item3');
      expect(dependencies[1].quantity).toBe(1);
      expect(dependencies[2].id).toBe('item4'); // nested dependency
      expect(dependencies[2].quantity).toBe(2);
    });

    it('should handle quantity multiplication correctly', () => {
      const item = masterDatabase[0]; // item1
      const dependencies = resolveDependencies(item, 3, masterDatabase);

      expect(dependencies[0].quantity).toBe(6); // 3 * 2
      expect(dependencies[1].quantity).toBe(3); // 3 * 1
      expect(dependencies[2].quantity).toBe(6); // 3 * 2 * 1
    });

    it('should prevent circular dependencies', () => {
      const item = masterDatabase[4]; // item5 (circular)
      const dependencies = resolveDependencies(item, 1, masterDatabase);

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].id).toBe('item6');
    });

    it('should handle items with no dependencies', () => {
      const item = masterDatabase[2]; // item3
      const dependencies = resolveDependencies(item, 1, masterDatabase);

      expect(dependencies).toHaveLength(0);
    });
  });

  describe('addItemToBOQ', () => {
    it('should add new item with dependencies', () => {
      const newItem = masterDatabase[0]; // item1
      const updatedBOQ = addItemToBOQ([], newItem, 2, masterDatabase);

      expect(updatedBOQ).toHaveLength(4); // main + 3 dependencies
      
      const mainItem = updatedBOQ.find(item => item.id === 'item1' && !item.isDependency);
      expect(mainItem.quantity).toBe(2);
      
      const dep2 = updatedBOQ.find(item => item.id === 'item2' && item.isDependency);
      expect(dep2.quantity).toBe(4); // 2 * 2
    });

    it('should update existing item quantity', () => {
      const existingBOQ = [
        { id: 'item1', name: 'Main Item 1', quantity: 3, isDependency: false }
      ];
      
      const newItem = masterDatabase[0]; // item1
      const updatedBOQ = addItemToBOQ(existingBOQ, newItem, 2, masterDatabase);

      const mainItem = updatedBOQ.find(item => item.id === 'item1' && !item.isDependency);
      expect(mainItem.quantity).toBe(5); // 3 + 2
    });
  });

  describe('updateItemQuantityById', () => {
    it('should update item quantity and recalculate dependencies', () => {
      const boq = [
        { id: 'item1', name: 'Main Item 1', quantity: 2, isDependency: false },
        { id: 'item2', name: 'Dependency Item 2', quantity: 4, isDependency: true, requiredBy: 'item1' }
      ];

      const updatedBOQ = updateItemQuantityById(boq, 'item1', 5, masterDatabase);
      
      const mainItem = updatedBOQ.find(item => item.id === 'item1' && !item.isDependency);
      expect(mainItem.quantity).toBe(5);
      
      const dep = updatedBOQ.find(item => item.id === 'item2' && item.isDependency);
      expect(dep.quantity).toBe(10); // 5 * 2
    });

    it('should handle non-existent item gracefully', () => {
      const originalBOQ = [...sampleBOQ];
      const updatedBOQ = updateItemQuantityById(sampleBOQ, 'nonexistent', 5, masterDatabase);
      
      expect(updatedBOQ).toEqual(originalBOQ);
    });
  });

  describe('removeItemFromBOQById', () => {
    it('should remove item and its dependencies', () => {
      const boq = [
        { id: 'item1', name: 'Main Item 1', quantity: 2, isDependency: false },
        { id: 'item2', name: 'Dependency Item 2', quantity: 4, isDependency: true, requiredBy: 'item1' },
        { id: 'item3', name: 'Other Item', quantity: 1, isDependency: false }
      ];

      const updatedBOQ = removeItemFromBOQById(boq, 'item1');
      
      expect(updatedBOQ).toHaveLength(1);
      expect(updatedBOQ[0].id).toBe('item3');
    });

    it('should handle non-existent item gracefully', () => {
      const originalBOQ = [...sampleBOQ];
      const updatedBOQ = removeItemFromBOQById(sampleBOQ, 'nonexistent');
      
      expect(updatedBOQ).toEqual(originalBOQ);
    });
  });

  describe('groupBOQItems', () => {
    it('should group items with proper nesting levels', () => {
      const boq = [
        { id: 'item1', name: 'Main Item 1', quantity: 2, isDependency: false },
        { id: 'item2', name: 'Dependency Item 2', quantity: 4, isDependency: true, requiredBy: 'item1' },
        { id: 'item3', name: 'Main Item 3', quantity: 1, isDependency: false }
      ];

      const grouped = groupBOQItems(boq);
      
      expect(grouped).toHaveLength(3);
      expect(grouped[0].level).toBe(0); // main item
      expect(grouped[1].level).toBe(1); // dependency
      expect(grouped[2].level).toBe(0); // main item
    });
  });

  describe('validateBOQ', () => {
    it('should validate correct BOQ', () => {
      const boq = [
        { id: 'item1', name: 'Main Item 1', quantity: 2, isDependency: false },
        { id: 'item2', name: 'Dependency Item 2', quantity: 4, isDependency: true, requiredBy: 'item1' },
        { id: 'item3', name: 'Dependency Item 3', quantity: 2, isDependency: true, requiredBy: 'item1' }
      ];

      const validation = validateBOQ(boq, masterDatabase);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing dependencies', () => {
      const boq = [
        { id: 'item1', name: 'Main Item 1', quantity: 2, isDependency: false }
        // Missing dependencies
      ];

      const validation = validateBOQ(boq, masterDatabase);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect quantity mismatches', () => {
      const boq = [
        { id: 'item1', name: 'Main Item 1', quantity: 2, isDependency: false },
        { id: 'item2', name: 'Dependency Item 2', quantity: 3, isDependency: true, requiredBy: 'item1' } // Should be 4
      ];

      const validation = validateBOQ(boq, masterDatabase);
      
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });
});