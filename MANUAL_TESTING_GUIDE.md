# BOQ Builder - Manual Testing Guide

This guide provides comprehensive manual testing procedures for all major features and workflows in the BOQ Builder application.

## Testing Environment Setup

### Prerequisites
- Application running locally (`npm run dev`)
- Fresh database with sample data (`npm run db:seed`)
- Browser with developer tools open
- Test data prepared

### Test Data Requirements
- At least 50 items in different categories
- Multiple projects with varying complexity
- Items with dependencies
- Items with different price ranges

## Core Feature Testing

### 1. Application Startup and Loading

#### Test Case 1.1: Initial Application Load
**Steps:**
1. Open browser to http://localhost:5173
2. Observe loading states
3. Check for any console errors
4. Verify all components render correctly

**Expected Results:**
- [ ] Application loads within 3 seconds
- [ ] No JavaScript errors in console
- [ ] Loading indicators display properly
- [ ] Main interface is fully functional
- [ ] Database connection established

#### Test Case 1.2: Error Boundary Testing
**Steps:**
1. Simulate JavaScript error (modify component to throw error)
2. Observe error boundary behavior
3. Check error logging
4. Test recovery mechanisms

**Expected Results:**
- [ ] Error boundary catches errors gracefully
- [ ] User-friendly error message displayed
- [ ] Option to retry or return to home
- [ ] Error logged for debugging
- [ ] Application doesn't crash completely

### 2. Item Database Management

#### Test Case 2.1: Item Display and Navigation
**Steps:**
1. Open item database panel
2. Scroll through item list
3. Test virtual scrolling with large datasets
4. Check item information display

**Expected Results:**
- [ ] Items display correctly with all information
- [ ] Virtual scrolling works smoothly
- [ ] No performance issues with large lists
- [ ] Item details are accurate and complete

#### Test Case 2.2: Item Search Functionality
**Steps:**
1. Enter search terms in search box
2. Test partial matches
3. Test case-insensitive search
4. Test search across multiple fields
5. Clear search and verify reset

**Expected Results:**
- [ ] Search results appear within 200ms
- [ ] Partial matches work correctly
- [ ] Case-insensitive search functions
- [ ] Searches name, description, manufacturer
- [ ] Clear search resets to full list
- [ ] Search highlighting works

#### Test Case 2.3: Category Filtering
**Steps:**
1. Select different categories from dropdown
2. Test "All Categories" option
3. Combine search with category filtering
4. Test category persistence

**Expected Results:**
- [ ] Category filtering works correctly
- [ ] "All Categories" shows all items
- [ ] Combined search and filter work together
- [ ] Filter state persists during session

#### Test Case 2.4: Advanced Search Features
**Steps:**
1. Test price range filtering
2. Test manufacturer filtering
3. Test multiple filters simultaneously
4. Test filter clearing

**Expected Results:**
- [ ] Price range filtering works accurately
- [ ] Manufacturer filtering functions correctly
- [ ] Multiple filters work together
- [ ] Filter clearing resets all filters

### 3. BOQ Management

#### Test Case 3.1: Adding Items to BOQ
**Steps:**
1. Select items from database
2. Set quantities
3. Add items to BOQ
4. Verify BOQ updates
5. Test bulk adding

**Expected Results:**
- [ ] Items added successfully to BOQ
- [ ] Quantities set correctly
- [ ] BOQ totals update automatically
- [ ] Dependencies added automatically
- [ ] Success notifications appear
- [ ] Bulk operations work correctly

#### Test Case 3.2: BOQ Item Management
**Steps:**
1. Update item quantities in BOQ
2. Remove items from BOQ
3. Test quantity validation
4. Test calculation accuracy

**Expected Results:**
- [ ] Quantity updates work correctly
- [ ] Item removal functions properly
- [ ] Validation prevents invalid quantities
- [ ] Calculations are accurate
- [ ] Totals update in real-time

#### Test Case 3.3: BOQ Calculations
**Steps:**
1. Add items with different prices
2. Update quantities
3. Verify subtotals and totals
4. Test with dependencies
5. Check calculation precision

**Expected Results:**
- [ ] Subtotals calculated correctly
- [ ] Grand total accurate
- [ ] Dependencies included in calculations
- [ ] Precision maintained (2 decimal places)
- [ ] Updates happen in real-time

### 4. Project Management

