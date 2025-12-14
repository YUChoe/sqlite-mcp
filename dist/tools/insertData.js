/**
 * 데이터 삽입 도구
 * INSERT SQL을 생성하고 실행합니다.
 */
import { DatabaseManager } from '../database/DatabaseManager.js';
import { InsertDataSchema } from '../types/schemas.js';
/**
 * 데이터 삽입 도구 정의
 */
export const insertDataTool = {
    name: 'insert_data',
    description: 'SQLite 테이블에 새로운 데이터를 삽입합니다',
    inputSchema: InsertDataSchema,
    handler: insertDataHandler
};
/**
 * 데이터 삽입 핸들러
 */
async function insertDataHandler(params) {
    const dbManager = new DatabaseManager();
    try {
        // 입력 검증
        const validatedInput = InsertDataSchema.parse(params);
        // INSERT SQL 생성
        const { sql, values } = generateInsertSQL(validatedInput);
        // SQL 실행
        const result = await dbManager.executeQuery(validatedInput.dbPath, sql, values);
        const message = result.success
            ? `데이터가 성공적으로 삽입되었습니다. 삽입된 행 ID: ${result.lastInsertRowid || 'N/A'}`
            : `데이터 삽입 실패: ${result.error || '알 수 없는 오류'}`;
        return {
            content: [{
                    type: 'text',
                    text: message
                }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
        return {
            content: [{
                    type: 'text',
                    text: `데이터 삽입 중 오류 발생: ${errorMessage}`
                }]
        };
    }
}
/**
 * INSERT SQL 생성
 */
function generateInsertSQL(input) {
    const { tableName, data } = input;
    // 테이블 이름 검증
    if (!isValidTableName(tableName)) {
        throw new Error(`유효하지 않은 테이블 이름: ${tableName}`);
    }
    // 데이터 검증
    if (!data || Object.keys(data).length === 0) {
        throw new Error('삽입할 데이터가 없습니다');
    }
    // 컬럼과 값 추출
    const columns = Object.keys(data);
    const values = Object.values(data);
    // 컬럼 이름 검증
    for (const column of columns) {
        if (!isValidColumnName(column)) {
            throw new Error(`유효하지 않은 컬럼 이름: ${column}`);
        }
    }
    // 데이터 타입 변환 처리
    const processedValues = values.map(value => processValue(value));
    // SQL 생성
    const columnList = columns.join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;
    return { sql, values: processedValues };
}
/**
 * 값 처리 및 타입 변환
 */
function processValue(value) {
    // null 또는 undefined 처리
    if (value === null || value === undefined) {
        return null;
    }
    // 문자열 처리
    if (typeof value === 'string') {
        return value;
    }
    // 숫자 처리
    if (typeof value === 'number') {
        return value;
    }
    // 불린 처리 (SQLite는 0/1로 저장)
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    // 날짜 처리
    if (value instanceof Date) {
        return value.toISOString();
    }
    // 객체/배열은 JSON 문자열로 변환
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    // 기타 타입은 문자열로 변환
    return String(value);
}
/**
 * 테이블 이름 유효성 검사
 */
function isValidTableName(name) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
/**
 * 컬럼 이름 유효성 검사
 */
function isValidColumnName(name) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
/**
 * 데이터 삽입 함수 (MCP 서버에서 직접 호출용)
 */
export async function insertData(params) {
    return await insertDataHandler(params);
}
//# sourceMappingURL=insertData.js.map