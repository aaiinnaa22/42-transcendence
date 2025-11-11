# Testing Guide - 42 Transcendence Backend

## Prerequisites

1. **Docker must be running**
2. **Backend server must be running**

## Quick Start

### 1. Start Docker
```bash
# Start Docker Desktop (if not already running)
open -a Docker

# Wait for Docker to start, then run:
cd /Users/chilee/rich/42-transcendence
docker-compose up -d
```

### 2. Verify Backend is Running
```bash
curl http://localhost:4241/healthcheck
# Should return: {"status":"OK"}
```

### 3. Run Tests
```bash
cd backend
npm test
```

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## CI/CD Pipeline

### GitHub Actions
The project includes a complete CI/CD pipeline (`.github/workflows/ci.yml`) that:

1. **Runs on every push/PR** to main/develop branches
2. **Tests**: Runs Jest tests with mocked dependencies
3. **Builds**: Compiles TypeScript and builds frontend
4. **Docker**: Builds and tests Docker containers
5. **Coverage**: Generates and uploads test coverage reports

### Pipeline Stages
```yaml
test → build → docker
```

### Benefits for CI/CD
- ✅ **Fast execution** - No database setup needed (mocked Prisma)
- ✅ **Reliable** - Tests are deterministic and isolated
- ✅ **Coverage reporting** - Track test coverage over time
- ✅ **Docker validation** - Ensures containers build and run correctly
- ✅ **Parallel jobs** - Tests run independently of builds

### Local CI/CD Testing
```bash
# Test the same commands CI/CD runs
cd backend
npm ci          # Clean install (like CI)
npm test        # Run tests
npm run build   # Build TypeScript
```

## Current Tests

### User Update Tests (`src/__tests__/user-update.test.ts`)
- ✅ **Username Update**: Tests successful username updates
- ✅ **Error Handling**: Tests database error scenarios

## Test Structure

```
src/__tests__/
├── user-update.test.ts    # User profile update tests
└── (more test files can be added here)
```

## Adding New Tests

1. Create test file in `src/__tests__/` directory
2. Use `.test.ts` extension
3. Import Jest globals: `import { jest, describe, it, expect, beforeEach } from '@jest/globals'`
4. Mock external dependencies (Prisma, bcrypt, etc.)

## Example Test File Structure

```typescript
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock external dependencies
const mockPrisma = {
  user: {
    update: jest.fn() as jest.MockedFunction<any>,
  }
};

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('Your Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should test something', async () => {
    // Arrange
    mockPrisma.user.update.mockResolvedValue(mockData);
    
    // Act
    const result = await someFunction();
    
    // Assert
    expect(result).toEqual(expectedResult);
  });
});
```

## Troubleshooting

### Jest ES Modules Error
If you get "Cannot use import statement outside a module":
- The `NODE_OPTIONS="--experimental-vm-modules"` flag is already configured in package.json
- This is normal and expected for ES modules

### Docker Not Running
```bash
# Check if Docker is running
docker --version

# Start Docker Desktop
open -a Docker

# Wait 10-15 seconds, then start containers
docker-compose up -d
```

### Backend Not Responding
```bash
# Check Docker logs
docker-compose logs backend

# Restart containers
docker-compose down
docker-compose up -d
```

## Test Configuration

- **Jest Config**: `jest.config.js` (configured for ES modules)
- **Test Pattern**: `**/__tests__/**/*.test.ts`
- **Coverage**: Excludes `index.ts` and type definition files
- **Environment**: Node.js with TypeScript support

## Expected Output

```
PASS src/__tests__/user-update.test.ts
  User Update Tests
    ✓ should update username successfully (2 ms)
    ✓ should handle update errors (3 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.202 s
```
