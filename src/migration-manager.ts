import { CapacitorSqliteDriver } from "./capacitor-sqlite-driver";

/**
 * Manages database migrations by tracking and applying them in a controlled manner.
 */
export class MigrationManager {
  private readonly driver: CapacitorSqliteDriver;
  private readonly migrations: Record<string, string[]> | undefined;
  private static readonly MIGRATIONS_TABLE = '_migrations';

  /**
   * Creates a new MigrationManager instance.
   *
   * @param driver - The SQLite driver to use for database operations
   * @param migrations - A record of migration names to SQL queries
   */
  constructor(driver: CapacitorSqliteDriver, migrations?: Record<string, string[]>) {
    this.driver = driver;
    this.migrations = migrations;
  }

  /**
   * Applies all pending migrations that haven't been applied yet.
   *
   * @throws Error if no migrations are provided or if a migration fails
   */
  async applyMigrations(): Promise<void> {
    try {
      this.logInfo('Starting migration application...');

      if (!this.migrations || Object.keys(this.migrations).length === 0) {
        throw new Error('No migrations found');
      }

      await this.ensureMigrationsTable();
      const appliedMigrations = await this.getAppliedMigrations();
      this.logInfo('Applied Migrations:', appliedMigrations);

      const pendingMigrations = this.getPendingMigrations(appliedMigrations);

      if (pendingMigrations.length === 0) {
        this.logInfo('No pending migrations to apply');
        return;
      }

      for (const migrationName of pendingMigrations) {
        await this.applyMigration(migrationName);
      }

      this.logInfo('All migrations processed successfully');
    } catch (error) {
      this.logError('Error applying migrations:', error);
      throw error;
    }
  }

  /**
   * Gets the list of migrations that haven't been applied yet.
   */
  private getPendingMigrations(appliedMigrations: string[]): string[] {
    return Object.keys(this.migrations!)
      .filter(migration => !appliedMigrations.includes(migration));
  }

  /**
   * Applies a single migration within a transaction.
   */
  private async applyMigration(migrationName: string): Promise<void> {
    this.logInfo(`Applying migration ${migrationName}...`);
    const querys = this.migrations![migrationName];

    await this.executeInTransaction(async () => {

      for (const migrationQuery of querys) {
        await this.driver.execute(migrationQuery);
      }

      await this.markMigrationAsApplied(migrationName);
      this.logInfo(`Migration ${migrationName} applied successfully`);
    });
  }

  /**
   * Executes a function within a database transaction.
   * Automatically handles commit and rollback.
   */
  private async executeInTransaction(operation: () => Promise<void>): Promise<void> {
    await this.driver.run('BEGIN', []);
    try {
      await operation();
      await this.driver.run('COMMIT', []);
    } catch (error) {
      await this.driver.run('ROLLBACK', []);
      throw error;
    }
  }

  /**
   * Ensures the migrations tracking table exists.
   */
  private async ensureMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${MigrationManager.MIGRATIONS_TABLE} (
        id TEXT PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.driver.execute(query);
  }

  /**
   * Gets the list of already applied migrations.
   */
  private async getAppliedMigrations(): Promise<string[]> {
    const query = `SELECT id FROM ${MigrationManager.MIGRATIONS_TABLE} ORDER BY applied_at`;
    const result = await this.driver.query(query);
    return result?.map((row: { id: string }) => row.id) || [];
  }

  /**
   * Marks a migration as applied in the database.
   */
  private async markMigrationAsApplied(migrationName: string): Promise<void> {
    const query = `INSERT INTO ${MigrationManager.MIGRATIONS_TABLE} (id) VALUES (?)`;
    await this.driver.run(query, [migrationName]);
  }

  /**
   * Logs an informational message.
   */
  private logInfo(message: string, data?: any): void {
    if (data) {
      console.log(`🔧 ${message}`, data);
    } else {
      console.log(`🔧 ${message}`);
    }
  }

  /**
   * Logs an error message.
   */
  private logError(message: string, error: unknown): void {
    console.error(`❌ ${message}`, error);
  }
}