#### Test Case 4.1: Project Creation
**Steps:**
1. Create new project
2. Set project details
3. Save project
4. Verify project appears in list

**Expected Results:**
- [ ] Project creation form works
- [ ] All fields save correctly
- [ ] Project appears in project list
- [ ] Project metadata stored properly

#### Test Case 4.2: Project Loading and Switching
**Steps:**
1. Switch between different projects
2. Verify BOQ items load correctly
3. Test project state persistence
4. Check project metadata display

**Expected Results:**
- [ ] Project switching works smoothly
- [ ] BOQ items load for correct project
- [ ] Project state persists correctly
- [ ] Metadata displays accurately

#### Test Case 4.3: Project Templates
**Steps:**
1. Create project template
2. Apply template to new project
3. Modify template
4. Test template management

**Expected Results:**
- [ ] Template creation works
- [ ] Template application functions correctly
- [ ] Template modifications save
- [ ] Template management interface works

### 5. Export Functionality

#### Test Case 5.1: PDF Export
**Steps:**
1. Generate PDF export
2. Check PDF content and formatting
3. Test with different BOQ sizes
4. Verify metadata inclusion

**Expected Results:**
- [ ] PDF generates successfully
- [ ] Content is properly formatted
- [ ] All BOQ items included
- [ ] Metadata appears correctly
- [ ] File downloads automatically

#### Test Case 5.2: Excel Export
**Steps:**
1. Generate Excel export
2. Open file in Excel
3. Verify multiple worksheets
4. Check data accuracy

**Expected Results:**
- [ ] Excel file generates correctly
- [ ] Multiple worksheets created
- [ ] Data is accurate and complete
- [ ] Formatting is professional
- [ ] File opens without errors

#### Test Case 5.3: CSV Export
**Steps:**
1. Generate CSV export
2. Open in spreadsheet application
3. Test custom field selection
4. Verify data integrity

**Expected Results:**
- [ ] CSV file generates correctly
- [ ] Custom fields work properly
- [ ] Data integrity maintained
- [ ] File format is standard CSV

### 6. Bulk Operations

#### Test Case 6.1: Multi-Select Functionality
**Steps:**
1. Select multiple items using checkboxes
2. Test "Select All" functionality
3. Test range selection
4. Clear selections

**Expected Results:**
- [ ] Individual selection works
- [ ] "Select All" selects all visible items
- [ ] Range selection functions correctly
- [ ] Clear selection works properly

#### Test Case 6.2: Bulk Add to BOQ
**Steps:**
1. Select multiple items
2. Set quantities for bulk operation
3. Add all selected items to BOQ
4. Verify all items added correctly

**Expected Results:**
- [ ] Bulk add operation succeeds
- [ ] All selected items added
- [ ] Quantities set correctly
- [ ] Dependencies handled properly

#### Test Case 6.3: Bulk Edit Operations
**Steps:**
1. Select multiple items
2. Perform bulk edit operations
3. Test bulk delete
4. Verify operation results

**Expected Results:**
- [ ] Bulk edit operations work
- [ ] Changes applied to all selected items
- [ ] Bulk delete functions correctly
- [ ] Confirmation dialogs appear

### 7. Form Validation and Error Handling

#### Test Case 7.1: Input Validation
**Steps:**
1. Test required field validation
2. Test numeric field validation
3. Test string length limits
4. Test special character handling

**Expected Results:**
- [ ] Required fields show validation errors
- [ ] Numeric validation works correctly
- [ ] String length limits enforced
- [ ] Special characters handled properly

#### Test Case 7.2: Error Recovery
**Steps:**
1. Simulate network errors
2. Test database connection issues
3. Test invalid data scenarios
4. Verify error messages and recovery

**Expected Results:**
- [ ] Network errors handled gracefully
- [ ] Database issues show appropriate messages
- [ ] Invalid data rejected with clear messages
- [ ] Recovery mechanisms work correctly

### 8. Performance Testing

#### Test Case 8.1: Large Dataset Performance
**Steps:**
1. Load application with 1000+ items
2. Test search performance
3. Test scrolling performance
4. Monitor memory usage

**Expected Results:**
- [ ] Application loads within acceptable time
- [ ] Search remains responsive
- [ ] Scrolling is smooth
- [ ] Memory usage stays reasonable

#### Test Case 8.2: Concurrent Operations
**Steps:**
1. Perform multiple operations simultaneously
2. Test rapid user interactions
3. Monitor for race conditions
4. Check data consistency

