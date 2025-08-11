import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import VirtualizedList from '../VirtualizedList'

// Mock react-window with more realistic behavior for performance testing
vi.mock('react-window', () => ({
  FixedSizeList: React.forwardRef(({ children, itemCount, itemSize, height, width, onScroll, overscanCount, ...props }, ref) => {
    const Row = children
    const [scrollTop, setScrollTop] = React.useState(0)
    const [isScrolling, setIsScrolling] = React.useState(false)
    
    // Calculate visible range based on scroll position
    const containerHeight = typeof height === 'number' ? height : 400
    const startIndex = Math.floor(scrollTop / itemSize)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemSize) + (overscanCount || 0)
    )
    
    const visibleItems = []
    for (let i = Math.max(0, startIndex - (overscanCount || 0)); i <= endIndex; i++) {
      visibleItems.push(i)
    }

    React.useImperativeHandle(ref, () => ({
      scrollTo: (offset) => {
        setScrollTop(offset)
        onScroll?.({ scrollOffset: offset, scrollUpdateWasRequested: true })
      },
      scrollToItem: (index, align = 'auto') => {
        const offset = index * itemSize
        setScrollTop(offset)
        onScroll?.({ scrollOffset: offset, scrollUpdateWasRequested: true })
      },
      state: { scrollOffset: scrollTop }
    }))

    const handleScroll = (e) => {
      const newScrollTop = e.target.scrollTop
      setScrollTop(newScrollTop)
      setIsScrolling(true)
      
      // Simulate scroll end
      setTimeout(() => setIsScrolling(false), 150)
      
      onScroll?.({ 
        scrollOffset: newScrollTop, 
        scrollUpdateWasRequested: false,
        isScrolling 
      })
    }

    return (
      <div 
        data-testid="fixed-size-list" 
        style={{ height, width, overflow: 'auto' }}
        onScroll={handleScroll}
        {...props}
      >
        <div style={{ height: itemCount * itemSize, position: 'relative' }}>
          {visibleItems.map(index => (
            <div key={index} style={{ 
              position: 'absolute', 
              top: index * itemSize, 
              height: itemSize,
              width: '100%'
            }}>
              <Row index={index} style={{ height: itemSize }} />
            </div>
          ))}
        </div>
      </div>
    )
  }),
  
  VariableSizeList: React.forwardRef(({ children, itemCount, itemSize, height, width, onScroll, overscanCount, ...props }, ref) => {
    const Row = children
    const [scrollTop, setScrollTop] = React.useState(0)
    const [isScrolling, setIsScrolling] = React.useState(false)
    
    // Calculate cumulative heights for variable size items
    const itemHeights = React.useMemo(() => {
      const heights = []
      let cumulativeHeight = 0
      for (let i = 0; i < itemCount; i++) {
        const height = itemSize(i)
        heights.push({ height, offset: cumulativeHeight })
        cumulativeHeight += height
      }
      return heights
    }, [itemCount, itemSize])

    const totalHeight = itemHeights[itemHeights.length - 1]?.offset + itemHeights[itemHeights.length - 1]?.height || 0
    const containerHeight = typeof height === 'number' ? height : 400

    // Find visible items based on scroll position
    const visibleItems = React.useMemo(() => {
      const items = []
      const overscan = overscanCount || 0
      
      for (let i = 0; i < itemCount; i++) {
        const item = itemHeights[i]
        if (item.offset + item.height >= scrollTop - overscan * 50 && 
            item.offset <= scrollTop + containerHeight + overscan * 50) {
          items.push(i)
        }
      }
      return items
    }, [scrollTop, containerHeight, itemHeights, itemCount, overscanCount])

    React.useImperativeHandle(ref, () => ({
      scrollTo: (offset) => {
        setScrollTop(offset)
        onScroll?.({ scrollOffset: offset, scrollUpdateWasRequested: true })
      },
      scrollToItem: (index, align = 'auto') => {
        const item = itemHeights[index]
        if (item) {
          setScrollTop(item.offset)
          onScroll?.({ scrollOffset: item.offset, scrollUpdateWasRequested: true })
        }
      },
      state: { scrollOffset: scrollTop }
    }))

    const handleScroll = (e) => {
      const newScrollTop = e.target.scrollTop
      setScrollTop(newScrollTop)
      setIsScrolling(true)
      
      setTimeout(() => setIsScrolling(false), 150)
      
      onScroll?.({ 
        scrollOffset: newScrollTop, 
        scrollUpdateWasRequested: false,
        isScrolling 
      })
    }

    return (
      <div 
        data-testid="variable-size-list" 
        style={{ height, width, overflow: 'auto' }}
        onScroll={handleScroll}
        {...props}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(index => {
            const item = itemHeights[index]
            return (
              <div key={index} style={{ 
                position: 'absolute', 
                top: item.offset, 
                height: item.height,
                width: '100%'
              }}>
                <Row index={index} style={{ height: item.height }} />
              </div>
            )
          })}
        </div>
      </div>
    )
  })
}))

