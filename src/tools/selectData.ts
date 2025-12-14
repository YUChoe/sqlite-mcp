/**
 * SELECT 쿼리 도구
 * SQLite 데이터베이스에서 데이터를 조회하는 기능을 제공합니다.
 */

import { DatabaseManager } from '../database/DatabaseManager.js';
import { SelectDataSchema, QueryResultSchema } from '../types/schemas.js';
import type { SelectDataInput, QueryResultOutput } from '../types/schemas.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';
import { zodToJsonSchema } from '../utils/schemaConverter.js';

/**
 * SELECT 쿼리 실행 도구
 */
export const selectDataTool: ToolDefinition = {
  name: 'select_data',
  description: 'SQLite 데이터베이스에서 SELECT 쿼리를 실행하여 데이터를 조회합니다. WHERE 절을 포함한 복잡한 쿼리를 지원합니다.',
  inputSchema: zodToJsonSchema(SelectDataSchema),
  outputSchema: zodToJsonSchema(QueryResultSchema),
  handler: selectDataHandler
};

/**
 * SELECT 쿼리 핸들러
 */
async function selectDataHandler(params: SelectDataInput): Promise<ToolResult> {
  try {
    // 입력 검증
    const validatedParams = SelectDataSchema.parse(params);
    const { dbPath, query, params: queryParams = [] } = validatedParams;

    // SELECT 쿼리인지 확인
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      const result: QueryResultOutput = {
        success: false,
        error: 'SELECT 쿼리만 허용됩니다'
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result
      };
    }

    // 데이터베이스 매니저 인스턴스 생성
    const dbManager = new DatabaseManager();

    // 쿼리 실행
    const queryResult = dbManager.executeQuery(dbPath, query, queryParams);

    // 결과 검증 및 반환
    const result: QueryResultOutput = QueryResultSchema.parse(queryResult);

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result
    };

  } catch (error) {
    const result: QueryResultOutput = {
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
 * 데이터 조회 함수 (MCP 서버에서 직접 호출용)
 */
export async function selectData(params: SelectDataInput): Promise<QueryResultOutput> {
  const result = await selectDataHandler(params);
  return result.structuredContent as QueryResultOutput;
}