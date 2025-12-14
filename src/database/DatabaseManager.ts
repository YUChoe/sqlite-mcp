/**
 * SQLite 데이터베이스 연결 관리자
 * 여러 데이터베이스 파일에 대한 연결을 관리하고 캐싱합니다.
 */

import BetterSQLite3Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import {
  Database,
  DatabaseManager as IDatabaseManager,
  QueryResult,
  TransactionResult,
  Operation,
  DatabaseErrorType,
  SQLErrorType
} from '../types/index';

/**
 * SQLite 데이터베이스 매니저 구현
 */
export class DatabaseManager implements IDatabaseManager {
  private connections: Map<string, Database> = new Map();
  private readonly maxConnections: number = 50;
  private readonly connectionTimeout: number = 30 * 60 * 1000; // 30분

  /**
   * 데이터베이스 연결 가져오기
   * 캐시된 연결이 있으면 재사용하고, 없으면 새로 생성합니다.
   */
  getDatabase(dbPath: string): Database {
    // 경로 검증 및 정규화
    const normalizedPath = this.validateAndNormalizePath(dbPath);

    // 기존 연결 확인
    const existingDb = this.connections.get(normalizedPath);
    if (existingDb) {
      existingDb.lastAccessed = new Date();
      return existingDb;
    }

    // 연결 수 제한 확인
    if (this.connections.size >= this.maxConnections) {
      this.cleanupOldConnections();
    }

    // 새 연결 생성
    const database = this.createNewConnection(normalizedPath);
    this.connections.set(normalizedPath, database);

    return database;
  }

  /**
   * 특정 데이터베이스 연결 닫기
   */
  closeDatabase(dbPath: string): void {
    const normalizedPath = this.validateAndNormalizePath(dbPath);
    const database = this.connections.get(normalizedPath);

    if (database) {
      database.connection.close();
      this.connections.delete(normalizedPath);
    }
  }

  /**
   * 모든 데이터베이스 연결 닫기
   */
  closeAllDatabases(): void {
    for (const [, database] of this.connections) {
      database.connection.close();
    }
    this.connections.clear();
  }
  /**
   * SQL 쿼리 실행
   */
  executeQuery(dbPath: string, sql: string, params: any[] = []): QueryResult {
    try {
      const database = this.getDatabase(dbPath);
      const stmt = database.connection.prepare(sql);

      // 쿼리 타입에 따른 실행
      if (sql.trim().toLowerCase().startsWith('select')) {
        const rows = stmt.all(...params);
        return {
          success: true,
          data: rows
        };
      } else {
        const info = stmt.run(...params);
        const result: QueryResult = {
          success: true,
          rowsAffected: info.changes
        };
        if (typeof info.lastInsertRowid === 'number') {
          result.lastInsertRowid = info.lastInsertRowid;
        }
        return result;
      }
    } catch (error) {
      return this.handleSQLError(error as Error, sql);
    }
  }

  /**
   * 트랜잭션 실행
   */
  executeTransaction(dbPath: string, operations: Operation[]): TransactionResult {
    const database = this.getDatabase(dbPath);
    const results: QueryResult[] = [];

    try {
      database.connection.exec('BEGIN TRANSACTION');

      for (const operation of operations) {
        const result = this.executeQuery(dbPath, operation.sql, operation.params);
        results.push(result);

        if (!result.success) {
          database.connection.exec('ROLLBACK');
          return {
            success: false,
            results,
            error: result.error || '알 수 없는 오류가 발생했습니다'
          };
        }
      }

      database.connection.exec('COMMIT');
      return {
        success: true,
        results
      };
    } catch (error) {
      database.connection.exec('ROLLBACK');
      return {
        success: false,
        results,
        error: (error as Error).message
      };
    }
  }

