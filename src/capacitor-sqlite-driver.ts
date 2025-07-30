import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { map } from "./util";

/**
 * Driver for SQLite database operations using Capacitor
 */
export class CapacitorSqliteDriver {
  private connection: SQLiteDBConnection | null = null;
  private readonly sqlite: SQLiteConnection;
  private readonly dbName: string;

  constructor(dbName: string) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.dbName = dbName;
  }

  /**
   * Ensures database connection is available
   * @param operation - Name of the operation requiring connection
   * @throws Error if connection is not initialized
   */
  private ensureConnection(operation: string = 'operation'): SQLiteDBConnection {
    if (!this.connection) {
      throw new Error(`Database connection not initialized for ${operation}`);
    }
    return this.connection;
  }

  /**
   * Initializes the database connection
   */
  async init(): Promise<void> {
    try {
      // Copy database from assets if available
      await this.sqlite.copyFromAssets().catch((err) => {
        console.warn('⚠️ copyFromAssets failed:', err.message);
      });

      // Check connection consistency
      const { result: isConsistent } = await this.sqlite.checkConnectionsConsistency();

      if (!isConsistent) {
        await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      }

      // Retrieve and open connection
      this.connection = await this.sqlite.retrieveConnection(this.dbName, false);
      if (!this.connection) {
        throw new Error(`Failed to retrieve connection: ${this.dbName}`);
      }

      await this.connection.open();

      // Enable WAL mode for better performance
      await this.connection.query('PRAGMA journal_mode=WAL;');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Executes a SQL query and returns the results
   * @param query - SQL query to execute
   * @param params - Parameters for the query
   * @returns Query results as an array
   */
  async query(query: string, params: any[] = []): Promise<any[]> {
    try {
      const conn = this.ensureConnection('query');
      const result = await conn.query(query, params);
      return result.values || [];
    } catch (error) {
      console.error('Query failed:', query, params, error);
      throw error;
    }
  }

  /**
   * Executes a SQL statement
   * @param query - SQL statement to execute
   * @param transaction - Whether to execute in a transaction
   */
  async execute(query: string, transaction: boolean = false): Promise<void> {
    try {
      const conn = this.ensureConnection('execute');
      await conn.execute(query, transaction);
    } catch (error) {
      console.error('Execute failed:', query, error);
      throw error;
    }
  }

  /**
   * Runs a SQL statement with parameters
   * @param query - SQL statement to run
   * @param params - Parameters for the statement
   * @param transaction - Whether to run in a transaction
   * @returns Result of the operation
   */
  async run(query: string, params: any[] = [], transaction: boolean = false): Promise<any> {
    try {
      const conn = this.ensureConnection('run');
      const lowerCasedQuery = query.trim().toLowerCase();

      if (lowerCasedQuery.includes('begin')) {
        return await conn.beginTransaction();
      } else if (lowerCasedQuery.includes('commit')) {
        return await conn.commitTransaction();
      } else if (lowerCasedQuery.includes('rollback')) {
        return await conn.rollbackTransaction();
      } else {
        return await conn.run(query, params, transaction);
      }
    } catch (error) {
      console.error('Run failed:', query, params, error);
      throw error;
    }
  }

  /**
   * Executes multiple SQL statements in batch
   * @param queries - Array of SQL statements to execute
   */
  async batch(queries: string[]): Promise<void> {
    try {
      const conn = this.ensureConnection('batch');
      const formattedQueries = map(queries, (query) => ({
        statement: query,
        values: []
      }));
      await conn.executeSet(formattedQueries);
    } catch (error) {
      console.error('Batch failed:', queries, error);
      throw error;
    }
  }

  /**
   * Main method called by Drizzle proxy
   * @param sql - SQL statement to execute
   * @param params - Parameters for the statement
   * @param method - Method to use (run, all, values, get)
   * @param transaction - Whether to execute in a transaction
   * @returns Result rows
   */
  async call(
    sql: string,
    params: any[],
    method: "run" | "all" | "values" | "get",
    transaction: boolean = false
  ): Promise<{ rows: any[] }> {
    try {
      this.ensureConnection('call');

      switch (method) {
        case "run":
          await this.run(sql, params, transaction);
          return { rows: [] };

        case "all": {
          const result = await this.query(sql, params);
          return { rows: result || [] };
        }

        case "values": {
          const result = await this.query(sql, params);
          return {
            rows: (result || []).map((row: Record<string, any>) => Object.values(row))
          };
        }

        case "get": {
          const result = await this.query(sql, params);
          const firstRow = result?.[0];
          return { rows: firstRow ? [firstRow] : [] };
        }

        default:
          throw new Error(`Invalid method: ${method}`);
      }
    } catch (error) {
      console.error(`Method ${method} failed:`, sql, params, error);
      throw error;
    }
  }

  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        await this.sqlite.closeConnection(this.dbName, false);
        this.connection = null;
      } catch (error) {
        console.error('Error closing connection:', error);
        throw error;
      }
    }
  }
}
