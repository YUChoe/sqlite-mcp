/**
 * SQL 쿼리 실행 유틸리티
 * 매개변수화된 쿼리, 트랜잭션 처리, 오류 분류를 위한 헬퍼 함수들
 */
import { SQLErrorType } from '../types/index';
/**
 * SQL 쿼리 타입 감지
 */
export function detectQueryType(sql) {
    const trimmedSql = sql.trim().toUpperCase();
    if (trimmedSql.startsWith('SELECT'))
        return 'SELECT';
    if (trimmedSql.startsWith('INSERT'))
        return 'INSERT';
    if (trimmedSql.startsWith('UPDATE'))
        return 'UPDATE';
    if (trimmedSql.startsWith('DELETE'))
        return 'DELETE';
    if (trimmedSql.startsWith('CREATE'))
        return 'CREATE';
    if (trimmedSql.startsWith('DROP'))
        return 'DROP';
    if (trimmedSql.startsWith('ALTER'))
        return 'ALTER';
    if (trimmedSql.startsWith('PRAGMA'))
        return 'PRAGMA';
    return 'UNKNOWN';
}
/**
 * SQL 매개변수 검증
 */
export function validateSQLParams(sql, params) {
    // ? 플레이스홀더 개수 계산
    const placeholderCount = (sql.match(/\?/g) || []).length;
    return placeholderCount === params.length;
}
/**
 * 안전한 테이블명 검증
 */
export function validateTableName(tableName) {
    // SQLite 테이블명 규칙: 문자, 숫자, 언더스코어만 허용, 숫자로 시작 불가
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return tableNameRegex.test(tableName) && tableName.length <= 64;
}
/**
 * 안전한 컬럼명 검증
 */
export function validateColumnName(columnName) {
    // SQLite 컬럼명 규칙: 테이블명과 동일
    return validateTableName(columnName);
}
/**
 * SQL 인젝션 기본 검사
 */
export function basicSQLInjectionCheck(sql) {
    const dangerousPatterns = [
        /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER)\s+/i,
        /UNION\s+SELECT/i,
        /--/,
        /\/\*/,
        /\*\//,
        /xp_/i,
        /sp_/i
    ];
    return !dangerousPatterns.some(pattern => pattern.test(sql));
}
/**
 * 트랜잭션 작업 빌더
 */
export class TransactionBuilder {
    operations = [];
    /**
     * 작업 추가
     */
    addOperation(sql, params) {
        this.operations.push({ sql, params: params || [] });
        return this;
    }
    /**
     * INSERT 작업 추가
     */
    insert(tableName, data) {
        if (!validateTableName(tableName)) {
            throw new Error(`Invalid table name: ${tableName}`);
        }
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        return this.addOperation(sql, values);
    }
    /**
     * UPDATE 작업 추가
     */
    update(tableName, data, whereClause, whereParams) {
        if (!validateTableName(tableName)) {
            throw new Error(`Invalid table name: ${tableName}`);
        }
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
        const params = [...values, ...(whereParams || [])];
        return this.addOperation(sql, params);
    }
    /**
     * DELETE 작업 추가
     */
    delete(tableName, whereClause, whereParams) {
        if (!validateTableName(tableName)) {
            throw new Error(`Invalid table name: ${tableName}`);
        }
        const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
        return this.addOperation(sql, whereParams || []);
    }
    /**
     * 작업 목록 반환
     */
    build() {
        return [...this.operations];
    }
    /**
     * 작업 목록 초기화
     */
    clear() {
        this.operations = [];
        return this;
    }
}
/**
 * 쿼리 결과 검증
 */
export function validateQueryResult(result, expectedType) {
    if (!result.success) {
        return false;
    }
    if (expectedType === 'SELECT') {
        return Array.isArray(result.data);
    }
    else {
        return typeof result.rowsAffected === 'number';
    }
}
/**
 * SQL 오류 분류
 */
export function classifySQLError(error) {
    const message = error.message.toLowerCase();
    if (message.includes('syntax error') || message.includes('near')) {
        return SQLErrorType.SYNTAX_ERROR;
    }
    if (message.includes('no such table')) {
        return SQLErrorType.TABLE_NOT_EXISTS;
    }
    if (message.includes('no such column')) {
        return SQLErrorType.COLUMN_NOT_EXISTS;
    }
    if (message.includes('constraint') || message.includes('unique') || message.includes('foreign key')) {
        return SQLErrorType.CONSTRAINT_VIOLATION;
    }
    if (message.includes('type') || message.includes('affinity')) {
        return SQLErrorType.TYPE_MISMATCH;
    }
    return SQLErrorType.SYNTAX_ERROR; // 기본값
}
/**
 * 쿼리 성능 측정 래퍼
 */
export function measureQueryPerformance(operation, queryType, onComplete) {
    const startTime = process.hrtime.bigint();
    try {
        const result = operation();
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // 밀리초로 변환
        if (onComplete) {
            onComplete(duration, queryType);
        }
        return result;
    }
    catch (error) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000;
        if (onComplete) {
            onComplete(duration, `${queryType}_ERROR`);
        }
        throw error;
    }
}
/**
 * 배치 작업 처리
 */
export function createBatchOperations(tableName, records, batchSize = 100) {
    if (!validateTableName(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
    }
    if (records.length === 0) {
        return [];
    }
    const batches = [];
    const columns = Object.keys(records[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const operations = batch.map(record => ({
            sql,
            params: columns.map(col => record[col])
        }));
        batches.push(operations);
    }
    return batches;
}
//# sourceMappingURL=QueryUtils.js.map