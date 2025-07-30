import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy/driver";
/**
 * Callback function type for database availability notifications
 */
export type Listener = (ready: boolean) => void;

/**
 * Extended SQLite database interface with availability tracking
 */
export interface CapacitorSqliteRemoteDatabase<TSchema extends Record<string, unknown> = Record<string, never>> extends SqliteRemoteDatabase<TSchema> {
    /**
     * Register a callback to be notified when database becomes available
     */
    onAvailable: (callback: Listener) => void;

    /**
     * Current availability state of the database
     */
    isAvailable: boolean;
}