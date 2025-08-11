# BOQ Builder Technical Roadmap

## Phase 1: Foundation Improvements (Days 1-10)

### Day 1-2: State Management Refactor

#### Current Issues
- App.jsx has 20+ useState hooks
- Props drilling through multiple components
- Inconsistent state updates
- No centralized error handling

#### Implementation Plan

**Step 1: Install Dependencies**
```bash
npm install zustand immer
npm install --save-dev @types/node
```

**Step 2: Create Store Structure**
```javascript
// src/store/appStore.js
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export const useAppStore = create(
  immer((set, get) => ({
    // UI State
    ui: {
      isItemSelectorOpen: false,
      isExportOpen: false,
      isItemManagerOpen: false,
      // ... other modal states
    },
    
    // Data State
    data: {
      boqItems: [],
      masterDatabase: [],
      categories: [],
      currentProject: null,
    },
    
    // Loading State
    loading: {
      database: false,
      items: false,
      categories: false,
    },
    
    // Error State
    errors: {
      database: null,
      api: null,
    },
    
    // Actions
    actions: {
      setUIState: (key, value) => set(state => {
        state.ui[key] = value
      }),
      
      setDataState: (key, value) => set(state => {
        state.data[key] = value
      }),
      
      addBOQItem: (item, quantity) => set(state => {
        // Complex BOQ logic here
      }),
      
      // ... other actions
    }
  }))
)
```

**Step 3: Refactor App.jsx**
- Remove useState hooks
- Replace with useAppStore
- Simplify component logic

### Day 3-4: Error Handling System

#### Implementation Plan

