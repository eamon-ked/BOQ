# Implementation Plan

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step in a test-driven manner. Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Phase 1: Foundation and Error Handling

- [x] 1. Set up error boundary infrastructure





  - Create ErrorBoundary component with proper error catching and user-friendly fallback UI
  - Add error logging utilities for development debugging
  - Integrate ErrorBoundary into main App component wrapper
  - Write unit tests for error boundary behavior and recovery mechanisms
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement toast notification system






  - Install react-hot-toast dependency and create custom toast components
  - Build ToastContainer with success, error, info, and warning variants
  - Create toast utility functions with consistent API for different message types
  - Add toast integration to existing error handling and success flows
  - Write tests for toast display, dismissal, and timing behavior
  - _Requirements: 1.4, 1.5, 2.4, 2.5_

- [x] 2.1 Integrate toast system into main application






  - Add Toaster component to main App.jsx for toast display
  - Integrate toast notifications into store actions for user feedback
  - Add toast notifications to form submissions and data operations
  - Update error handling to use toast notifications instead of alerts
  - Test toast integration across all major user workflows
  - _Requirements: 1.4, 1.5, 2.4, 2.5_


- [x] 3. Create loading state management system



  - Build LoadingSpinner component with different sizes and full-screen variants
  - Create useAsyncOperation hook for managing loading states and errors
  - Add loading indicators to all existing async operations (database, API calls)
  - Implement loading state persistence to prevent flickering during navigation
  - Write tests for loading state transitions and error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 4. Optimize database performance with indexes





  - Add database indexes for frequently queried columns (category, name, manufacturer, price)
  - Create indexes for foreign key relationships (dependencies, BOQ items)
  - Implement query performance monitoring and logging
  - Add database connection optimization and prepared statement caching
  - Write performance tests to verify query speed improvements
  - _Requirements: 3.2, 3.4, 3.5_

## Phase 2: State Management Modernization

- [x] 5. Install and configure Zustand store





  - Add zustand and immer dependencies to project
  - Create centralized app store with UI, data, loading, and error state sections
  - Implement store actions for all major operations (BOQ management, UI state)
  - Add state persistence for critical data using localStorage integration
  - Write tests for store actions, state updates, and persistence behavior
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7_

- [x] 6. Refactor App.jsx to use centralized store





  - Replace multiple useState hooks with Zustand store selectors
  - Update all state-setting operations to use store actions
  - Remove prop drilling by connecting components directly to store
  - Simplify component logic by moving complex state operations to store
  - Write integration tests for App component with new state management
  - _Requirements: 4.1, 4.2, 4.6, 4.8_

- [x] 7. Update major components to use store









  - Refactor BOQTable, ItemSelector, and ItemManager to use store
  - Replace local state with store selectors and actions
  - Add proper memoization to prevent unnecessary re-renders
  - Update component props to remove state-related prop drilling
  - Write component tests with store integration and mock store states
  - _Requirements: 4.2, 4.6, 3.6_

## Phase 3: Input Validation and Form Enhancement

- [x] 8. Create validation schema system









  - Install zod dependency for schema validation
  - Create validation schemas for items, categories, and projects
  - Build validation utility functions with clear error messaging
  - Implement sanitization functions for security and data integrity
  - Write comprehensive tests for all validation rules and edge cases
  - _Requirements: 5.1, 5.2, 5.3, 5.7_

- [x] 9. Build validated form hook





  - Create useValidatedForm hook with real-time validation using existing validation schemas
  - Implement form state management with validation integration
  - Add support for field-level and form-level validation
  - Create form submission handling with error management
  - Write tests for form validation, submission, and error handling
  - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.8_

- [x] 10. Update existing forms with validation






  - Integrate validation into ItemManager form for adding/editing items using existing schemas
  - Add validation to CategoryManager and ProjectManager forms
  - Implement real-time validation feedback with error highlighting
  - Add form submission prevention for invalid data
  - Write integration tests for form validation in real components
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

## Phase 4: Performance Optimization

- [x] 11. Implement React.memo optimization



  - Add React.memo to expensive components (BOQTable, ItemSelector rows)
  - Create custom comparison functions for complex props
  - Implement useMemo for expensive calculations (BOQ totals, filtered lists)
  - Add useCallback for event handlers to prevent unnecessary re-renders
  - Write performance tests to measure render optimization improvements
  - _Requirements: 3.6, 3.7_

