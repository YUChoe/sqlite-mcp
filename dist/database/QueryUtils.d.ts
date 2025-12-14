/**
 * SQL 쿼리 실행 유틸리티
 * 매개변수화된 쿼리, 트랜잭션 처리, 오류 분류를 위한 헬퍼 함수들
 */
import { QueryResult, Operation, SQLErrorType } from '../types/index';
/**
 * SQL 쿼리 타입 감지
 */
export declare function detectQueryType(sql: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER' | 'PRAGMA' | 'UNKNOWN';
/**
 * SQL 매개변수 검증
 */
export declare function validateSQLParams(sql: string, params: any[]): boolean;
/**
 * 안전한 테이블명 검증
 */
export declare function validateTableName(tableName: string): boolean;
/**
 * 안전한 컬럼명 검증
 */
export declare function validateColumnName(columnName: string): boolean;
/**
 * SQL 인젝션 기본 검사
 */
export declare function basicSQLInjectionCheck(sql: string): boolean;
/**
 * 트랜잭션 작업 빌더
 */
export declare class TransactionBuilder {
    private operations;
    /**
     * 작업 추가
     */
    addOperation(sql: string, params?: any[]): TransactionBuilder;
    /**
     * INSERT 작업 추가
     */
    insert(tableName: string, data: Record<string, any>): TransactionBuilder;
    /**
     * UPDATE 작업 추가
     */
    update(tableName: string, data: Record<string, any>, whereClause: string, whereParams?: any[]): TransactionBuilder;
    /**
     * DELETE 작업 추가
     */
    delete(tableName: string, whereClause: string, whereParams?: any[]): TransactionBuilder;
    /**
     * 작업 목록 반환
     */
    build(): Operation[];
    /**
     * 작업 목록 초기화
     */
    clear(): TransactionBuilder;
}
/**
 * 쿼리 결과 검증
 */
export declare function validateQueryResult(result: QueryResult, expectedType: 'SELECT' | 'MODIFY'): boolean;
/**
 * SQL 오류 분류
 */
export declare function classifySQLError(error: Error): SQLErrorType;
/**
 * 쿼리 성능 측정 래퍼
 */
export declare function measureQueryPerformance<T>(operation: () => T, queryType: string, onComplete?: (duration: number, queryType: string) => void): T;
/**
 * 배치 작업 처리
 */
export declare function createBatchOperations(tableName: string, records: Record<string, any>[], batchSize?: number): Operation[][];
//# sourceMappingURL=QueryUtils.d.ts.map