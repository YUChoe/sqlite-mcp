/**
 * SQLite 데이터베이스 연결 관리자
 * 여러 데이터베이스 파일에 대한 연결을 관리하고 캐싱합니다.
 */
import { Database, DatabaseManager as IDatabaseManager, QueryResult, TransactionResult, Operation } from '../types/index.js';
/**
 * SQLite 데이터베이스 매니저 구현
 */
export declare class DatabaseManager implements IDatabaseManager {
    private connections;
    private readonly maxConnections;
    private readonly connectionTimeout;
    /**
     * 데이터베이스 연결 가져오기
     * 캐시된 연결이 있으면 재사용하고, 없으면 새로 생성합니다.
     */
    getDatabase(dbPath: string): Database;
    /**
     * 특정 데이터베이스 연결 닫기
     */
    closeDatabase(dbPath: string): void;
    /**
     * 모든 데이터베이스 연결 닫기
     */
    closeAllDatabases(): void;
    /**
     * SQL 쿼리 실행
     */
    executeQuery(dbPath: string, sql: string, params?: any[]): QueryResult;
    /**
     * 트랜잭션 실행
     */
    executeTransaction(dbPath: string, operations: Operation[]): TransactionResult;
    /**
     * 경로 검증 및 정규화
     */
    private validateAndNormalizePath;
    /**
     * 새 데이터베이스 연결 생성
     */
    private createNewConnection;
    /**
     * 오래된 연결 정리
     */
    private cleanupOldConnections;
    /**
     * 데이터베이스 오류 처리
     */
    private handleDatabaseError;
    /**
     * SQL 오류 처리
     */
    private handleSQLError;
}
//# sourceMappingURL=DatabaseManager.d.ts.map