**Expected Results:**
- [ ] Concurrent operations handled correctly
- [ ] No race conditions occur
- [ ] Data remains consistent
- [ ] UI remains responsive

### 9. Accessibility Testing

#### Test Case 9.1: Keyboard Navigation
**Steps:**
1. Navigate entire application using only keyboard
2. Test tab order
3. Test keyboard shortcuts
4. Verify focus indicators

**Expected Results:**
- [ ] All functionality accessible via keyboard
- [ ] Tab order is logical
- [ ] Keyboard shortcuts work
- [ ] Focus indicators are visible

#### Test Case 9.2: Screen Reader Compatibility
**Steps:**
1. Test with screen reader software
2. Verify ARIA labels
3. Check semantic HTML structure
4. Test form accessibility

**Expected Results:**
- [ ] Screen reader can navigate application
- [ ] ARIA labels provide context
- [ ] HTML structure is semantic
- [ ] Forms are properly labeled

### 10. Mobile Responsiveness

#### Test Case 10.1: Mobile Layout
**Steps:**
1. Test on various mobile screen sizes
2. Check touch interactions
3. Verify responsive design
4. Test mobile-specific features

**Expected Results:**
- [ ] Layout adapts to mobile screens
- [ ] Touch interactions work properly
- [ ] All features accessible on mobile
- [ ] Performance acceptable on mobile

## Browser Compatibility Testing

### Test Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Basic functionality | [ ] | [ ] | [ ] | [ ] |
| Search and filtering | [ ] | [ ] | [ ] | [ ] |
| BOQ management | [ ] | [ ] | [ ] | [ ] |
| Export functionality | [ ] | [ ] | [ ] | [ ] |
| Bulk operations | [ ] | [ ] | [ ] | [ ] |

### Browser-Specific Tests

#### Chrome
- Test with latest version
- Check developer tools integration
- Verify performance metrics

#### Firefox
- Test with latest version
- Check for Firefox-specific issues
- Verify addon compatibility

#### Safari
- Test on macOS and iOS
- Check WebKit-specific features
- Verify touch interactions

#### Edge
- Test with latest version
- Check Chromium compatibility
- Verify Windows integration

## Security Testing

### Test Case S.1: Input Security
**Steps:**
1. Test XSS prevention
2. Test SQL injection prevention
3. Test file upload security
4. Verify data sanitization

**Expected Results:**
- [ ] XSS attacks prevented
- [ ] SQL injection blocked
- [ ] File uploads secured
- [ ] Data properly sanitized

### Test Case S.2: Authentication and Authorization
**Steps:**
1. Test session management
2. Verify access controls
3. Test privilege escalation prevention
4. Check data access restrictions

**Expected Results:**
- [ ] Sessions managed securely
- [ ] Access controls enforced
- [ ] Privilege escalation prevented
- [ ] Data access properly restricted

## Test Execution Checklist

### Pre-Testing
- [ ] Test environment set up
- [ ] Sample data loaded
- [ ] Browser developer tools open
- [ ] Test cases reviewed

### During Testing
- [ ] Document all issues found
- [ ] Take screenshots of problems
- [ ] Note performance observations
- [ ] Record error messages

### Post-Testing
- [ ] Compile test results
- [ ] Prioritize issues found
- [ ] Create bug reports
- [ ] Update test documentation

## Issue Reporting Template

```markdown
**Issue Title:** Brief description of the issue

**Severity:** Critical/High/Medium/Low

**Test Case:** Reference to test case number

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:** What should happen

**Actual Result:** What actually happened

**Environment:**
- Browser: [Chrome 91, Firefox 89, etc.]
- OS: [Windows 10, macOS 11, etc.]
- Screen Resolution: [1920x1080, etc.]

**Screenshots:** [Attach relevant screenshots]

**Console Errors:** [Any JavaScript errors]

**Additional Notes:** [Any other relevant information]
```

## Test Results Summary

### Overall Application Health
- [ ] All critical features working
- [ ] No blocking issues found
- [ ] Performance within acceptable limits
- [ ] Security measures effective

### Recommendations
- [ ] Issues prioritized for fixing
- [ ] Performance improvements identified
- [ ] User experience enhancements noted
- [ ] Security improvements suggested

---

**Testing Completed By:** ________________
**Date:** ________________
**Version Tested:** ________________
**Overall Status:** Pass/Fail/Pass with Issues