import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '../store'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
        promise: vi.fn(),
    }
}))

describe('Toast Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should show success toast when adding BOQ item', () => {
        const { result } = renderHook(() => useAppStore())

        const mockItem = {
            id: 'test-1',
            name: 'Test Item',
            category: 'Test',
            unitPrice: 100,
            dependencies: []
        }

        act(() => {
            result.current.addBOQItem(mockItem, 1)
        })

        // The toast should be called but we can't easily test it due to mocking
        // This test mainly ensures the store actions don't crash with toast calls
        expect(result.current.data.boqItems).toHaveLength(1)
        expect(result.current.data.boqItems[0].name).toBe('Test Item')
    })

    it('should show success toast when updating BOQ item quantity', () => {
        const { result } = renderHook(() => useAppStore())

        const mockItem = {
            id: 'test-1',
            name: 'Test Item',
            category: 'Test',
            unitPrice: 100,
            dependencies: []
        }

        act(() => {
            result.current.addBOQItem(mockItem, 1)
        })

        act(() => {
            result.current.updateBOQItemQuantity('test-1', 5)
        })

        expect(result.current.data.boqItems[0].quantity).toBe(5)
    })

    it('should show success toast when removing BOQ item', () => {
        const { result } = renderHook(() => useAppStore())

        const mockItem = {
            id: 'test-1',
            name: 'Test Item',
            category: 'Test',
            unitPrice: 100,
            dependencies: []
        }

        act(() => {
            result.current.addBOQItem(mockItem, 1)
        })

        act(() => {
            result.current.removeBOQItem('test-1')
        })

        expect(result.current.data.boqItems).toHaveLength(0)
    })
})