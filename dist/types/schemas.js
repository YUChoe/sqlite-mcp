/**
 * Zod 스키마 정의
 * MCP 도구의 입력/출력 검증을 위한 스키마들
 */
import { z } from 'zod';
// ============================================================================
// 공통 스키마
// ============================================================================
/**
 * 데이터베이스 경로 스키마
 */
export const DatabasePathSchema = z.string()
    .min(1, '데이터베이스 경로는 필수입니다')
    .describe('SQLite 데이터베이스 파일 경로');
/**
 * 테이블 이름 스키마
 */
export const TableNameSchema = z.string()
    .min(1, '테이블 이름은 필수입니다')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, '유효한 테이블 이름이어야 합니다')
    .describe('테이블 이름');
/**
 * SQL 쿼리 스키마
 */
export const SQLQuerySchema = z.string()
    .min(1, 'SQL 쿼리는 필수입니다')
    .describe('실행할 SQL 쿼리');
/**
 * 쿼리 파라미터 스키마
 */
export const QueryParamsSchema = z.array(z.any())
    .optional()
    .describe('쿼리 파라미터 배열');
// ============================================================================
// Create 작업 스키마
// ============================================================================
/**
 * 테이블 컬럼 정의 스키마
 */
export const ColumnDefinitionSchema = z.object({
    name: z.string().min(1, '컬럼 이름은 필수입니다'),
    type: z.string().min(1, '컬럼 타입은 필수입니다'),
    constraints: z.string().optional()
});
/**
 * 테이블 생성 입력 스키마
 */
export const CreateTableSchema = z.object({
    dbPath: DatabasePathSchema,
    tableName: TableNameSchema,
    columns: z.array(ColumnDefinitionSchema)
        .min(1, '최소 하나의 컬럼이 필요합니다')
        .describe('테이블 컬럼 정의 배열')
});
/**
 * 데이터 삽입 입력 스키마
 */
export const InsertDataSchema = z.object({
    dbPath: DatabasePathSchema,
    tableName: TableNameSchema,
    data: z.record(z.any())
        .refine(obj => Object.keys(obj).length > 0, '삽입할 데이터가 필요합니다')
        .describe('삽입할 데이터 객체')
});
// ============================================================================
// Read 작업 스키마
// ============================================================================
/**
 * SELECT 쿼리 입력 스키마
 */
export const SelectDataSchema = z.object({
    dbPath: DatabasePathSchema,
    query: SQLQuerySchema,
    params: QueryParamsSchema
});
/**
 * 스키마 정보 조회 입력 스키마
 */
export const GetSchemaSchema = z.object({
    dbPath: DatabasePathSchema,
    tableName: TableNameSchema.optional()
        .describe('특정 테이블의 스키마 (선택사항)')
});
// ============================================================================
// Update 작업 스키마
// ============================================================================
/**
 * UPDATE 쿼리 입력 스키마
 */
export const UpdateDataSchema = z.object({
    dbPath: DatabasePathSchema,
    query: SQLQuerySchema,
    params: QueryParamsSchema
});
// ============================================================================
// Delete 작업 스키마
// ============================================================================
/**
 * DELETE 쿼리 입력 스키마
 */
export const DeleteDataSchema = z.object({
    dbPath: DatabasePathSchema,
    query: SQLQuerySchema,
    params: QueryParamsSchema
});
// ============================================================================
// Meta 명령 스키마
// ============================================================================
/**
 * SQLite 메타 명령 스키마
 */
export const MetaCommandSchema = z.object({
    dbPath: DatabasePathSchema,
    command: z.enum(['.tables', '.schema', '.indexes', '.pragma'])
        .describe('실행할 메타 명령'),
    target: z.string().optional()
        .describe('명령 대상 (테이블명 등)')
});
// ============================================================================
// 출력 스키마
// ============================================================================
/**
 * 쿼리 결과 스키마
 */
export const QueryResultSchema = z.object({
    success: z.boolean().describe('실행 성공 여부'),
    data: z.array(z.record(z.any())).optional().describe('조회된 데이터'),
    rowsAffected: z.number().optional().describe('영향받은 행 수'),
    lastInsertRowid: z.number().optional().describe('마지막 삽입된 행 ID'),
    error: z.string().optional().describe('오류 메시지')
});
/**
 * 스키마 정보 결과 스키마
 */
export const SchemaResultSchema = z.object({
    success: z.boolean().describe('실행 성공 여부'),
    tables: z.array(z.string()).optional().describe('테이블 목록'),
    schema: z.string().optional().describe('DDL 스키마'),
    columns: z.array(z.object({
        name: z.string(),
        type: z.string(),
        notnull: z.boolean(),
        dflt_value: z.any(),
        pk: z.boolean()
    })).optional().describe('컬럼 정보'),
    error: z.string().optional().describe('오류 메시지')
});
/**
 * 메타 명령 결과 스키마
 */
export const MetaResultSchema = z.object({
    success: z.boolean().describe('실행 성공 여부'),
    result: z.string().describe('명령 실행 결과'),
    error: z.string().optional().describe('오류 메시지')
});
//# sourceMappingURL=schemas.js.map