- [ ] 12. Add virtual scrolling for large lists
  - Install react-window dependency for virtualization
  - Create VirtualizedList component for item database display
  - Implement virtual scrolling in ItemSelector for large item lists
  - Add support for dynamic item heights and smooth scrolling
  - Write tests for virtual scrolling behavior and performance
  - _Requirements: 3.3, 3.6_

- [ ] 13. Implement code splitting and lazy loading
  - Add React.lazy imports for modal components (ItemManager, CategoryManager)
  - Create loading fallbacks for lazy-loaded components
  - Implement route-based code splitting if applicable
  - Optimize bundle size by analyzing and splitting large dependencies
  - Write tests for lazy loading behavior and fallback states
  - _Requirements: 3.7_

## Phase 5: Enhanced Search and Filtering

- [ ] 14. Build advanced search hook
  - Create useAdvancedSearch hook with debounced input handling
  - Implement multi-field search across name, description, manufacturer
  - Add support for price range filtering and category filtering
  - Create search result highlighting and ranking functionality
  - Write tests for search functionality, debouncing, and filtering
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 15. Enhance ItemSelector with advanced search
  - Integrate advanced search hook into ItemSelector component
  - Add search result highlighting for matched text
  - Implement filter persistence and clear filter functionality
  - Add "no results" state with helpful suggestions
  - Write integration tests for search functionality in ItemSelector
  - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 6.8_

- [ ] 16. Add search performance optimization
  - Implement search result caching for repeated queries
  - Add search indexing for faster text matching
  - Optimize search algorithms for large datasets
  - Add search analytics and performance monitoring
  - Write performance tests for search operations with large datasets
  - _Requirements: 3.4, 6.1_

## Phase 6: Bulk Operations

- [ ] 17. Create multi-select functionality
  - Build useMultiSelect hook with checkbox and row selection support
  - Implement select all, clear selection, and range selection features
  - Add selection state management with maximum selection limits
  - Create selection persistence across component re-renders
  - Write tests for multi-select behavior and edge cases
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 18. Build bulk operations toolbar
  - Create BulkOperations component with action buttons
  - Implement bulk add to BOQ, bulk edit, and bulk delete operations
  - Add confirmation dialogs for destructive bulk operations
  - Create progress indicators for long-running bulk operations
  - Write tests for bulk operations and confirmation flows
  - _Requirements: 7.2, 7.4, 7.5, 7.6, 7.7_

- [ ] 19. Integrate bulk operations into ItemSelector
  - Add multi-select checkboxes to item list display
  - Integrate BulkOperations toolbar with selection state
  - Implement bulk operations with proper error handling and feedback
  - Add bulk operation result reporting and partial failure handling
  - Write integration tests for bulk operations in ItemSelector
  - _Requirements: 7.1, 7.4, 7.7, 7.8_

## Phase 7: Export Enhancements

- [x] 20. Create Excel export functionality





  - Install xlsx dependency for Excel file generation
  - Build exportToExcel utility with multiple worksheet support
  - Implement BOQ summary, detailed items, and category summary sheets
  - Add professional formatting with headers, styling, and metadata
  - Write tests for Excel export functionality and file structure
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 21. Add CSV export with customization











  - Create exportToCSV utility with field selection options
  - Implement custom export templates and field mapping
  - Add export configuration saving and reuse functionality
  - Create export preview functionality before file generation
  - Write tests for CSV export and customization features
  - _Requirements: 8.1, 8.3, 8.8_

- [x] 22. Enhance BOQExport component
  - Update BOQExport to support multiple export formats
  - Add export format selection and customization options
  - Implement progress indicators for large export operations
  - Add export history and template management
  - Write integration tests for enhanced export functionality
  - _Requirements: 8.1, 8.3, 8.6, 8.7, 8.8_

## Phase 8: Project Management Features

- [x] 23. Enhance project data model






  - Update database schema to support project metadata and settings
  - Add project status, client information, and deadline fields
  - Implement project template functionality in database layer
  - Add project cloning and template creation operations
  - Write database migration and tests for new project features
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 24. Build project template system














  - Create ProjectTemplate component for template management
  - Implement template creation from existing projects
  - Add template categorization and search functionality
  - Create template application to new projects
  - Write tests for template creation, management, and application
  - _Requirements: 9.4, 9.5_
