/**
 * 테이블 생성 도구
 * CREATE TABLE SQL을 생성하고 실행합니다.
 */
import { DatabaseManager } from '../database/DatabaseManager.js';
import { CreateTableSchema, QueryResultSchema } from '../types/schemas.js';
import { zodToJsonSchema } from '../utils/schemaConverter.js';
/**
 * 테이블 생성 도구 정의
 */
export const createTableTool = {
    name: 'create_table',
    description: '새로운 SQLite 테이블을 생성합니다',
    inputSchema: zodToJsonSchema(CreateTableSchema),
    outputSchema: zodToJsonSchema(QueryResultSchema),
    handler: createTableHandler
};
/**
 * 테이블 생성 핸들러
 */
async function createTableHandler(params) {
    const dbManager = new DatabaseManager();
    try {
        // 입력 검증
        const validatedInput = CreateTableSchema.parse(params);
        // CREATE TABLE SQL 생성
        const sql = generateCreateTableSQL(validatedInput);
        // SQL 실행
        const result = dbManager.executeQuery(validatedInput.dbPath, sql);
        const output = {
            success: result.success,
            rowsAffected: result.rowsAffected,
            error: result.error
        };
        return {
            content: [{
                    type: 'text',
                    text: result.success
                        ? `테이블 '${validatedInput.tableName}'이(가) 성공적으로 생성되었습니다.`
                        : `테이블 생성 실패: ${result.error}`
                }],
            structuredContent: output
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
        return {
            content: [{
                    type: 'text',
                    text: `테이블 생성 중 오류 발생: ${errorMessage}`
                }],
            structuredContent: {
                success: false,
                error: errorMessage
            }
        };
    }
}
/**
 * CREATE TABLE SQL 생성
 */
function generateCreateTableSQL(input) {
    const { tableName, columns } = input;
    // 테이블 이름 검증
    if (!isValidTableName(tableName)) {
        throw new Error(`유효하지 않은 테이블 이름: ${tableName}`);
    }
    // 컬럼 정의 생성
    const columnDefinitions = columns.map(column => {
        if (!isValidColumnName(column.name)) {
            throw new Error(`유효하지 않은 컬럼 이름: ${column.name}`);
        }
        if (!isValidColumnType(column.type)) {
            throw new Error(`유효하지 않은 컬럼 타입: ${column.type}`);
        }
        let definition = `${column.name} ${column.type}`;
        if (column.constraints) {
            definition += ` ${column.constraints}`;
        }
        return definition;
    });
    return `CREATE TABLE ${tableName} (${columnDefinitions.join(', ')})`;
}
/**
 * 테이블 이름 유효성 검사
 */
function isValidTableName(name) {
    // SQLite 식별자 규칙: 문자나 밑줄로 시작, 문자/숫자/밑줄만 포함
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
/**
 * 컬럼 이름 유효성 검사
 */
function isValidColumnName(name) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}
/**
 * 컬럼 타입 유효성 검사
 */
function isValidColumnType(type) {
    const validTypes = [
        'INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC',
        'VARCHAR', 'CHAR', 'BOOLEAN', 'DATE', 'DATETIME',
        'TIMESTAMP', 'DECIMAL', 'FLOAT', 'DOUBLE'
    ];
    // 기본 타입 확인
    const baseType = type.split('(')[0].toUpperCase();
    return validTypes.includes(baseType);
}
/**
 * 테이블 생성 함수 (MCP 서버에서 직접 호출용)
 */
export async function createTable(params) {
    const result = await createTableHandler(params);
    return result.structuredContent;
}
//# sourceMappingURL=createTable.js.map