# useAsyncOperation Hook

The `useAsyncOperation` hook provides a comprehensive solution for managing async operations with loading states, error handling, and retry mechanisms in React applications.

## Features

- **Loading State Management**: Automatic loading state tracking with optional store persistence
- **Error Handling**: Comprehensive error handling with retry logic and toast notifications
- **Retry Mechanisms**: Configurable retry attempts with exponential backoff
- **Cancellation Support**: Built-in operation cancellation using AbortController
- **Flickering Prevention**: Minimum loading time to prevent UI flickering
- **Store Integration**: Optional integration with Zustand store for global state management

## Basic Usage

```javascript
import { useAsyncOperation } from '../hooks/useAsyncOperation.js';

const MyComponent = () => {
  const operation = useAsyncOperation({
    key: 'my-operation',
    showToast: true,
    retryAttempts: 3
  });

  const handleClick = async () => {
    try {
      const result = await operation.execute(async ({ signal }) => {
        const response = await fetch('/api/data', { signal });
        return response.json();
      });
      console.log('Success:', result);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleClick} 
        disabled={operation.isLoading}
      >
        {operation.isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
      
      {operation.hasError && (
        <div className="error">
          Error: {operation.error.message}
          <button onClick={operation.clearError}>Clear</button>
        </div>
      )}
      
      {operation.hasData && (
        <div>Data: {JSON.stringify(operation.data)}</div>
      )}
    </div>
  );
};
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | string | undefined | Unique key for store persistence |
| `showToast` | boolean | true | Show toast notifications |
| `persistLoading` | boolean | true | Persist loading state in store |
| `retryAttempts` | number | 3 | Maximum retry attempts |
| `retryDelay` | number | 1000 | Base delay between retries (ms) |
| `exponentialBackoff` | boolean | true | Use exponential backoff for retries |
| `timeout` | number | 30000 | Operation timeout (ms) |
| `preventFlickering` | boolean | true | Prevent UI flickering |
| `minLoadingTime` | number | 300 | Minimum loading time (ms) |
| `onSuccess` | function | undefined | Success callback |
| `onError` | function | undefined | Error callback |

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isLoading` | boolean | Current loading state |
| `error` | Error \| null | Current error state |
| `data` | any | Last successful result |
| `retryCount` | number | Current retry attempt |
| `isRetrying` | boolean | Whether currently retrying |
| `canRetry` | boolean | Whether retry is possible |
| `hasError` | boolean | Whether there's an error |
| `hasData` | boolean | Whether there's data |
| `execute` | function | Execute async operation |
| `cancel` | function | Cancel current operation |
| `reset` | function | Reset all state |
| `retry` | function | Manually retry operation |
| `clearError` | function | Clear error state |

## Advanced Usage

### With Database Operations

```javascript
import { useAsyncOperation } from '../hooks/useAsyncOperation.js';
import databaseService from '../services/database.js';

const useItemOperations = () => {
  const loadItems = useAsyncOperation({
    key: 'load-items',
    showToast: false,
    retryAttempts: 1
  });

  const addItem = useAsyncOperation({
    key: 'add-item',
    showToast: true,
    onSuccess: () => {
      // Refresh items after successful add
      loadItemsData();
    }
  });

  const loadItemsData = async () => {
    return loadItems.execute(async ({ signal }) => {
      return await databaseService.getItems();
    });
  };

  const addItemData = async (item) => {
    return addItem.execute(async ({ signal }) => {
      return await databaseService.addItem(item);
    }, {
      successMessage: `Item "${item.name}" added successfully`
    });
  };

  return {
    // States
    isLoadingItems: loadItems.isLoading,
    isAddingItem: addItem.isLoading,
    itemsError: loadItems.error,
    addItemError: addItem.error,
    items: loadItems.data,

    // Operations
    loadItemsData,
    addItemData,
    
    // Utilities
    clearErrors: () => {
      loadItems.clearError();
      addItem.clearError();
    }
  };
};
```

### With Form Submissions

```javascript
const useFormSubmission = () => {
  const submitForm = useAsyncOperation({
    key: 'form-submit',
    showToast: true,
    retryAttempts: 1,
    onSuccess: (result) => {
      // Handle successful submission
      console.log('Form submitted successfully:', result);
    },
    onError: (error) => {
      // Handle submission error
      console.error('Form submission failed:', error);
    }
  });

  const handleSubmit = async (formData) => {
    return submitForm.execute(async ({ signal }) => {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    }, {
      successMessage: 'Form submitted successfully!'
    });
  };

  return {
    isSubmitting: submitForm.isLoading,
    submitError: submitForm.error,
    handleSubmit,
    clearError: submitForm.clearError
  };
};
```

## Error Handling

The hook automatically determines which errors are retryable:

- **Retryable**: Network errors, server errors (5xx), timeout errors, rate limiting (429)
- **Non-retryable**: Client errors (4xx), validation errors

You can customize error handling with callbacks:

```javascript
const operation = useAsyncOperation({
  onError: (error, context) => {
    if (error.status === 401) {
      // Handle authentication error
      redirectToLogin();
    } else if (error.status === 403) {
      // Handle authorization error
      showPermissionError();
    }
  }
});
```

## Integration with Store

The hook integrates seamlessly with the Zustand store for global state management:

```javascript
// Loading states are automatically persisted in the store
const operation = useAsyncOperation({
  key: 'my-operation',
  persistLoading: true // Default
});

// Access global loading state from store
const isGloballyLoading = useAppStore(state => state.loading['my-operation']);
```

## Best Practices

1. **Use descriptive keys** for operations that need store persistence
2. **Disable toast notifications** for frequently called operations
3. **Set appropriate retry attempts** based on operation criticality
4. **Use cancellation** for operations that might become stale
5. **Handle success/error callbacks** for side effects
6. **Clear errors** when appropriate to improve UX

## Testing

The hook is fully tested with comprehensive test coverage. See `src/hooks/__tests__/useAsyncOperation.comprehensive.test.js` for examples of how to test components using this hook.

```javascript
import { renderHook, act } from '@testing-library/react';
import { useAsyncOperation } from '../useAsyncOperation.js';

test('should execute operation successfully', async () => {
  const { result } = renderHook(() => useAsyncOperation({ preventFlickering: false }));
  const mockOperation = vi.fn().mockResolvedValue('test result');

  await act(async () => {
    await result.current.execute(mockOperation);
  });

  expect(result.current.data).toBe('test result');
  expect(result.current.isLoading).toBe(false);
  expect(result.current.error).toBe(null);
});
```