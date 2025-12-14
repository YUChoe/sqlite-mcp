/**
 * 데이터 삭제 도구
 * DELETE SQL을 실행하고 삭제된 행 수를 반환합니다.
 */

import { DatabaseManager } from '../database/DatabaseManager.js';
import { DeleteDataSchema, QueryResultSchema } from '../types/schemas.js';
import type { DeleteDataInput, QueryResultOutput } from '../types/schemas.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';
import { zodToJsonSchema } from '../utils/schemaConverter.js';

/**
 * 데이터 삭제 도구 정의
 */
export const deleteDataTool: ToolDefinition = {
  name: 'delete_data',
  description: 'SQLite 테이블에서 데이터를 삭제합니다. 조건부 삭제와 전체 삭제를 지원합니다.',
  inputSchema: zodToJsonSchema(DeleteDataSchema),
  outputSchema: zodToJsonSchema(QueryResultSchema),
  handler: deleteDataHandler
};

/**
 * 데이터 삭제 핸들러
 */
async function deleteDataHandler(params: DeleteDataInput): Promise<ToolResult> {
  const dbManager = new DatabaseManager();

  try {
    // 입력 검증
    const validatedInput = DeleteDataSchema.parse(params);

    // DELETE 쿼리 검증
    validateDeleteQuery(validatedInput.query);

    // SQL 실행
    const result = dbManager.executeQuery(
      validatedInput.dbPath,
      validatedInput.query,
      validatedInput.params
    );

    const output: QueryResultOutput = {
      success: result.success,
      rowsAffected: result.rowsAffected,
      error: result.error
    };

    return {
      content: [{
        type: 'text',
        text: result.success
          ? `데이터가 성공적으로 삭제되었습니다. 삭제된 행 수: ${result.rowsAffected}`
          : `데이터 삭제 실패: ${result.error}`
      }],
      structuredContent: output
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';

    return {
      content: [{
        type: 'text',
        text: `데이터 삭제 중 오류 발생: ${errorMessage}`
      }],
      structuredContent: {
        success: false,
        error: errorMessage
      }
    };
  }
}

/**
 * DELETE 쿼리 유효성 검사
 */
function validateDeleteQuery(query: string): void {
  const trimmedQuery = query.trim().toLowerCase();

  // DELETE 쿼리인지 확인
  if (!trimmedQuery.startsWith('delete')) {
    throw new Error('DELETE 쿼리만 허용됩니다');
  }

  // 기본적인 DELETE 구문 검사
  if (!trimmedQuery.includes('from')) {
    throw new Error('DELETE 쿼리에 FROM 절이 필요합니다');
  }

  // 위험한 쿼리 패턴 검사
  const dangerousPatterns = [
    /drop\s+table/i,
    /truncate/i,
    /alter\s+table/i,
    /create\s+table/i,
    /update\s+/i,
    /insert\s+/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error('허용되지 않는 SQL 구문이 포함되어 있습니다');
    }
  }
}
/**
 * 데이터 삭제 함수 (MCP 서버에서 직접 호출용)
 */
export async function deleteData(params: DeleteDataInput): Promise<QueryResultOutput> {
  const result = await deleteDataHandler(params);
  return result.structuredContent as QueryResultOutput;
}