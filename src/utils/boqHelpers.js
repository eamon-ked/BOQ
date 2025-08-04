// BOQ Helper Functions for Dependency Management

/**
 * Recursively resolves all dependencies for an item
 * @param {Object} item - The main item being added
 * @param {number} quantity - Quantity of the main item
 * @param {Array} masterDatabase - Complete item database
 * @param {Set} visited - Set to track visited items (prevents circular dependencies)
 * @returns {Array} Array of dependency items with calculated quantities
 */
export const resolveDependencies = (item, quantity, masterDatabase, visited = new Set()) => {
  const dependencies = [];

  // Prevent circular dependencies
  if (visited.has(item.id)) {
    console.warn(`Circular dependency detected for item: ${item.id}`);
    return dependencies;
  }

  visited.add(item.id);

  // Process each dependency
  if (item.dependencies && item.dependencies.length > 0) {
    item.dependencies.forEach(dep => {
      const dependencyItem = masterDatabase.find(dbItem => dbItem.id === dep.itemId);

      if (dependencyItem) {
        const dependencyQuantity = quantity * dep.quantity;

        // Add the dependency with calculated quantity
        dependencies.push({
          ...dependencyItem,
          quantity: dependencyQuantity,
          isDependency: true,
          requiredBy: item.id,
          requiredByName: item.name
        });

        // Recursively resolve nested dependencies
        const nestedDeps = resolveDependencies(
          dependencyItem,
          dependencyQuantity,
          masterDatabase,
          new Set(visited) // Create new Set to avoid affecting parent recursion
        );

        dependencies.push(...nestedDeps);
      }
    });
  }

  visited.delete(item.id);
  return dependencies;
};

/**
 * Adds or updates an item in the BOQ with automatic dependency resolution
 * @param {Array} currentBOQ - Current BOQ items
 * @param {Object} newItem - Item to add
 * @param {number} quantity - Quantity to add
 * @param {Array} masterDatabase - Complete item database
 * @returns {Array} Updated BOQ with dependencies
 */
export const addItemToBOQ = (currentBOQ, newItem, quantity, masterDatabase) => {
  let updatedBOQ = [...currentBOQ];

  // Add or update the main item
  const existingMainIndex = updatedBOQ.findIndex(
    item => item.id === newItem.id && !item.isDependency
  );

  if (existingMainIndex >= 0) {
    // Update existing main item quantity
    updatedBOQ[existingMainIndex] = {
      ...updatedBOQ[existingMainIndex],
      quantity: updatedBOQ[existingMainIndex].quantity + quantity
    };
  } else {
    // Add new main item
    updatedBOQ.push({
      ...newItem,
      quantity: quantity,
      isDependency: false
    });
  }

  // Resolve and add dependencies
  const dependencies = resolveDependencies(newItem, quantity, masterDatabase);

  dependencies.forEach(dep => {
    const existingDepIndex = updatedBOQ.findIndex(
      item => item.id === dep.id && item.isDependency && item.requiredBy === dep.requiredBy
    );

    if (existingDepIndex >= 0) {
      // Update existing dependency quantity
      updatedBOQ[existingDepIndex] = {
        ...updatedBOQ[existingDepIndex],
        quantity: updatedBOQ[existingDepIndex].quantity + dep.quantity
      };
    } else {
      // Add new dependency
      updatedBOQ.push(dep);
    }
  });

  return updatedBOQ;
};

/**
 * Updates the quantity of an item by ID and recalculates its dependencies
 * @param {Array} currentBOQ - Current BOQ items
 * @param {string} itemId - ID of item to update
 * @param {number} newQuantity - New quantity
 * @param {Array} masterDatabase - Complete item database
 * @returns {Array} Updated BOQ
 */
export const updateItemQuantityById = (currentBOQ, itemId, newQuantity, masterDatabase) => {
  let updatedBOQ = [...currentBOQ];

  // Find the main item by ID
  const mainItemIndex = updatedBOQ.findIndex(
    item => item.id === itemId && !item.isDependency
  );

  if (mainItemIndex === -1) {
    console.warn(`Main item with ID ${itemId} not found`);
    return currentBOQ;
  }

  const item = updatedBOQ[mainItemIndex];
  const oldQuantity = item.quantity;

  // Update main item quantity
  updatedBOQ[mainItemIndex] = {
    ...updatedBOQ[mainItemIndex],
    quantity: newQuantity
  };

  // Remove all existing dependencies for this item
  updatedBOQ = updatedBOQ.filter(boqItem =>
    !(boqItem.isDependency && boqItem.requiredBy === itemId)
  );

  // Add new dependencies with correct quantities
  const dependencies = resolveDependencies(item, newQuantity, masterDatabase);

  dependencies.forEach(dep => {
    updatedBOQ.push(dep);
  });

  return updatedBOQ;
};

