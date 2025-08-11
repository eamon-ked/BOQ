# BOQ Builder - Development Setup Guide

This guide will help you set up the BOQ Builder application for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [IDE Configuration](#ide-configuration)
- [Database Management](#database-management)
- [Testing Setup](#testing-setup)

## Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (v8.0.0 or higher)
   - Comes with Node.js
   - Verify installation: `npm --version`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

4. **SQLite** (for database)
   - Usually comes pre-installed on most systems
   - Verify installation: `sqlite3 --version`

### Recommended Software

1. **Visual Studio Code** - Recommended IDE
2. **Chrome DevTools** - For debugging
3. **Postman** - For API testing (if applicable)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/boq-builder.git
cd boq-builder

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env

# 4. Initialize database
npm run db:init

# 5. Start development server
npm run dev

# 6. Open browser to http://localhost:5173
```

## Detailed Setup

### 1. Clone and Navigate

```bash
git clone https://github.com/your-org/boq-builder.git
cd boq-builder
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter permission issues on macOS/Linux:
sudo npm install

# For clean install (removes node_modules first):
npm ci
```

### 3. Environment Configuration

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` with your local settings:

```env
# Development settings
NODE_ENV=development
PORT=5173
VITE_API_BASE_URL=http://localhost:3001

# Database settings
DATABASE_PATH=./server/boq.db
DATABASE_URL=sqlite:./server/boq.db

# Feature flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Optional: External services
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_ANALYTICS_ID=your_analytics_id_here
```

### 4. Database Setup

```bash
# Initialize database with schema
npm run db:init

# Seed with sample data (optional)
npm run db:seed

# Run any pending migrations
npm run db:migrate
```

### 5. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm run dev:client    # Frontend only (port 5173)
npm run dev:server    # Backend only (port 3001)
```

### 6. Verify Setup

Open your browser to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001 (if applicable)

You should see the BOQ Builder application loading with sample data.

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Run database migrations (if any)
npm run db:migrate

# 4. Start development server
npm run dev

# 5. Make your changes...

# 6. Run tests before committing
npm test

# 7. Commit and push
git add .
git commit -m "feat: your changes"
git push origin your-branch
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only

# Building
npm run build            # Build for production
npm run preview          # Preview production build
npm run analyze          # Analyze bundle size

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:ui          # Run tests with UI

# Code Quality
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Database
npm run db:init          # Initialize database
npm run db:seed          # Seed with sample data
npm run db:migrate       # Run migrations
npm run db:reset         # Reset database
npm run db:backup        # Backup database

# Utilities
npm run clean            # Clean build artifacts
npm run deps:check       # Check for outdated dependencies
npm run deps:update      # Update dependencies
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Error: Port 5173 is already in use
# Solution: Kill the process or use a different port

# Find process using port
lsof -ti:5173

# Kill process
kill -9 $(lsof -ti:5173)

# Or use different port
PORT=5174 npm run dev
```

#### 2. Node Version Issues

```bash
# Error: Node version not supported
# Solution: Use Node Version Manager

# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use correct Node version
nvm install 18
nvm use 18
```

#### 3. Database Issues

```bash
# Error: Database locked or corrupted
# Solution: Reset database

npm run db:reset
npm run db:seed
```

#### 4. Module Not Found

```bash
# Error: Cannot resolve module
# Solution: Clear cache and reinstall

rm -rf node_modules package-lock.json
npm install
```

#### 5. Build Failures

```bash
# Error: Build fails
# Solution: Check for TypeScript errors

npm run type-check
npm run lint
```

### Getting Help

1. **Check the logs**: Look at console output for error details
2. **Clear cache**: Try `npm run clean` and restart
3. **Check dependencies**: Run `npm run deps:check`
4. **Search issues**: Look for similar issues on GitHub
5. **Ask for help**: Create an issue with error details

## IDE Configuration

### Visual Studio Code

#### Recommended Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

#### Settings Configuration

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

#### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Other IDEs

#### WebStorm
- Enable ESLint and Prettier
- Configure Node.js interpreter
- Set up run configurations

#### Sublime Text
- Install Package Control
- Install ESLint and Prettier packages
- Configure syntax highlighting

## Database Management

### Database Schema

The application uses SQLite with the following main tables:

```sql
-- Items table
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price REAL NOT NULL,
  -- ... other fields
);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  -- ... other fields
);

-- BOQ items table
CREATE TABLE boq_items (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  item_id TEXT,
  quantity REAL NOT NULL,
  -- ... other fields
);
```

### Database Operations

```bash
# View database schema
sqlite3 server/boq.db ".schema"

# View table data
sqlite3 server/boq.db "SELECT * FROM items LIMIT 10;"

# Backup database
cp server/boq.db server/boq_backup_$(date +%Y%m%d).db

# Restore database
cp server/boq_backup_20231201.db server/boq.db
```

### Migration System

Create new migration:

```bash
# Create migration file
touch server/migrations/$(date +%Y%m%d_%H%M%S)_migration_name.sql
```

Migration file format:

```sql
-- Migration: Add new column to items table
-- Date: 2023-12-01

ALTER TABLE items ADD COLUMN new_field TEXT;

-- Rollback
-- ALTER TABLE items DROP COLUMN new_field;
```

## Testing Setup

### Test Environment

Tests use Vitest with the following setup:

```javascript
// src/test/setup.js
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Global test setup
beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks()
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/components/ItemSelector.test.jsx

# Run tests matching pattern
npm test -- --grep "validation"

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

Example test structure:

```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

## Performance Monitoring

### Development Tools

1. **React DevTools**: Browser extension for React debugging
2. **Vite DevTools**: Built-in development server tools
3. **Bundle Analyzer**: `npm run analyze` to check bundle size
4. **Performance Tab**: Chrome DevTools performance monitoring

### Monitoring Commands

```bash
# Analyze bundle size
npm run analyze

# Check for performance issues
npm run perf:check

# Monitor memory usage
npm run perf:memory

# Profile application
npm run perf:profile
```

## Next Steps

After setting up your development environment:

1. **Read the Documentation**: Check `/docs` folder for detailed guides
2. **Explore the Codebase**: Start with `src/App.jsx` and work your way through
3. **Run the Tests**: Understand how testing works in the project
4. **Make a Small Change**: Try adding a simple feature or fixing a bug
5. **Join the Community**: Participate in discussions and code reviews

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

Happy coding! 🚀