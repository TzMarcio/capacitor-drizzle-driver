# capacitor-drizzle-driver

![npm version](https://img.shields.io/npm/v/capacitor-drizzle-driver?style=flat-square)
![npm downloads](https://img.shields.io/npm/dm/capacitor-drizzle-driver?style=flat-square)

Integration between Drizzle ORM and SQLite in Capacitor.

## Project Overview

The `capacitor-drizzle-driver` is a custom driver that enables integration between [Drizzle ORM](https://orm.drizzle.team/) and [@capacitor-community/sqlite](https://github.com/capacitor-community/sqlite) for mobile applications built with [Capacitor](https://capacitorjs.com/). This library allows developers to use Drizzle ORM's type-safe query building and schema definition capabilities with SQLite databases in Capacitor-based mobile applications.

### Key Features

- **Seamless Integration**: Connects Drizzle ORM with Capacitor's SQLite plugin
- **Transaction Management**: Handles SQL transactions with proper state tracking
- **Migration Support**: Provides a system for applying and tracking database migrations
- **Availability Tracking**: Notifies when the database becomes available for use
- **Performance Optimizations**: Enables WAL mode for better database performance

## Project Structure

```
capacitor-drizzle-driver/
├── src/
│   ├── index.ts                    # Main entry point with exports
│   ├── capacitor-sqlite-adapter.ts # Main adapter implementation
│   ├── capacitor-sqlite-driver.ts  # SQLite driver implementation
│   ├── migration-manager.ts        # Database migration handling
│   ├── types.ts                    # Type definitions
│   └── util.ts                     # Utility functions
├── dist/                           # Compiled output (generated)
├── package.json                    # Project metadata and dependencies
└── tsconfig.json                   # TypeScript configuration
```

### Key Components

1. **drizzleCapacitor** (`capacitor-sqlite-adapter.ts`): Main function to create a Drizzle ORM instance connected to a Capacitor SQLite database
2. **CapacitorSqliteDriver** (`capacitor-sqlite-driver.ts`): Handles low-level SQLite operations through Capacitor
3. **MigrationManager** (`migration-manager.ts`): Manages database schema migrations
4. **CapacitorSqliteRemoteDatabase** (`types.ts`): Extended interface with availability tracking

## Build and Test Procedures

### Building the Project

The project uses TypeScript and can be built using:

```bash
npm run build
```

This command compiles the TypeScript source files into JavaScript in the `dist/` directory.

### Installation in a Project

To use this library in a project:

1. Install the package:
   ```bash
   npm install capacitor-drizzle-driver
   ```

2. Install peer dependencies if not already present:
   ```bash
   npm install @capacitor/core @capacitor-community/sqlite drizzle-orm
   ```

## Code Style Guidelines

### General Guidelines

1. **TypeScript**: Use TypeScript for all code with proper type annotations
2. **Documentation**: Include JSDoc comments for all public functions, classes, and interfaces
3. **Error Handling**: Implement proper error handling with informative error messages
4. **Logging**: Use console.log/error with descriptive prefixes for important operations

### Specific Patterns

1. **Transaction Management**: Use the transaction state tracking pattern in `capacitor-sqlite-adapter.ts`
2. **Connection Management**: Follow the connection initialization pattern in `capacitor-sqlite-driver.ts`
3. **Migration Handling**: Follow the migration tracking pattern in `migration-manager.ts`

## Usage Examples

### Basic Usage

```typescript
import { drizzleCapacitor } from 'capacitor-drizzle-driver';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define your schema
const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age')
});

// Initialize the database
const db = drizzleCapacitor('my-database');

// Wait for database to be available
db.onAvailable(async (isAvailable) => {
  if (isAvailable) {
    // Query the database
    const allUsers = await db.select().from(users);
    console.log('Users:', allUsers);
  }
});
```

### With Migrations

```typescript
import { drizzleCapacitor } from 'capacitor-drizzle-driver';

// Define migrations
const migrations = {
  'v1': [`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER
    );
  `],
  'v2': [`
    ALTER TABLE users ADD COLUMN email TEXT;
  `]
};

// Initialize with migrations
const db = drizzleCapacitor('my-database', migrations);

// Database will be automatically migrated to the latest version
db.onAvailable((isAvailable) => {
  if (isAvailable) {
    console.log('Database is ready with all migrations applied');
  }
});
```

## Troubleshooting

Common issues and their solutions:

1. **Database Connection Issues**: Ensure Capacitor SQLite plugin is properly installed and initialized
2. **Migration Failures**: Check migration SQL syntax and ensure migrations are applied in the correct order
3. **Transaction Errors**: Verify that BEGIN/COMMIT/ROLLBACK statements are properly handled

## Contributing

When contributing to this project:

1. Follow the established code style and patterns
2. Add comprehensive JSDoc comments for new code
3. Handle errors appropriately with detailed error messages
4. Test thoroughly on both Android and iOS platforms