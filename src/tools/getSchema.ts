/**
 * 스키마 정보 조회 도구
 * SQLite 데이터베이스의 테이블 목록과 스키마 정보를 조회하는 기능을 제공합니다.
 */

import { DatabaseManager } from '../database/DatabaseManager.js';
import { GetSchemaSchema, SchemaResultSchema } from '../types/schemas.js';
import type { GetSchemaInput, SchemaResultOutput } from '../types/schemas.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';
import { zodToJsonSchema } from '../utils/schemaConverter.js';

/**
 * 스키마 정보 조회 도구
 */
export const getSchemaTool: ToolDefinition = {
  name: 'get_schema',
  description: 'SQLite 데이터베이스의 테이블 목록과 스키마 정보를 조회합니다. 특정 테이블을 지정하면 해당 테이블의 상세 정보를 반환합니다.',
  inputSchema: zodToJsonSchema(GetSchemaSchema),
  outputSchema: zodToJsonSchema(SchemaResultSchema),
  handler: getSchemaHandler
};

/**
 * 스키마 정보 조회 핸들러
 */
async function getSchemaHandler(params: GetSchemaInput): Promise<ToolResult> {
  try {
    // 입력 검증
    const validatedParams = GetSchemaSchema.parse(params);
    const { dbPath, tableName } = validatedParams;

    // 데이터베이스 매니저 인스턴스 생성
    const dbManager = new DatabaseManager();

    let result: SchemaResultOutput;

    if (tableName) {
      // 특정 테이블의 스키마 정보 조회
      result = await getTableSchema(dbManager, dbPath, tableName);
    } else {
      // 모든 테이블 목록 조회
      result = await getAllTables(dbManager, dbPath);
    }

    // 결과 검증 및 반환
    const validatedResult = SchemaResultSchema.parse(result);

    return {
      content: [{ type: 'text', text: JSON.stringify(validatedResult, null, 2) }],
      structuredContent: validatedResult
    };

  } catch (error) {
    const result: SchemaResultOutput = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result
    };
  }
}

/**
 * 모든 테이블 목록을 조회합니다
 */
async function getAllTables(dbManager: DatabaseManager, dbPath: string): Promise<SchemaResultOutput> {
  try {
    // SQLite 시스템 테이블에서 사용자 테이블 목록 조회
    const query = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    const queryResult = dbManager.executeQuery(dbPath, query);

    if (!queryResult.success) {
      return {
        success: false,
        error: queryResult.error || '테이블 목록 조회에 실패했습니다'
      };
    }

    const tables = queryResult.data?.map(row => row.name as string) || [];

    return {
      success: true,
      tables
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '테이블 목록 조회 중 오류가 발생했습니다'
    };
  }
}

/**
 * 특정 테이블의 스키마 정보를 조회합니다
 */
async function getTableSchema(dbManager: DatabaseManager, dbPath: string, tableName: string): Promise<SchemaResultOutput> {
  try {
    // 테이블 존재 여부 확인
    const tableExistsQuery = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
        AND name NOT LIKE 'sqlite_%'
    `;

    const tableExistsResult = dbManager.executeQuery(dbPath, tableExistsQuery, [tableName]);

    if (!tableExistsResult.success) {
      return {
        success: false,
        error: tableExistsResult.error || '테이블 존재 여부 확인에 실패했습니다'
      };
    }

    if (!tableExistsResult.data || tableExistsResult.data.length === 0) {
      return {
        success: false,
        error: `테이블 '${tableName}'이 존재하지 않습니다`
      };
    }

    // 테이블 스키마 정보 조회 (PRAGMA table_info 사용)
    const schemaQuery = `PRAGMA table_info(${tableName})`;
    const schemaResult = dbManager.executeQuery(dbPath, schemaQuery);

    if (!schemaResult.success) {
      return {
        success: false,
        error: schemaResult.error || '스키마 정보 조회에 실패했습니다'
      };
    }

    // DDL 스키마 조회
    const ddlQuery = `
      SELECT sql
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `;

    const ddlResult = dbManager.executeQuery(dbPath, ddlQuery, [tableName]);
    const ddlSchema = ddlResult.success && ddlResult.data?.[0]?.sql || '';

    // 컬럼 정보 변환
    const columns = schemaResult.data?.map(row => ({
      name: row.name as string,
      type: row.type as string,
      notnull: Boolean(row.notnull),
      dflt_value: row.dflt_value,
      pk: Boolean(row.pk)
    })) || [];

    return {
      success: true,
      schema: ddlSchema,
      columns,
      tables: [tableName]
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '스키마 정보 조회 중 오류가 발생했습니다'
    };
  }
}
/**
 * 스키마 정보 조회 함수 (MCP 서버에서 직접 호출용)
 */
export async function getSchema(params: GetSchemaInput): Promise<SchemaResultOutput> {
  const result = await getSchemaHandler(params);
  return result.structuredContent as SchemaResultOutput;
}