**Step 1: Error Boundary Component**
```javascript
// src/components/ErrorBoundary.jsx
import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

**Step 2: Toast Notification System**
```javascript
// src/components/Toast.jsx
import React, { createContext, useContext, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}
```

### Day 5-6: Database Optimization

#### Current Issues
- No database indexes
- Synchronous queries blocking UI
- No query result caching
- Large result sets not paginated

#### Implementation Plan

**Step 1: Add Database Indexes**
```javascript
// server/database.js - Add to initializeTables()
initializeIndexes() {
  // Add indexes for better query performance
  this.db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
    CREATE INDEX IF NOT EXISTS idx_dependencies_item_id ON dependencies(item_id);
    CREATE INDEX IF NOT EXISTS idx_dependencies_dependency_id ON dependencies(dependency_id);
    CREATE INDEX IF NOT EXISTS idx_boq_items_project_id ON boq_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_boq_projects_updated_at ON boq_projects(updated_at);
  `);
}
```

**Step 2: Add Query Caching**
```javascript
// server/cache.js
class QueryCache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map()
    this.ttl = ttl
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    })
  }

  clear() {
    this.cache.clear()
  }
}

module.exports = QueryCache
```

**Step 3: Implement Pagination**
```javascript
// server/database.js - Update getItems method
getItems(page = 1, limit = 50, search = '', category = '') {
  const offset = (page - 1) * limit
  
  let query = `
    SELECT i.*, 
           GROUP_CONCAT(d.dependency_id || ':' || d.quantity) as dependencies_str
    FROM items i
    LEFT JOIN dependencies d ON i.id = d.item_id
    WHERE 1=1
  `
  
  const params = []
  
  if (search) {
    query += ` AND (i.name LIKE ? OR i.description LIKE ?)`
    params.push(`%${search}%`, `%${search}%`)
  }
  
  if (category) {
    query += ` AND i.category = ?`
    params.push(category)
  }
  
  query += ` GROUP BY i.id ORDER BY i.name LIMIT ? OFFSET ?`
  params.push(limit, offset)
  
  const items = this.db.prepare(query).all(...params)
  const total = this.getItemsCount(search, category)
  
  return {
    items: items.map(this.mapItemRow),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}
```

### Day 7-8: Form Validation System

#### Implementation Plan

**Step 1: Install Validation Dependencies**
```bash
npm install zod react-hook-form @hookform/resolvers
```

**Step 2: Create Validation Schemas**
```javascript
// src/schemas/itemSchema.js
import { z } from 'zod'

export const itemSchema = z.object({
  id: z.string().min(1, 'ID is required').max(50, 'ID too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z.number().min(0, 'Price must be positive'),
  unitNetPrice: z.number().min(0, 'Net price must be positive').optional(),
  serviceDuration: z.number().min(0, 'Duration must be positive').optional(),
  estimatedLeadTime: z.number().min(0, 'Lead time must be positive').optional(),
  pricingTerm: z.string().optional(),
  discount: z.number().min(0).max(100, 'Discount must be 0-100%').optional(),
  description: z.string().optional(),
  dependencies: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })).optional()
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name too long')
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional()
})
```

**Step 3: Create Form Hook**
```javascript
// src/hooks/useValidatedForm.js
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '../components/Toast'

export const useValidatedForm = (schema, defaultValues = {}) => {
  const { addToast } = useToast()
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  })

  const handleSubmit = (onSubmit) => {
    return form.handleSubmit(
      async (data) => {
        try {
          await onSubmit(data)
          addToast('Operation completed successfully', 'success')
        } catch (error) {
          addToast(error.message || 'An error occurred', 'error')
        }
      },
      (errors) => {
        const firstError = Object.values(errors)[0]?.message
        if (firstError) {
          addToast(firstError, 'error')
        }
      }
    )
  }

  return {
    ...form,
    handleSubmit
  }
}
```

### Day 9-10: Performance Optimization

#### Implementation Plan

**Step 1: Add React.memo to Components**
```javascript
// src/components/BOQTable.jsx - Add memoization
import React, { memo, useMemo } from 'react'

const BOQTableRow = memo(({ item, onUpdateQuantity, onRemoveItem }) => {
  // Component logic
})

const BOQTable = memo(({ items, onUpdateQuantity, onRemoveItem }) => {
  const memoizedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }))
  }, [items])

  return (
    // Table JSX
  )
})

export default BOQTable
```

**Step 2: Implement Virtual Scrolling**
```javascript
// src/components/VirtualizedList.jsx
import React, { memo } from 'react'
import { FixedSizeList as List } from 'react-window'

const VirtualizedItemList = memo(({ items, height = 400, itemHeight = 80 }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ItemCard item={items[index]} />
    </div>
  )

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  )
})

export default VirtualizedItemList
```

**Step 3: Code Splitting**
```javascript
// src/App.jsx - Add lazy loading
import React, { lazy, Suspense } from 'react'

const ItemManager = lazy(() => import('./components/ItemManager'))
const CategoryManager = lazy(() => import('./components/CategoryManager'))
const BOQExport = lazy(() => import('./components/BOQExport'))

const App = () => {
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        {isItemManagerOpen && <ItemManager />}
        {isCategoryManagerOpen && <CategoryManager />}
        {isExportOpen && <BOQExport />}
      </Suspense>
    </div>
  )
}
```

## Phase 2: Feature Enhancements (Days 11-20)

### Day 11-12: Advanced Search & Filtering

#### Implementation Plan

**Step 1: Enhanced Search Hook**
```javascript
// src/hooks/useAdvancedSearch.js
import { useState, useMemo, useCallback } from 'react'
import { debounce } from 'lodash'

export const useAdvancedSearch = (items, searchConfig) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceRange: [0, 10000],
    manufacturer: '',
    inStock: null
  })

  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
    }, 300),
    []
  )

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search in multiple fields
      const searchMatch = !filters.search || 
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(filters.search.toLowerCase())

      // Category filter
      const categoryMatch = !filters.category || item.category === filters.category

      // Price range filter
      const priceMatch = item.unitPrice >= filters.priceRange[0] && 
                        item.unitPrice <= filters.priceRange[1]

      // Manufacturer filter
      const manufacturerMatch = !filters.manufacturer || 
                               item.manufacturer === filters.manufacturer

      return searchMatch && categoryMatch && priceMatch && manufacturerMatch
    })
  }, [items, filters])

  return {
    filters,
    setFilters,
    filteredItems,
    debouncedSearch,
    resultCount: filteredItems.length
  }
}
```

### Day 13-14: Bulk Operations

#### Implementation Plan

**Step 1: Multi-Select Hook**
```javascript
// src/hooks/useMultiSelect.js
import { useState, useCallback } from 'react'

export const useMultiSelect = (items = []) => {
  const [selectedItems, setSelectedItems] = useState(new Set())

  const toggleItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(items.map(item => item.id)))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const isSelected = useCallback((itemId) => {
    return selectedItems.has(itemId)
  }, [selectedItems])

  return {
    selectedItems: Array.from(selectedItems),
    selectedCount: selectedItems.size,
    toggleItem,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selectedItems.size > 0
  }
}
```

**Step 2: Bulk Operations Component**
```javascript
// src/components/BulkOperations.jsx
import React from 'react'
import { Trash2, Plus, Edit3, Download } from 'lucide-react'

const BulkOperations = ({ 
  selectedItems, 
  onBulkAdd, 
  onBulkRemove, 
  onBulkEdit, 
  onBulkExport 
}) => {
  if (selectedItems.length === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-800">
          {selectedItems.length} items selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onBulkAdd(selectedItems)}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            <Plus size={14} />
            Add to BOQ
          </button>
          <button
            onClick={() => onBulkEdit(selectedItems)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            onClick={() => onBulkExport(selectedItems)}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => onBulkRemove(selectedItems)}
            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkOperations
```

### Day 15-16: Export Enhancements

#### Implementation Plan

**Step 1: Excel Export Utility**
```javascript
// src/utils/excelExport.js
import * as XLSX from 'xlsx'

export const exportToExcel = (boqItems, projectInfo = {}) => {
  // Create workbook
  const wb = XLSX.utils.book_new()

  // BOQ Summary Sheet
  const summaryData = [
    ['BOQ Summary'],
    ['Project Name:', projectInfo.name || 'Untitled Project'],
    ['Generated:', new Date().toLocaleDateString()],
    ['Total Items:', boqItems.length],
    ['Total Value:', `$${boqItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}`],
    [],
    ['Item', 'Category', 'Quantity', 'Unit Price', 'Total Price'],
    ...boqItems.map(item => [
      item.name,
      item.category,
      item.quantity,
      item.unitPrice,
      item.quantity * item.unitPrice
    ])
  ]

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'BOQ Summary')

  // Detailed Items Sheet
  const detailedData = [
    ['Detailed Item List'],
    [],
    ['ID', 'Name', 'Category', 'Manufacturer', 'Part Number', 'Unit', 'Unit Price', 'Quantity', 'Total', 'Description'],
    ...boqItems.map(item => [
      item.id,
      item.name,
      item.category,
      item.manufacturer || '',
      item.partNumber || '',
      item.unit,
      item.unitPrice,
      item.quantity,
      item.quantity * item.unitPrice,
      item.description || ''
    ])
  ]

  const detailedWs = XLSX.utils.aoa_to_sheet(detailedData)
  XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed Items')

  // Category Summary Sheet
  const categoryTotals = boqItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { count: 0, total: 0 }
    }
    acc[item.category].count += 1
    acc[item.category].total += item.quantity * item.unitPrice
    return acc
  }, {})

  const categoryData = [
    ['Category Summary'],
    [],
    ['Category', 'Item Count', 'Total Value'],
    ...Object.entries(categoryTotals).map(([category, data]) => [
      category,
      data.count,
      data.total
    ])
  ]

  const categoryWs = XLSX.utils.aoa_to_sheet(categoryData)
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Category Summary')

  // Generate and download file
  const fileName = `BOQ_${projectInfo.name || 'Export'}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
```

## Success Metrics & Testing

### Performance Benchmarks
- Initial load time: < 2 seconds (currently ~5 seconds)
- Database query time: < 50ms (currently ~200ms)
- Bundle size: < 300KB gzipped (currently ~800KB)
- Memory usage: < 100MB (currently ~200MB)

### Quality Gates
- ESLint: 0 errors, < 10 warnings
- Test coverage: > 80%
- Lighthouse score: > 90
- No console errors in production

### Monitoring Setup
```javascript
// src/utils/performance.js
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now()
    const result = await fn(...args)
    const end = performance.now()
    
    console.log(`${name} took ${end - start} milliseconds`)
    
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(end - start)
      })
    }
    
    return result
  }
}
```

This roadmap provides a structured approach to improving the BOQ Builder app with specific implementation details, code examples, and measurable success criteria.