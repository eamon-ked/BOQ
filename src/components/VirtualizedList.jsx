import React, { useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react'
import { FixedSizeList as List, VariableSizeList } from 'react-window'
import PropTypes from 'prop-types'

// Fixed height virtualized list for uniform items
const FixedVirtualizedList = forwardRef(({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  overscan = 5,
  onScroll,
  className = '',
  ...props
}, ref) => {
  const itemCount = items.length

  const Row = useCallback(({ index, style }) => {
    const item = items[index]
    if (!item) return null

    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    )
  }, [items, renderItem])

  const handleScroll = useCallback((scrollData) => {
    onScroll?.(scrollData)
  }, [onScroll])

  if (itemCount === 0) {
    return (
      <div className={`virtualized-list-empty ${className}`} style={{ height, width }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No items to display
        </div>
      </div>
    )
  }

  return (
    <List
      ref={ref}
      className={`virtualized-list ${className}`}
      height={height}
      width={width}
      itemCount={itemCount}
      itemSize={itemHeight}
      overscanCount={overscan}
      onScroll={handleScroll}
      {...props}
    >
      {Row}
    </List>
  )
})

// Variable height virtualized list for dynamic content
const VariableVirtualizedList = forwardRef(({
  items,
  getItemHeight,
  height,
  width = '100%',
  renderItem,
  overscan = 5,
  onScroll,
  className = '',
  estimatedItemSize = 50,
  ...props
}, ref) => {
  const itemCount = items.length

  const Row = useCallback(({ index, style }) => {
    const item = items[index]
    if (!item) return null

    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    )
  }, [items, renderItem])

  const handleScroll = useCallback((scrollData) => {
    onScroll?.(scrollData)
  }, [onScroll])

  const itemSize = useCallback((index) => {
    return getItemHeight ? getItemHeight(items[index], index) : estimatedItemSize
  }, [items, getItemHeight, estimatedItemSize])

  if (itemCount === 0) {
    return (
      <div className={`virtualized-list-empty ${className}`} style={{ height, width }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No items to display
        </div>
      </div>
    )
  }

  return (
    <VariableSizeList
      ref={ref}
      className={`virtualized-list ${className}`}
      height={height}
      width={width}
      itemCount={itemCount}
      itemSize={itemSize}
      estimatedItemSize={estimatedItemSize}
      overscanCount={overscan}
      onScroll={handleScroll}
      {...props}
    >
      {Row}
    </VariableSizeList>
  )
})

// Main VirtualizedList component that chooses between fixed and variable
const VirtualizedList = forwardRef((props, ref) => {
  const { getItemHeight, itemHeight, smoothScrolling = true, ...otherProps } = props
  const listRef = useRef(null)

  // Expose smooth scrolling methods
  useImperativeHandle(ref, () => ({
    scrollTo: (offset) => {
      if (listRef.current) {
        if (smoothScrolling) {
          // Smooth scroll implementation
          const currentOffset = listRef.current.state?.scrollOffset || 0
          const distance = Math.abs(offset - currentOffset)
          const duration = Math.min(distance / 2, 500) // Max 500ms duration
          
          const startTime = performance.now()
          const startOffset = currentOffset
          
          const animateScroll = (currentTime) => {
            if (!listRef.current) return // Safety check for unmounted component
            
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // Easing function for smooth animation
            const easeInOutCubic = progress < 0.5 
              ? 4 * progress * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 3) / 2
            
            const currentScrollOffset = startOffset + (offset - startOffset) * easeInOutCubic
            listRef.current.scrollTo(currentScrollOffset)
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll)
            }
          }
          
          requestAnimationFrame(animateScroll)
        } else {
          listRef.current.scrollTo(offset)
        }
      }
    },
    scrollToItem: (index, align = 'auto') => {
      if (listRef.current) {
        listRef.current.scrollToItem(index, align)
      }
    },
    scrollToTop: () => {
      if (listRef.current) {
        if (smoothScrolling) {
          listRef.current.scrollTo(0)
        } else {
          listRef.current.scrollTo(0)
        }
      }
    },
    scrollToBottom: () => {
      if (listRef.current) {
        const totalHeight = listRef.current.props.height
        if (smoothScrolling) {
          listRef.current.scrollTo(totalHeight)
        } else {
          listRef.current.scrollTo(totalHeight)
        }
      }
    }
  }), [smoothScrolling])

  // Use variable height list if getItemHeight is provided, otherwise use fixed height
  if (getItemHeight) {
    return <VariableVirtualizedList ref={listRef} getItemHeight={getItemHeight} {...otherProps} />
  }

  if (itemHeight) {
    return <FixedVirtualizedList ref={listRef} itemHeight={itemHeight} {...otherProps} />
  }

  // Default to fixed height with standard item size
  return <FixedVirtualizedList ref={listRef} itemHeight={60} {...otherProps} />
})

VirtualizedList.displayName = 'VirtualizedList'
FixedVirtualizedList.displayName = 'FixedVirtualizedList'
VariableVirtualizedList.displayName = 'VariableVirtualizedList'

VirtualizedList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  itemHeight: PropTypes.number,
  getItemHeight: PropTypes.func,
  overscan: PropTypes.number,
  onScroll: PropTypes.func,
  className: PropTypes.string,
  estimatedItemSize: PropTypes.number,
  smoothScrolling: PropTypes.bool
}

export default VirtualizedList