// Helper function for creating test data
const createLargeDataset = (size) => {
  return Array.from({ length: size }, (_, index) => ({
    id: `item-${index}`,
    name: `Item ${index}`,
    description: `This is a description for item ${index}. It contains some text to simulate real data.`,
    category: `Category ${index % 10}`,
    price: Math.random() * 1000,
    tags: [`tag${index % 5}`, `tag${(index + 1) % 5}`]
  }))
}

describe('VirtualizedList Performance Tests', () => {
  let performanceMarks = []
  
  beforeEach(() => {
    vi.clearAllMocks()
    performanceMarks = []
    
    // Mock performance.mark and performance.measure
    vi.spyOn(performance, 'mark').mockImplementation((name) => {
      performanceMarks.push({ name, time: performance.now() })
    })
    
    vi.spyOn(performance, 'measure').mockImplementation((name, startMark, endMark) => {
      const start = performanceMarks.find(m => m.name === startMark)
      const end = performanceMarks.find(m => m.name === endMark)
      return { duration: end ? end.time - start.time : 0 }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Large Dataset Performance', () => {

    it('should render 1000 items efficiently', async () => {
      const items = createLargeDataset(1000)
      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span>${item.price}</span>
        </div>
      ))

      const startTime = performance.now()
      
      render(
        <VirtualizedList
          items={items}
          itemHeight={80}
          height={400}
          renderItem={renderItem}
          overscan={5}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render quickly even with 1000 items
      expect(renderTime).toBeLessThan(200) // Less than 200ms (more realistic for test environment)
      
      // Should only render visible items (not all 1000)
      expect(renderItem.mock.calls.length).toBeLessThan(20) // Only visible items + overscan
    })

    it('should render 10000 items efficiently', async () => {
      const items = createLargeDataset(10000)
      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      ))

      const startTime = performance.now()
      
      render(
        <VirtualizedList
          items={items}
          itemHeight={60}
          height={400}
          renderItem={renderItem}
          overscan={3}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should still render quickly with 10k items
      expect(renderTime).toBeLessThan(300) // Less than 300ms (more realistic for test environment)
      
      // Should only render visible items
      expect(renderItem.mock.calls.length).toBeLessThan(15)
    })

    it('should handle variable height items efficiently', () => {
      const items = createLargeDataset(5000)
      const getItemHeight = vi.fn((item, index) => {
        // Simulate variable heights based on content
        const baseHeight = 60
        const descriptionLines = Math.ceil(item.description.length / 50)
        return baseHeight + (descriptionLines - 1) * 20
      })

      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      ))

      const startTime = performance.now()
      
      render(
        <VirtualizedList
          items={items}
          getItemHeight={getItemHeight}
          height={400}
          renderItem={renderItem}
          estimatedItemSize={80}
          overscan={3}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(400) // Variable height might be slightly slower
      expect(renderItem.mock.calls.length).toBeLessThan(15)
    })
  })

  describe('Scrolling Performance', () => {
    it('should handle rapid scrolling efficiently', async () => {
      const items = createLargeDataset(1000)
      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>{item.name}</div>
      ))

      render(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
        />
      )

      const listContainer = screen.getByTestId('fixed-size-list')
      
      // Simulate rapid scrolling
      const scrollEvents = [0, 100, 200, 500, 1000, 2000, 5000]
      const startTime = performance.now()

      for (const scrollTop of scrollEvents) {
        await act(async () => {
          fireEvent.scroll(listContainer, { target: { scrollTop } })
        })
      }

      const endTime = performance.now()
      const scrollTime = endTime - startTime

      // Should handle rapid scrolling efficiently
      expect(scrollTime).toBeLessThan(100) // Less than 100ms for all scroll events
    })

    it('should maintain smooth scrolling performance', async () => {
      const items = createLargeDataset(2000)
      const renderItem = (item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      )

      const ref = React.createRef()
      render(
        <VirtualizedList
          ref={ref}
          items={items}
          itemHeight={60}
          height={400}
          renderItem={renderItem}
          smoothScrolling={true}
        />
      )

      const startTime = performance.now()

      // Test smooth scrolling to different positions
      await act(async () => {
        ref.current.scrollTo(1000)
      })

      await act(async () => {
        ref.current.scrollToItem(500)
      })

      await act(async () => {
        ref.current.scrollToTop()
      })

      const endTime = performance.now()
      const smoothScrollTime = endTime - startTime

      // Smooth scrolling should still be performant
      expect(smoothScrollTime).toBeLessThan(200)
    })
  })

  describe('Memory Usage', () => {
    it('should not create excessive DOM nodes for large datasets', () => {
      const items = createLargeDataset(10000)
      const renderItem = (item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>{item.name}</div>
      )

      render(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
          overscan={2}
        />
      )

      // Count actual DOM nodes created
      const itemNodes = screen.getAllByTestId(/^item-/)
      
      // Should only create nodes for visible items + overscan
      // With 400px height and 50px items, visible = 8 items, + overscan = ~12 items max
      expect(itemNodes.length).toBeLessThan(15)
      expect(itemNodes.length).toBeGreaterThan(5) // Should render some items
    })

    it('should clean up DOM nodes when scrolling', async () => {
      const items = createLargeDataset(1000)
      const renderItem = (item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>{item.name}</div>
      )

      render(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
          overscan={2}
        />
      )

      const listContainer = screen.getByTestId('fixed-size-list')
      
      // Get initial DOM nodes
      const initialNodes = screen.getAllByTestId(/^item-/)
      const initialCount = initialNodes.length

      // Scroll to middle
      await act(async () => {
        fireEvent.scroll(listContainer, { target: { scrollTop: 5000 } })
      })

      // Get nodes after scrolling
      const afterScrollNodes = screen.getAllByTestId(/^item-/)
      
      // Should maintain similar number of DOM nodes (not accumulate)
      expect(afterScrollNodes.length).toBeLessThanOrEqual(initialCount + 2)
      
      // Should have different items rendered
      const initialIds = initialNodes.map(node => node.getAttribute('data-testid'))
      const afterScrollIds = afterScrollNodes.map(node => node.getAttribute('data-testid'))
      
      // Most items should be different after scrolling
      const commonItems = initialIds.filter(id => afterScrollIds.includes(id))
      expect(commonItems.length).toBeLessThan(initialIds.length / 2)
    })
  })

  describe('Render Optimization', () => {
    it('should minimize re-renders when props change', () => {
      const items = createLargeDataset(100)
      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>{item.name}</div>
      ))

      const { rerender } = render(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
          overscan={2}
        />
      )

      const initialRenderCount = renderItem.mock.calls.length
      renderItem.mockClear()

      // Re-render with same props
      rerender(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
          overscan={2}
        />
      )

      // Should not re-render items unnecessarily
      expect(renderItem.mock.calls.length).toBeLessThanOrEqual(initialRenderCount)
    })

    it('should handle prop changes efficiently', () => {
      const items = createLargeDataset(100)
      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>{item.name}</div>
      ))

      const { rerender } = render(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
        />
      )

      renderItem.mockClear()

      // Change height (should trigger re-render)
      const startTime = performance.now()
      
      rerender(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={500} // Changed height
          renderItem={renderItem}
        />
      )

      const endTime = performance.now()
      const rerenderTime = endTime - startTime

      // Should handle prop changes quickly
      expect(rerenderTime).toBeLessThan(50)
    })
  })

  describe('Edge Cases Performance', () => {
    it('should handle empty items array efficiently', () => {
      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>{item.name}</div>
      ))

      const startTime = performance.now()
      
      render(
        <VirtualizedList
          items={[]}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(10) // Should be very fast for empty array
      expect(renderItem).not.toHaveBeenCalled()
      expect(screen.getByText('No items to display')).toBeInTheDocument()
    })

    it('should handle single item efficiently', () => {
      const items = [{ id: '1', name: 'Single Item', description: 'Only item' }]
      const renderItem = vi.fn((item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>{item.name}</div>
      ))

      const startTime = performance.now()
      
      render(
        <VirtualizedList
          items={items}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(20)
      expect(renderItem).toHaveBeenCalledTimes(1)
    })

    it('should handle items with complex content efficiently', () => {
      const complexItems = Array.from({ length: 500 }, (_, index) => ({
        id: `item-${index}`,
        name: `Complex Item ${index}`,
        description: `This is a very long description for item ${index}. `.repeat(10),
        metadata: {
          tags: Array.from({ length: 10 }, (_, i) => `tag-${i}`),
          properties: Object.fromEntries(
            Array.from({ length: 20 }, (_, i) => [`prop${i}`, `value${i}`])
          )
        }
      }))

      const renderItem = (item, index) => (
        <div data-testid={`item-${item.id}`} key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <div>
            {item.metadata.tags.map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      )

      const startTime = performance.now()
      
      render(
        <VirtualizedList
          items={complexItems}
          itemHeight={120}
          height={400}
          renderItem={renderItem}
          overscan={2}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should handle complex content reasonably well
      expect(renderTime).toBeLessThan(200)
    })
  })
})