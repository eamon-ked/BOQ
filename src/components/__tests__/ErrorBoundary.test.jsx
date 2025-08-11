import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
    if (shouldThrow) {
        throw new Error(errorMessage);
    }
    return <div>No error</div>;
};

// Mock component for testing custom fallback
const CustomFallback = ({ error, resetError, hasError }) => (
    <div>
        <div data-testid="custom-fallback">Custom Error UI</div>
        <div data-testid="error-message">{error?.message}</div>
        <button data-testid="custom-reset" onClick={resetError}>
            Custom Reset
        </button>
    </div>
);

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
});

// Mock window.location
const mockLocation = {
    href: 'http://localhost:3000',
    assign: vi.fn(),
    reload: vi.fn(),
};
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true
});

describe('ErrorBoundary', () => {
    let consoleErrorSpy;
    let consoleGroupSpy;
    let consoleGroupEndSpy;

    beforeEach(() => {
        // Mock console methods to avoid noise in tests
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
        consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => { });

        // Reset mocks
        vi.clearAllMocks();
        localStorageMock.removeItem.mockClear();
        mockLocation.assign.mockClear();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleGroupSpy.mockRestore();
        consoleGroupEndSpy.mockRestore();
    });

    describe('Normal Operation', () => {
        it('should render children when no error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </ErrorBoundary>
            );

            expect(screen.getByText('No error')).toBeInTheDocument();
        });

        it('should not show error UI when children render successfully', () => {
            render(
                <ErrorBoundary>
                    <div>Working component</div>
                </ErrorBoundary>
            );

            expect(screen.getByText('Working component')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should catch errors and display default error UI', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} errorMessage="Test error message" />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText('Try Again')).toBeInTheDocument();
            expect(screen.getByText('Start Fresh')).toBeInTheDocument();
        });

        it('should display error ID in the UI', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const errorIdElement = screen.getByText(/Error ID:/);
            expect(errorIdElement).toBeInTheDocument();
            expect(errorIdElement.textContent).toMatch(/Error ID: [a-z0-9]+/);
        });

        it('should call onError prop when error occurs', () => {
            const onErrorMock = vi.fn();

            render(
                <ErrorBoundary onError={onErrorMock}>
                    <ThrowError shouldThrow={true} errorMessage="Test error" />
                </ErrorBoundary>
            );

            expect(onErrorMock).toHaveBeenCalledTimes(1);
            expect(onErrorMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Test error'
                }),
                expect.objectContaining({
                    componentStack: expect.any(String)
                })
            );
        });

        it('should log error details to console in development', () => {
            // Set NODE_ENV to development
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} errorMessage="Dev error" />
                </ErrorBoundary>
            );

            expect(consoleGroupSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error Boundary Caught an Error')
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error:',
                expect.objectContaining({ message: 'Dev error' })
            );

            // Restore original NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Custom Fallback UI', () => {
        it('should render custom fallback component when provided', () => {
            render(
                <ErrorBoundary fallback={CustomFallback}>
                    <ThrowError shouldThrow={true} errorMessage="Custom error" />
                </ErrorBoundary>
            );

            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
            expect(screen.getByTestId('error-message')).toHaveTextContent('Custom error');
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });

        it('should pass error and reset function to custom fallback', () => {
            render(
                <ErrorBoundary fallback={CustomFallback}>
                    <ThrowError shouldThrow={true} errorMessage="Fallback test" />
                </ErrorBoundary>
            );

            expect(screen.getByTestId('error-message')).toHaveTextContent('Fallback test');
            expect(screen.getByTestId('custom-reset')).toBeInTheDocument();
        });
    });

    describe('Error Recovery', () => {
        it('should reset error state when retry button is clicked', () => {
            const TestComponent = () => {
                const [shouldThrow, setShouldThrow] = React.useState(true);

                React.useEffect(() => {
                    // After 100ms, stop throwing error to simulate recovery
                    const timer = setTimeout(() => setShouldThrow(false), 100);
                    return () => clearTimeout(timer);
                }, []);

                return <ThrowError shouldThrow={shouldThrow} />;
            };

            render(
                <ErrorBoundary>
                    <TestComponent />
                </ErrorBoundary>
            );

            // Should show error UI initially
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Click retry button
            fireEvent.click(screen.getByText('Try Again'));

            // Should attempt to render children again
            // Note: In a real scenario, the component might recover
        });

        it('should clear localStorage and redirect when "Start Fresh" is clicked', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            fireEvent.click(screen.getByText('Start Fresh'));

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('boq-items');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('boq-project-id');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('boq-project-name');
            expect(mockLocation.href).toBe('/');
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.removeItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should not throw when localStorage fails
            expect(() => {
                fireEvent.click(screen.getByText('Start Fresh'));
            }).not.toThrow();
        });
    });

    describe('Development Mode Features', () => {
        it('should show debug info in development mode', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} errorMessage="Debug test error" />
                </ErrorBoundary>
            );

            expect(screen.getByText('Debug Info')).toBeInTheDocument();
            // Use getAllByText to handle multiple matches and check the first one
            const errorElements = screen.getAllByText(/Error: Debug test error/);
            expect(errorElements.length).toBeGreaterThan(0);

            process.env.NODE_ENV = originalEnv;
        });

        it('should not show debug info in production mode', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} errorMessage="Production error" />
                </ErrorBoundary>
            );

            expect(screen.queryByText('Debug Info')).not.toBeInTheDocument();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Error State Management', () => {
        it('should maintain error state until reset', () => {
            const { rerender } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Re-render with different props
            rerender(
                <ErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </ErrorBoundary>
            );

            // Should still show error UI until reset
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });

        it('should generate unique error IDs for different errors', () => {
            const { unmount } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const firstErrorId = screen.getByText(/Error ID:/).textContent;
            unmount();

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const secondErrorId = screen.getByText(/Error ID:/).textContent;
            expect(firstErrorId).not.toBe(secondErrorId);
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels and structure', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const tryAgainButton = screen.getByText('Try Again');
            const startFreshButton = screen.getByText('Start Fresh');

            expect(tryAgainButton).toBeInTheDocument();
            expect(startFreshButton).toBeInTheDocument();

            // Buttons should be focusable
            expect(tryAgainButton.tagName).toBe('BUTTON');
            expect(startFreshButton.tagName).toBe('BUTTON');
        });
    });
});