  /**
   * 경로 검증 및 정규화
   */
  private validateAndNormalizePath(dbPath: string): string {
    if (!dbPath || typeof dbPath !== 'string') {
      throw new DatabaseManagerError({
        type: DatabaseErrorType.INVALID_PATH,
        message: '데이터베이스 경로가 유효하지 않습니다',
        path: dbPath,
        originalError: undefined
      });
    }

    // 디렉토리 트래버설 공격 방지
    if (dbPath.includes('..')) {
      throw new DatabaseManagerError({
        type: DatabaseErrorType.INVALID_PATH,
        message: '상위 디렉토리 접근은 허용되지 않습니다',
        path: dbPath,
        originalError: undefined
      });
    }

    const normalizedPath = path.resolve(dbPath);

    return normalizedPath;
  }
  /**
   * 새 데이터베이스 연결 생성
   */
  private createNewConnection(dbPath: string): Database {
    try {
      // 디렉토리가 존재하지 않으면 생성
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // SQLite 연결 생성
      const connection = new BetterSQLite3Database(dbPath);

      // WAL 모드 활성화 (동시성 향상)
      connection.pragma('journal_mode = WAL');

      return {
        path: dbPath,
        connection,
        lastAccessed: new Date()
      };
    } catch (error) {
      throw this.handleDatabaseError(error as Error, dbPath);
    }
  }

  /**
   * 오래된 연결 정리
   */
  private cleanupOldConnections(): void {
    const now = new Date();
    const connectionsToRemove: string[] = [];

    for (const [path, database] of this.connections) {
      const timeDiff = now.getTime() - database.lastAccessed.getTime();
      if (timeDiff > this.connectionTimeout) {
        connectionsToRemove.push(path);
      }
    }

    // 가장 오래된 연결부터 제거
    connectionsToRemove.forEach(dbPath => {
      const database = this.connections.get(dbPath);
      if (database) {
        database.connection.close();
        this.connections.delete(dbPath);
      }
    });

    // 여전히 제한을 초과하면 가장 오래된 연결 제거
    if (this.connections.size >= this.maxConnections) {
      const oldestEntry = Array.from(this.connections.entries())
        .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime())[0];

      if (oldestEntry) {
        const [dbPath, database] = oldestEntry;
        database.connection.close();
        this.connections.delete(dbPath);
      }
    }
  }

  /**
   * 데이터베이스 오류 처리
   */
  private handleDatabaseError(error: Error, dbPath: string): DatabaseManagerError {
    let errorType = DatabaseErrorType.CORRUPTED_DATABASE;

    if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
      errorType = DatabaseErrorType.INVALID_PATH;
    } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
      errorType = DatabaseErrorType.PERMISSION_DENIED;
    } else if (error.message.includes('ENOSPC') || error.message.includes('disk full')) {
      errorType = DatabaseErrorType.DISK_FULL;
    }

    return new DatabaseManagerError({
      type: errorType,
      message: error.message,
      path: dbPath,
      originalError: error
    });
  }

  /**
   * SQL 오류 처리
   */
  private handleSQLError(error: Error, _sql: string): QueryResult {
    let errorType = SQLErrorType.SYNTAX_ERROR;

    if (error.message.includes('no such table')) {
      errorType = SQLErrorType.TABLE_NOT_EXISTS;
    } else if (error.message.includes('no such column')) {
      errorType = SQLErrorType.COLUMN_NOT_EXISTS;
    } else if (error.message.includes('constraint')) {
      errorType = SQLErrorType.CONSTRAINT_VIOLATION;
    } else if (error.message.includes('type')) {
      errorType = SQLErrorType.TYPE_MISMATCH;
    }

    return {
      success: false,
      error: `${errorType}: ${error.message}`
    };
  }
}

/**
 * 데이터베이스 매니저 오류 클래스
 */
class DatabaseManagerError extends Error {
  public readonly type: DatabaseErrorType;
  public readonly path: string;
  public readonly originalError: Error | undefined;

  constructor(config: {
    type: DatabaseErrorType;
    message: string;
    path: string;
    originalError: Error | undefined;
  }) {
    super(config.message);
    this.name = 'DatabaseManagerError';
    this.type = config.type;
    this.path = config.path;
    this.originalError = config.originalError;
  }
}