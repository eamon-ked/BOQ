# Contributing to BOQ Builder

Thank you for your interest in contributing to BOQ Builder! This document provides guidelines and information for contributors.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Performance Guidelines](#performance-guidelines)
- [Security Guidelines](#security-guidelines)

## Development Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: Latest version
- **SQLite**: For local database development

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/boq-builder.git
   cd boq-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Run tests to verify setup**
   ```bash
   npm test
   ```

### Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Analyze bundle size
npm run analyze

# Run database migrations
npm run db:migrate

# Seed database with test data
npm run db:seed

# Start production server
npm start
```

## Project Structure

```
boq-builder/
├── src/                          # Source code
│   ├── components/              # React components
│   │   ├── __tests__/          # Component tests
│   │   └── [ComponentName].jsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── __tests__/          # Hook tests
│   │   └── [hookName].js
│   ├── services/               # API and external services
│   │   ├── __tests__/          # Service tests
│   │   └── [serviceName].js
│   ├── store/                  # Zustand store
│   │   ├── __tests__/          # Store tests
│   │   └── index.js
│   ├── utils/                  # Utility functions
│   │   ├── __tests__/          # Utility tests
│   │   └── [utilityName].js
│   ├── validation/             # Validation schemas and functions
│   │   ├── __tests__/          # Validation tests
│   │   ├── schemas.js          # Zod schemas
│   │   ├── validators.js       # Validation functions
│   │   ├── sanitizers.js       # Data sanitization
│   │   └── index.js            # Main validation exports
│   ├── test/                   # Test utilities and setup
│   │   ├── setup.js            # Test environment setup
│   │   └── helpers.js          # Test helper functions
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles
├── server/                      # Backend server code
│   ├── __tests__/              # Server tests
│   ├── migrations/             # Database migrations
│   ├── database.js             # Database configuration
│   └── server.js               # Express server
├── public/                      # Static assets
├── docs/                        # Documentation
├── .kiro/                       # Kiro configuration
│   └── specs/                  # Feature specifications
└── scripts/                     # Build and utility scripts
```

## Coding Standards

### JavaScript/React

- **ES6+**: Use modern JavaScript features
- **Functional Components**: Prefer function components over class components
- **Hooks**: Use React hooks for state management
- **JSX**: Follow React JSX best practices
- **Naming Conventions**:
  - Components: PascalCase (`UserProfile.jsx`)
  - Functions/Variables: camelCase (`getUserData`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
  - Files: kebab-case for utilities, PascalCase for components

### Code Style

- **Prettier**: Code formatting is handled by Prettier
- **ESLint**: Follow ESLint rules for code quality
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces
- **Semicolons**: Always use semicolons
- **Quotes**: Use single quotes for strings

### Component Guidelines

```jsx
// Good component structure
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppStore } from '../store';

/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display
 * @param {Function} props.onSave - Callback when saving
 */
const MyComponent = ({ title, onSave }) => {
  const [loading, setLoading] = useState(false);
  const { data, actions } = useAppStore();

  useEffect(() => {
    // Effect logic here
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default MyComponent;
```

### State Management

- **Zustand**: Use Zustand for global state management
- **Local State**: Use `useState` for component-local state
- **Side Effects**: Use `useEffect` for side effects
- **Custom Hooks**: Extract reusable logic into custom hooks

```javascript
// Good store structure
export const useAppStore = create((set, get) => ({
  // State
  data: {
    items: [],
    loading: false,
  },
  
  // Actions
  actions: {
    setItems: (items) => set((state) => ({
      data: { ...state.data, items }
    })),
    
    setLoading: (loading) => set((state) => ({
      data: { ...state.data, loading }
    })),
  },
}));
```

## Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows

### Testing Tools

- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **Jest DOM**: Additional matchers
- **MSW**: API mocking

### Test Naming

```javascript
describe('ComponentName', () => {
  describe('when rendering', () => {
    it('should display the title', () => {
      // Test implementation
    });
  });

  describe('when user clicks save', () => {
    it('should call onSave callback', () => {
      // Test implementation
    });
  });
});
```

### Test Best Practices

- **Arrange, Act, Assert**: Structure tests clearly
- **Test Behavior**: Test what the component does, not how it does it
- **Mock External Dependencies**: Mock API calls and external services
- **Clean Up**: Clean up after tests to prevent interference

```javascript
// Good test example
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onSave when save button is clicked', async () => {
    render(<MyComponent title="Test" onSave={mockOnSave} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });
});
```

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body

footer
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(auth): add user authentication system

Implement JWT-based authentication with login/logout functionality.
Includes password hashing and session management.

Closes #123
```

```
fix(validation): handle empty form submission

Prevent form submission when required fields are empty.
Add proper error messages for validation failures.

Fixes #456
```

## Pull Request Process

### Before Submitting

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

5. **Push Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one approval required
3. **Testing**: QA testing for significant changes
4. **Merge**: Squash and merge preferred

## Issue Reporting

### Bug Reports

```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Version: [e.g., 1.2.0]

**Screenshots**
If applicable, add screenshots.
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the requested feature.

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.
```

## Performance Guidelines

### General Principles

- **Minimize Bundle Size**: Keep JavaScript bundles small
- **Lazy Loading**: Load components and data on demand
- **Memoization**: Use React.memo and useMemo appropriately
- **Virtual Scrolling**: For large lists (>100 items)
- **Database Optimization**: Use proper indexes and queries

### Performance Checklist

- [ ] Components are memoized where appropriate
- [ ] Large lists use virtual scrolling
- [ ] Images are optimized and lazy-loaded
- [ ] Database queries are optimized
- [ ] Bundle size is monitored
- [ ] Performance metrics are tracked

## Security Guidelines

### Input Validation

- **Client-Side**: Validate all user inputs
- **Server-Side**: Always validate on the server
- **Sanitization**: Sanitize data before storage
- **XSS Prevention**: Escape output properly

### Data Protection

- **Sensitive Data**: Never store sensitive data in client-side code
- **HTTPS**: Always use HTTPS in production
- **Authentication**: Implement proper authentication
- **Authorization**: Check permissions for all operations

### Security Checklist

- [ ] All inputs are validated and sanitized
- [ ] SQL injection prevention implemented
- [ ] XSS protection in place
- [ ] CSRF protection enabled
- [ ] Secure headers configured
- [ ] Dependencies are up to date

## Getting Help

### Resources

- **Documentation**: Check the `/docs` folder
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask for help in pull requests

### Contact

- **Technical Questions**: Create an issue with the `question` label
- **Bug Reports**: Create an issue with the `bug` label
- **Feature Requests**: Create an issue with the `enhancement` label

## License

By contributing to BOQ Builder, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to BOQ Builder! 🚀