/**
 * Legacy function for backward compatibility - now uses ID-based approach
 * @param {Array} currentBOQ - Current BOQ items
 * @param {number} itemIndex - Index of item to update (from grouped display)
 * @param {number} newQuantity - New quantity
 * @param {Array} masterDatabase - Complete item database
 * @returns {Array} Updated BOQ
 */
export const updateItemQuantity = (currentBOQ, itemIndex, newQuantity, masterDatabase) => {
  // Get the grouped items to find the correct item
  const groupedItems = groupBOQItems(currentBOQ);
  const displayItem = groupedItems[itemIndex];

  if (!displayItem || displayItem.isDependency) {
    console.warn('Cannot update dependency quantities directly');
    return currentBOQ;
  }

  return updateItemQuantityById(currentBOQ, displayItem.id, newQuantity, masterDatabase);
};

/**
 * Removes an item from BOQ by ID and cleans up its dependencies
 * @param {Array} currentBOQ - Current BOQ items
 * @param {string} itemId - ID of item to remove
 * @returns {Array} Updated BOQ
 */
export const removeItemFromBOQById = (currentBOQ, itemId) => {
  let updatedBOQ = [...currentBOQ];

  // Remove the main item
  updatedBOQ = updatedBOQ.filter(item =>
    !(item.id === itemId && !item.isDependency)
  );

  // Remove all dependencies of this item
  updatedBOQ = updatedBOQ.filter(item =>
    !(item.isDependency && item.requiredBy === itemId)
  );

  return updatedBOQ;
};

/**
 * Legacy function for backward compatibility - now uses ID-based approach
 * @param {Array} currentBOQ - Current BOQ items
 * @param {number} itemIndex - Index of item to remove (from grouped display)
 * @returns {Array} Updated BOQ
 */
export const removeItemFromBOQ = (currentBOQ, itemIndex) => {
  // Get the grouped items to find the correct item
  const groupedItems = groupBOQItems(currentBOQ);
  const displayItem = groupedItems[itemIndex];

  if (!displayItem) {
    console.warn('Item not found at index', itemIndex);
    return currentBOQ;
  }

  if (displayItem.isDependency) {
    console.warn('Cannot directly remove dependencies. Remove the parent item instead.');
    return currentBOQ;
  }

  return removeItemFromBOQById(currentBOQ, displayItem.id);
};

/**
 * Groups BOQ items by their dependency relationships for display
 * @param {Array} boqItems - BOQ items to group
 * @returns {Array} Grouped items with proper nesting
 */
export const groupBOQItems = (boqItems) => {
  const grouped = [];
  const mainItems = boqItems.filter(item => !item.isDependency);

  mainItems.forEach(mainItem => {
    // Add main item
    grouped.push({
      ...mainItem,
      level: 0
    });

    // Add its dependencies
    const dependencies = boqItems.filter(item =>
      item.isDependency && item.requiredBy === mainItem.id
    );

    dependencies.forEach(dep => {
      grouped.push({
        ...dep,
        level: 1
      });
    });
  });

  return grouped;
};

/**
 * Validates BOQ for consistency and completeness
 * @param {Array} boqItems - BOQ items to validate
 * @param {Array} masterDatabase - Complete item database
 * @returns {Object} Validation results
 */
export const validateBOQ = (boqItems, masterDatabase) => {
  const errors = [];
  const warnings = [];

  const mainItems = boqItems.filter(item => !item.isDependency);

  mainItems.forEach(mainItem => {
    const masterItem = masterDatabase.find(item => item.id === mainItem.id);

    if (masterItem && masterItem.dependencies) {
      masterItem.dependencies.forEach(dep => {
        const expectedQuantity = mainItem.quantity * dep.quantity;
        const actualDep = boqItems.find(item =>
          item.id === dep.itemId && item.isDependency && item.requiredBy === mainItem.id
        );

        if (!actualDep) {
          errors.push(`Missing dependency: ${dep.itemId} for ${mainItem.name}`);
        } else if (actualDep.quantity !== expectedQuantity) {
          warnings.push(
            `Quantity mismatch for ${actualDep.name}: expected ${expectedQuantity}, got ${actualDep.quantity}`
          );
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};