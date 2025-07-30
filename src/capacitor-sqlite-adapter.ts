import { AsyncRemoteCallback, drizzle as baseDrizzle } from 'drizzle-orm/sqlite-proxy';
import { CapacitorSqliteDriver } from "./capacitor-sqlite-driver";
import { DrizzleConfig } from "drizzle-orm";
import { MigrationManager } from "./migration-manager";
import {CapacitorSqliteRemoteDatabase, Listener} from "./types";

/**
 * SQL command types for transaction state management
 */
enum SqlCommandType {
  BEGIN,
  COMMIT_OR_ROLLBACK,
  OTHER
}

/**
 * Detects the type of SQL command for transaction management
 *
 * @param sql - SQL command to analyze
 * @returns The detected command type
 */
function detectSqlCommandType(sql: string): SqlCommandType {
  const normalizedSql = sql.trim().toLowerCase();

  if (normalizedSql.startsWith('begin')) {
    return SqlCommandType.BEGIN;
  }

  if (normalizedSql.startsWith('commit') || normalizedSql.startsWith('rollback')) {
    return SqlCommandType.COMMIT_OR_ROLLBACK;
  }

  return SqlCommandType.OTHER;
}

/**
 * Creates a SQLite driver callback for Drizzle ORM
 *
 * @param driver - The Capacitor SQLite driver instance
 * @param initialTransactionState - Initial transaction state
 * @returns Async callback function for Drizzle ORM
 */
export function capacitorSqliteDriver(
  driver: CapacitorSqliteDriver,
  initialTransactionState: boolean = true
): AsyncRemoteCallback {
  // Use a closure to maintain transaction state
  let transactionState = initialTransactionState;

  return async (sql, params, method) => {
    // Update transaction state based on SQL command
    const commandType = detectSqlCommandType(sql);

    if (commandType === SqlCommandType.COMMIT_OR_ROLLBACK) {
      transactionState = true;
    }

    // Execute the SQL command
    const result = driver.call(sql, params, method, transactionState);

    if (commandType === SqlCommandType.BEGIN) {
      transactionState = false;
    }

    return result;
  };
}

/**
 * Creates a Drizzle ORM instance connected to a Capacitor SQLite database
 *
 * @param db - Database name
 * @param migrations - Optional database migrations
 * @param config - Optional Drizzle configuration
 * @returns A configured database instance
 */
export function drizzleCapacitor<TSchema extends Record<string, unknown>>(
  db: string,
  migrations?: Record<string, string>,
  config?: DrizzleConfig<TSchema>
): CapacitorSqliteRemoteDatabase<TSchema> {
  // Initialize the driver and migration manager
  const driver = new CapacitorSqliteDriver(db);
  const migration = new MigrationManager(driver, migrations);

  // Create the database instance
  const instance = baseDrizzle<TSchema>(
    capacitorSqliteDriver(driver, true),
    undefined,
    config
  ) as CapacitorSqliteRemoteDatabase<TSchema>;

  // Set up availability tracking
  const listeners: Listener[] = [];
  instance.isAvailable = false;

  // Define the onAvailable method
  instance.onAvailable = (callback: Listener) => {
    // Immediately notify with current state
    callback(instance.isAvailable);
    // Register for future updates
    listeners.push(callback);
  };

  // Initialize the database and apply migrations
  driver.init().then(async () => {
    await migration.applyMigrations();

    // Update availability state and notify listeners
    instance.isAvailable = true;
    for (const listener of listeners) {
      listener(instance.isAvailable);
    }
  });

  return instance;
}



