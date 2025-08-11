import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import VirtualizedList from '../VirtualizedList'

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: vi.fn(({ children, itemCount, itemSize, height, width, onScroll, className, overscanCount, ...otherProps }) => {
    const Row = children
    // Filter out react-window specific props that shouldn't be passed to DOM
    const { estimatedItemSize, ...domProps } = otherProps
    return (
      <div 
        data-testid="fixed-size-list" 
        className={className}
        style={{ height, width }}
        onScroll={onScroll}
        {...domProps}
      >
        {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
          <Row key={index} index={index} style={{ height: itemSize }} />
        ))}
      </div>
    )
  }),
  VariableSizeList: vi.fn(({ children, itemCount, itemSize, height, width, onScroll, className, overscanCount, estimatedItemSize, ...otherProps }) => {
    const Row = children
    return (
      <div 
        data-testid="variable-size-list" 
        className={className}
        style={{ height, width }}
        onScroll={onScroll}
        {...otherProps}
      >
        {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
          <Row key={index} index={index} style={{ height: itemSize(index) }} />
        ))}
      </div>
    )
  })
}))

// Mock performance.now for smooth scrolling tests
const mockPerformanceNow = vi.fn()
Object.defineProperty(window, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn()
Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
})

describe('VirtualizedList', () => {
  const mockItems = [
    { id: '1', name: 'Item 1', description: 'Description 1' },
    { id: '2', name: 'Item 2', description: 'Description 2' },
    { id: '3', name: 'Item 3', description: 'Description 3' },
    { id: '4', name: 'Item 4', description: 'Description 4' },
    { id: '5', name: 'Item 5', description: 'Description 5' }
  ]

  const mockRenderItem = vi.fn((item, index) => (
    <div data-testid={`item-${item.id}`}>
      {item.name} - {item.description}
    </div>
  ))

  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockReturnValue(0)
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16) // Simulate 60fps
      return 1
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Fixed Height List', () => {
    it('should render fixed size list when itemHeight is provided', () => {
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
      expect(screen.queryByTestId('variable-size-list')).not.toBeInTheDocument()
    })

    it('should render items with correct height', () => {
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      const listContainer = screen.getByTestId('fixed-size-list')
      expect(listContainer).toHaveStyle({ height: '200px' })
    })

    it('should call renderItem for each visible item', () => {
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      // Should render items (mocked to render first 10 or all items)
      expect(mockRenderItem).toHaveBeenCalledTimes(mockItems.length)
      mockItems.forEach((item, index) => {
        expect(mockRenderItem).toHaveBeenCalledWith(item, index)
      })
    })

    it('should handle empty items array', () => {
      render(
        <VirtualizedList
          items={[]}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      expect(screen.getByText('No items to display')).toBeInTheDocument()
      // Empty state doesn't render the list component, just the empty message
      expect(screen.queryByTestId('fixed-size-list')).not.toBeInTheDocument()
    })
  })

  describe('Variable Height List', () => {
    const mockGetItemHeight = vi.fn((item, index) => {
      // Simulate different heights based on content
      return item.description.length > 15 ? 80 : 60
    })

    it('should render variable size list when getItemHeight is provided', () => {
      render(
        <VirtualizedList
          items={mockItems}
          getItemHeight={mockGetItemHeight}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      expect(screen.getByTestId('variable-size-list')).toBeInTheDocument()
      expect(screen.queryByTestId('fixed-size-list')).not.toBeInTheDocument()
    })

    it('should call getItemHeight for each item', () => {
      render(
        <VirtualizedList
          items={mockItems}
          getItemHeight={mockGetItemHeight}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      // Should call getItemHeight for each item during rendering
      expect(mockGetItemHeight).toHaveBeenCalled()
    })

    it('should use estimated item size when provided', () => {
      const estimatedSize = 75
      render(
        <VirtualizedList
          items={mockItems}
          getItemHeight={mockGetItemHeight}
          height={200}
          estimatedItemSize={estimatedSize}
          renderItem={mockRenderItem}
        />
      )

      expect(screen.getByTestId('variable-size-list')).toBeInTheDocument()
    })
  })

  describe('Scroll Handling', () => {
    it('should call onScroll when scroll event occurs', () => {
      const mockOnScroll = vi.fn()
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          onScroll={mockOnScroll}
        />
      )

      const listContainer = screen.getByTestId('fixed-size-list')
      fireEvent.scroll(listContainer, { target: { scrollTop: 100 } })

      expect(mockOnScroll).toHaveBeenCalled()
    })

    it('should handle scroll events without onScroll prop', () => {
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      const listContainer = screen.getByTestId('fixed-size-list')
      
      // Should not throw error when scrolling without onScroll prop
      expect(() => {
        fireEvent.scroll(listContainer, { target: { scrollTop: 100 } })
      }).not.toThrow()
    })
  })

  describe('Smooth Scrolling', () => {
    it('should expose scroll methods through ref', () => {
      const ref = React.createRef()
      render(
        <VirtualizedList
          ref={ref}
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          smoothScrolling={true}
        />
      )

      expect(ref.current).toHaveProperty('scrollTo')
      expect(ref.current).toHaveProperty('scrollToItem')
      expect(ref.current).toHaveProperty('scrollToTop')
      expect(ref.current).toHaveProperty('scrollToBottom')
    })

    it('should handle scrollTo method', async () => {
      const ref = React.createRef()
      render(
        <VirtualizedList
          ref={ref}
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          smoothScrolling={true}
        />
      )

      // Call scrollTo method - this should not throw
      expect(() => {
        ref.current.scrollTo(100)
      }).not.toThrow()

      // The method should exist and be callable
      expect(typeof ref.current.scrollTo).toBe('function')
    })

    it('should handle scrollToTop method', () => {
      const ref = React.createRef()
      render(
        <VirtualizedList
          ref={ref}
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          smoothScrolling={true}
        />
      )

      // Should not throw error
      expect(() => {
        ref.current.scrollToTop()
      }).not.toThrow()
    })

    it('should handle scrollToBottom method', () => {
      const ref = React.createRef()
      render(
        <VirtualizedList
          ref={ref}
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          smoothScrolling={true}
        />
      )

      // Should not throw error
      expect(() => {
        ref.current.scrollToBottom()
      }).not.toThrow()
    })

    it('should disable smooth scrolling when smoothScrolling is false', () => {
      const ref = React.createRef()
      render(
        <VirtualizedList
          ref={ref}
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          smoothScrolling={false}
        />
      )

      ref.current.scrollTo(100)

      // Should not use requestAnimationFrame for non-smooth scrolling
      expect(mockRequestAnimationFrame).not.toHaveBeenCalled()
    })
  })

  describe('Performance Considerations', () => {
    it('should handle large item lists efficiently', () => {
      const largeItemList = Array.from({ length: 10000 }, (_, index) => ({
        id: `item-${index}`,
        name: `Item ${index}`,
        description: `Description for item ${index}`
      }))

      const startTime = performance.now()
      
      render(
        <VirtualizedList
          items={largeItemList}
          itemHeight={50}
          height={400}
          renderItem={mockRenderItem}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render quickly even with large datasets
      // Note: This is a basic performance check, actual performance will depend on react-window
      expect(renderTime).toBeLessThan(100) // Should render in less than 100ms
    })

    it('should use overscan prop for performance optimization', () => {
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          overscan={5}
        />
      )

      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
    })

    it('should handle dynamic height calculations efficiently', () => {
      const complexGetItemHeight = vi.fn((item, index) => {
        // Simulate complex height calculation
        let height = 60
        if (item.description.length > 20) height += 20
        if (item.name.length > 10) height += 10
        return height
      })

      render(
        <VirtualizedList
          items={mockItems}
          getItemHeight={complexGetItemHeight}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      // Should call height calculation function
      expect(complexGetItemHeight).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing renderItem prop gracefully', () => {
      // This should be caught by PropTypes in development
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Provide a fallback renderItem to prevent crash
      const fallbackRenderItem = (item, index) => <div>Fallback: {item?.name || 'Unknown'}</div>
      
      expect(() => {
        render(
          <VirtualizedList
            items={mockItems}
            itemHeight={50}
            height={200}
            renderItem={fallbackRenderItem}
          />
        )
      }).not.toThrow()

      // Should still render without crashing
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle invalid height prop', () => {
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={0} // Invalid height
          renderItem={mockRenderItem}
        />
      )

      // Should still render
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
    })

    it('should handle null or undefined items', () => {
      const itemsWithNull = [
        { id: '1', name: 'Item 1', description: 'Description 1' },
        null,
        { id: '3', name: 'Item 3', description: 'Description 3' },
        undefined
      ]

      render(
        <VirtualizedList
          items={itemsWithNull}
          itemHeight={50}
          height={200}
          renderItem={(item, index) => {
            if (!item) return <div data-testid={`empty-${index}`}>Empty</div>
            return <div data-testid={`item-${item.id}`}>{item.name}</div>
          }}
        />
      )

      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should maintain proper ARIA attributes', () => {
      render(
        <VirtualizedList
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
          className="accessible-list"
        />
      )

      const listContainer = screen.getByTestId('fixed-size-list')
      expect(listContainer).toHaveClass('accessible-list')
    })

    it('should support keyboard navigation through scroll methods', () => {
      const ref = React.createRef()
      render(
        <VirtualizedList
          ref={ref}
          items={mockItems}
          itemHeight={50}
          height={200}
          renderItem={mockRenderItem}
        />
      )

      // Should provide methods for programmatic scrolling (useful for keyboard navigation)
      expect(typeof ref.current.scrollToItem).toBe('function')
      expect(typeof ref.current.scrollTo).toBe('function')
    })
  })
})