-

- [x] 25. Update BOQProjectManager with enhanced features




  - Add project cloning functionality to existing project manager
  - Implement project metadata editing and status management
  - Add project summary statistics and value calculations
  - Create project deletion with confirmation and backup options
  - Write integration tests for enhanced project management features
  - _Requirements: 9.3, 9.5, 9.6, 9.7, 9.8_





## Phase 9: Missing Core Features

- [x] 29. Integrate CategoryManager and BOQProjectManager into main App









  - Import CategoryManager and BOQProjectManager components into App.jsx
  - Add buttons to open category and project management modals
  - Connect components to store state and actions
  - Add proper modal state management for both components
  - Test category and project management workflows
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 30. Implement useAsyncOperation hook for loading states
  - Create useAsyncOperation hook for managing async operations with loading states
  - Add error handling and retry mechanisms to the hook
  - Integrate hook into database operations and API calls
  - Add loading state persistence to prevent flickering
  - Write tests for async operation state management
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [ ] 31. Add comprehensive form validation to existing components
  - Update ItemManager component to use validated form hook
  - Add validation to all form inputs with real-time feedback
  - Implement form submission prevention for invalid data
  - Add proper error highlighting and user guidance
  - Write tests for form validation integration
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

- [x] 32. Implement advanced search functionality





  - Create useAdvancedSearch hook with debounced input handling
  - Add multi-field search across name, description, manufacturer
  - Implement price range filtering and category filtering
  - Add search result highlighting and ranking functionality
  - Integrate advanced search into ItemSelector component
  - Write tests for search functionality and performance
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 33. Add bulk operations support
  - Create useMultiSelect hook with checkbox and row selection
  - Build BulkOperations component with action buttons
  - Implement bulk add to BOQ, bulk edit, and bulk delete operations
  - Add confirmation dialogs for destructive operations
  - Integrate bulk operations into ItemSelector
  - Write tests for bulk operations and multi-select behavior
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

## Phase 10: Performance and Polish

- [ ] 34. Implement virtual scrolling for large lists
  - Install react-window dependency for virtualization
  - Create VirtualizedList component for item database display
  - Implement virtual scrolling in ItemSelector for large item lists
  - Add support for dynamic item heights and smooth scrolling
  - Write tests for virtual scrolling behavior and performance
  - _Requirements: 3.3, 3.6_

- [ ] 35. Add code splitting and lazy loading
  - Add React.lazy imports for modal components (ItemManager, CategoryManager)
  - Create loading fallbacks for lazy-loaded components
  - Implement route-based code splitting if applicable
  - Optimize bundle size by analyzing and splitting large dependencies
  - Write tests for lazy loading behavior and fallback states
  - _Requirements: 3.7_

- [ ] 36. Enhance project management features
  - Update database schema to support project metadata and settings
  - Build ProjectTemplate component for template management
  - Update BOQProjectManager with enhanced features
  - Add project cloning and template functionality
  - Write tests for enhanced project management features
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

## Phase 11: Final Integration and Quality Assurance

- [ ] 37. Add comprehensive unit and integration tests
  - Write unit tests for all utility functions and helpers
  - Create tests for custom hooks (useAdvancedSearch, useMultiSelect, useAsyncOperation)
  - Add tests for store actions and state management
  - Implement tests for validation schemas and form handling
  - Write integration tests for major user workflows
  - Achieve 80%+ test coverage for critical application logic
  - _Requirements: 10.4, 10.5_

- [ ] 38. Performance optimization and monitoring
  - Analyze bundle size and optimize imports and dependencies
  - Implement performance monitoring and bundle analysis tools
  - Add production build optimization and asset compression
  - Create performance regression tests and monitoring alerts
  - Set up error tracking and logging for production debugging
  - _Requirements: 3.7, 3.8, 10.1, 10.6, 10.7, 10.8_

- [ ] 39. Final testing and deployment preparation
  - Run comprehensive test suite and fix any failing tests
  - Perform manual testing of all major features and workflows
  - Test error scenarios and recovery mechanisms
  - Verify accessibility compliance and mobile responsiveness
  - Create deployment checklist and production readiness verification
  - Write documentation for development setup and contribution guidelines
  - _Requirements: 10.4, 10.5, 10.6, 10.8_