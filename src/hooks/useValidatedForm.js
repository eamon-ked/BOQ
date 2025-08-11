import { useState, useCallback, useRef, useEffect } from 'react';
import { validateData } from '../validation/validators.js';
import { sanitize } from '../validation/sanitizers.js';

/**
 * Custom hook for managing form state with real-time validation
 * @param {Object} options - Configuration options
 * @param {*} options.schema - Zod schema for validation
 * @param {Object} options.defaultValues - Default form values
 * @param {string} options.mode - Validation mode: 'onChange', 'onBlur', 'onSubmit'
 * @param {string} options.revalidateMode - Revalidation mode: 'onChange', 'onBlur'
 * @param {boolean} options.sanitizeOnChange - Whether to sanitize values on change
 * @param {string} options.sanitizeType - Type for sanitization (item, project, category)
 * @param {Function} options.onSubmit - Submit handler function
 * @param {Function} options.onValidationChange - Callback when validation state changes
 * @returns {Object} Form state and methods
 */
export const useValidatedForm = (options = {}) => {
  const {
    schema,
    defaultValues = {},
    mode = 'onChange',
    revalidateMode = 'onChange',
    sanitizeOnChange = true,
    sanitizeType = 'item',
    onSubmit,
    onValidationChange
  } = options;

  // Form state
  const [values, setValuesState] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Refs for tracking
  const initialValues = useRef(defaultValues);
  const validationTimeoutRef = useRef(null);
  const lastValidationRef = useRef(null);

  // Computed states
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues.current);
  const isValid = Object.keys(errors).length === 0;
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;

  /**
   * Validates the entire form or a specific field
   * @param {Object} formData - Data to validate (defaults to current values)
   * @param {string} fieldName - Specific field to validate (optional)
   * @returns {Object} Validation result
   */
  const validateForm = useCallback((formData = values, fieldName = null) => {
    if (!schema) {
      return { isValid: true, errors: {}, warnings: {}, data: formData };
    }

    try {
      const result = validateData(schema, formData);

      // If validating a specific field, only return that field's validation
      if (fieldName) {
        return {
          isValid: !result.errors[fieldName],
          errors: result.errors[fieldName] ? { [fieldName]: result.errors[fieldName] } : {},
          warnings: result.warnings[fieldName] ? { [fieldName]: result.warnings[fieldName] } : {},
          data: result.data
        };
      }

      return result;
    } catch (error) {
      console.error('Form validation error:', error);
      return {
        isValid: false,
        errors: { _general: 'Validation failed due to an unexpected error' },
        warnings: {},
        data: null
      };
    }
  }, [schema, values]);

  /**
   * Debounced validation function
   * @param {Object} formData - Data to validate
   * @param {string} fieldName - Specific field to validate
   * @param {number} delay - Debounce delay in milliseconds
   */
  const debouncedValidate = useCallback((formData, fieldName = null, delay = 300) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      setIsValidating(true);

      const result = validateForm(formData, fieldName);

      if (fieldName) {
        // Update only the specific field's error
        setErrors(prev => ({
          ...prev,
          ...result.errors
        }));
        setWarnings(prev => ({
          ...prev,
          ...result.warnings
        }));
      } else {
        // Update all errors
        setErrors(result.errors);
        setWarnings(result.warnings);
      }

      setIsValidating(false);
      lastValidationRef.current = result;

      // Call validation change callback
      if (onValidationChange) {
        onValidationChange(result);
      }
    }, delay);
  }, [validateForm, onValidationChange]);

  /**
   * Sets a single field value with optional validation
   * @param {string} fieldName - Name of the field
   * @param {*} value - New value
   * @param {boolean} shouldValidate - Whether to validate after setting
   */
  const setValue = useCallback((fieldName, value, shouldValidate = true) => {
    // For individual field updates, use general sanitization for strings
    let sanitizedValue = value;
    if (sanitizeOnChange && typeof value === 'string') {
      sanitizedValue = sanitize(value, 'general');
    }

    // Prevent objects from being set as field values (except for arrays and specific object fields)
    if (typeof sanitizedValue === 'object' && sanitizedValue !== null && !Array.isArray(sanitizedValue)) {
      // Allow objects only for specific fields like metadata
      if (!['metadata', 'tags', 'dependencies'].includes(fieldName)) {
        const isEmptyObject = Object.keys(sanitizedValue).length === 0;
        console.warn(`Attempted to set ${isEmptyObject ? 'empty ' : ''}object as value for field ${fieldName}, converting to empty string:`, sanitizedValue);
        sanitizedValue = '';
      }
    }

    // Update values
    const newValues = { ...values, [fieldName]: sanitizedValue };

    setValuesState(newValues);

    // Mark field as touched
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Clear field error if it exists
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Validate if required
    if (shouldValidate && (mode === 'onChange' || (revalidateMode === 'onChange' && touched[fieldName]))) {
      debouncedValidate(newValues, fieldName);
    }
  }, [values, errors, touched, sanitizeOnChange, mode, revalidateMode, debouncedValidate]);

  /**
   * Sets multiple field values at once
   * @param {Object} newValues - Object with field names as keys and new values
   * @param {boolean} shouldValidate - Whether to validate after setting
   */
  const setValues = useCallback((newValues, shouldValidate = true) => {
    console.log('setValues - Input newValues:', newValues);

    // Sanitize values if enabled
    let sanitizedValues = newValues;
    if (sanitizeOnChange) {
      console.log('setValues - Sanitizing values, sanitizeType:', sanitizeType);
      sanitizedValues = Object.keys(newValues).reduce((acc, key) => {
        const value = newValues[key];
        console.log(`setValues - Sanitizing ${key}:`, value, 'type:', typeof value);

        // For individual field updates, use general sanitization for strings
        if (typeof value === 'string') {
          acc[key] = sanitize(value, 'general');
        } else {
          acc[key] = value;
        }

        console.log(`setValues - After sanitize ${key}:`, acc[key], 'type:', typeof acc[key]);
        return acc;
      }, {});
    }

    console.log('setValues - After sanitization:', sanitizedValues);

    // Prevent objects from being set as field values (except for specific fields)
    const processedValues = Object.keys(sanitizedValues).reduce((acc, key) => {
      const value = sanitizedValues[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Allow objects only for specific fields like metadata
        if (!['metadata', 'tags', 'dependencies'].includes(key)) {
          // Check if it's an empty object
          if (Object.keys(value).length === 0) {
            console.warn(`Attempted to set empty object as value for field ${key}, converting to empty string:`, value);
            acc[key] = '';
          } else {
            console.warn(`Attempted to set object as value for field ${key}, converting to empty string:`, value);
            acc[key] = '';
          }
        } else {
          acc[key] = value;
        }
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log('setValues - After processing:', processedValues);

    // Update values
    const updatedValues = { ...values, ...processedValues };

    setValuesState(updatedValues);

    // Mark fields as touched
    const touchedFields = Object.keys(processedValues).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(prev => ({ ...prev, ...touchedFields }));

    // Clear errors for updated fields
    const fieldsToUpdate = Object.keys(processedValues);
    const hasErrorsToUpdate = fieldsToUpdate.some(field => errors[field]);

    if (hasErrorsToUpdate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        fieldsToUpdate.forEach(field => {
          delete newErrors[field];
        });
        return newErrors;
      });
    }

    // Validate if required
    if (shouldValidate && mode === 'onChange') {
      debouncedValidate(updatedValues);
    }
  }, [values, errors, sanitizeOnChange, sanitizeType, mode, debouncedValidate]);

  /**
   * Handles field blur events
   * @param {string} fieldName - Name of the field that was blurred
   */
  const handleBlur = useCallback((fieldName) => {
    // Mark field as touched
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Validate if required
    if (mode === 'onBlur' || (revalidateMode === 'onBlur' && touched[fieldName])) {
      debouncedValidate(values, fieldName);
    }
  }, [values, touched, mode, revalidateMode, debouncedValidate]);

  /**
   * Sets a field error manually
   * @param {string} fieldName - Name of the field
   * @param {string} errorMessage - Error message
   */
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
  }, []);

  /**
   * Clears a field error
   * @param {string} fieldName - Name of the field
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Clears all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
    setWarnings({});
  }, []);

  /**
   * Resets the form to initial values
   * @param {Object} newDefaultValues - New default values (optional)
   */
  const reset = useCallback((newDefaultValues = null) => {
    const resetValues = newDefaultValues || initialValues.current;
    setValuesState(resetValues);
    setErrors({});
    setWarnings({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);

    if (newDefaultValues) {
      initialValues.current = newDefaultValues;
    }
  }, []);

  /**
   * Handles form submission with validation
   * @param {Event} event - Form submit event (optional)
   * @returns {Promise} Promise that resolves with submission result
   */
  const handleSubmit = useCallback(async (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    try {
      // Validate the entire form
      const validationResult = validateForm(values);

      if (!validationResult.isValid) {
        setErrors(validationResult.errors);
        setWarnings(validationResult.warnings);

        // Focus first error field if possible
        const firstErrorField = Object.keys(validationResult.errors)[0];
        if (firstErrorField && typeof document !== 'undefined') {
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
          if (errorElement && errorElement.focus) {
            errorElement.focus();
          }
        }

        throw new Error('Form validation failed');
      }

      // Clear any existing errors
      setErrors({});
      setWarnings(validationResult.warnings);

      // Call submit handler if provided
      if (onSubmit) {
        const result = await onSubmit(validationResult.data, {
          originalValues: values,
          isDirty,
          submitCount: submitCount + 1
        });
        return result;
      }

      return validationResult.data;
    } catch (error) {
      // If it's not a validation error, set a general error
      if (error.message !== 'Form validation failed') {
        setErrors(prev => ({
          ...prev,
          _general: error.message || 'An error occurred during form submission'
        }));
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit, isDirty, submitCount]);

  /**
   * Gets field props for easy integration with form inputs
   * @param {string} fieldName - Name of the field
   * @param {Object} options - Additional options
   * @returns {Object} Props object for the field
   */
  const getFieldProps = useCallback((fieldName, options = {}) => {
    const {
      type = 'text',
      validateOnChange = mode === 'onChange',
      validateOnBlur = mode === 'onBlur' || revalidateMode === 'onBlur'
    } = options;

    // Get the raw value
    const rawValue = values[fieldName];

    // Convert value to appropriate type for input
    let inputValue = '';
    if (rawValue !== null && rawValue !== undefined) {
      if (type === 'checkbox') {
        inputValue = Boolean(rawValue);
      } else if (type === 'number') {
        // For number inputs, ensure we have a valid number or empty string
        const numValue = Number(rawValue);
        inputValue = isNaN(numValue) || numValue === 0 ? '' : String(numValue);
      } else if (typeof rawValue === 'object') {
        // If it's an object, don't display it - return empty string
        console.warn(`Field ${fieldName} contains object value, converting to empty string:`, rawValue);
        inputValue = '';
      } else {
        inputValue = String(rawValue);
      }
    }

    return {
      name: fieldName,
      value: inputValue,
      onChange: (event) => {
        const value = type === 'checkbox' ? event.target.checked : event.target.value;
        setValue(fieldName, value, validateOnChange);
      },
      onBlur: validateOnBlur ? () => handleBlur(fieldName) : undefined,
      'aria-invalid': !!errors[fieldName],
      'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined
    };
  }, [values, errors, warnings, touched, mode, revalidateMode, setValue, handleBlur]);

  /**
   * Gets field state information
   * @param {string} fieldName - Name of the field
   * @returns {Object} Field state object
   */
  const getFieldState = useCallback((fieldName) => {
    return {
      value: values[fieldName],
      error: errors[fieldName],
      warning: warnings[fieldName],
      touched: touched[fieldName],
      isDirty: values[fieldName] !== initialValues.current[fieldName],
      isValid: !errors[fieldName]
    };
  }, [values, errors, warnings, touched]);

  // Effect to validate on mount if mode is onChange
  useEffect(() => {
    if (mode === 'onChange' && schema) {
      debouncedValidate(values);
    }
  }, []); // Only run on mount

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Form state
    values,
    errors,
    warnings,
    touched,
    isSubmitting,
    isValidating,
    submitCount,

    // Computed state
    isDirty,
    isValid,
    hasErrors,
    hasWarnings,

    // Form methods
    setValue,
    setValues,
    setFieldError,
    clearFieldError,
    clearErrors,
    reset,
    handleSubmit,
    handleBlur,

    // Validation methods
    validateForm,

    // Helper methods
    getFieldProps,
    getFieldState,

    // Validation result
    lastValidation: lastValidationRef.current
  };
};

/**
 * Hook for managing form arrays (dynamic lists of form fields)
 * @param {Object} options - Configuration options
 * @param {*} options.schema - Zod schema for array items
 * @param {Array} options.defaultItems - Default array items
 * @param {number} options.maxItems - Maximum number of items allowed
 * @param {Function} options.createDefaultItem - Function to create a new default item
 * @returns {Object} Array form state and methods
 */
export const useValidatedFormArray = (options = {}) => {
  const {
    schema,
    defaultItems = [],
    maxItems = 100,
    createDefaultItem = () => ({})
  } = options;

  const [items, setItems] = useState(defaultItems);
  const [errors, setErrors] = useState({});

  /**
   * Adds a new item to the array
   * @param {Object} item - Item to add (optional, uses createDefaultItem if not provided)
   * @param {number} index - Index to insert at (optional, appends if not provided)
   */
  const addItem = useCallback((item = null, index = null) => {
    if (items.length >= maxItems) {
      console.warn(`Cannot add more than ${maxItems} items`);
      return;
    }

    const newItem = item || createDefaultItem();
    const insertIndex = index !== null ? index : items.length;

    setItems(prev => {
      const newItems = [...prev];
      newItems.splice(insertIndex, 0, newItem);
      return newItems;
    });
  }, [items.length, maxItems, createDefaultItem]);

  /**
   * Removes an item from the array
   * @param {number} index - Index of item to remove
   */
  const removeItem = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));

    // Clear errors for removed item
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];

      // Shift errors for items after the removed index
      const shiftedErrors = {};
      Object.keys(newErrors).forEach(key => {
        const errorIndex = parseInt(key);
        if (errorIndex > index) {
          shiftedErrors[errorIndex - 1] = newErrors[key];
        } else {
          shiftedErrors[key] = newErrors[key];
        }
      });

      return shiftedErrors;
    });
  }, []);

  /**
   * Updates an item in the array
   * @param {number} index - Index of item to update
   * @param {Object} updates - Updates to apply
   */
  const updateItem = useCallback((index, updates) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], ...updates };
      return newItems;
    });

    // Clear error for updated item
    if (errors[index]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Moves an item to a different position
   * @param {number} fromIndex - Current index
   * @param {number} toIndex - Target index
   */
  const moveItem = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    setItems(prev => {
      const newItems = [...prev];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return newItems;
    });
  }, []);

  /**
   * Validates all items in the array
   * @returns {Object} Validation result
   */
  const validateItems = useCallback(() => {
    if (!schema) {
      return { isValid: true, errors: {}, validItems: items };
    }

    const validationErrors = {};
    const validItems = [];
    let isValid = true;

    items.forEach((item, index) => {
      try {
        const result = validateData(schema, item);
        if (result.isValid) {
          validItems.push(result.data);
        } else {
          validationErrors[index] = result.errors;
          isValid = false;
        }
      } catch (error) {
        validationErrors[index] = { _general: 'Validation failed' };
        isValid = false;
      }
    });

    setErrors(validationErrors);

    return {
      isValid,
      errors: validationErrors,
      validItems
    };
  }, [items, schema]);

  return {
    items,
    errors,
    addItem,
    removeItem,
    updateItem,
    moveItem,
    validateItems,
    canAddMore: items.length < maxItems,
    isEmpty: items.length === 0,
    count: items.length
  };
};

export default useValidatedForm;