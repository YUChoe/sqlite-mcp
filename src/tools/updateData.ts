/**
 * 데이터 업데이트 도구
 * UPDATE SQL을 실행하고 영향받은 행 수를 반환합니다.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { UpdateDataSchema, QueryResultSchema } from '../types/schemas';
import type { UpdateDataInput, QueryResultOutput } from '../types/schemas';
import type { ToolDefinition, ToolResult } from '../types/index';

/**
 * 데이터 업데이트 도구 정의
 */
export const updateDataTool: ToolDefinition = {
  name: 'update_data',
  description: 'SQLite 테이블의 기존 데이터를 업데이트합니다',
  inputSchema: UpdateDataSchema,
  outputSchema: QueryResultSchema,
  handler: updateDataHandler
};

/**
 * 데이터 업데이트 핸들러
 */
async function updateDataHandler(params: UpdateDataInput): Promise<ToolResult> {
  const dbManager = new DatabaseManager();

  try {
    // 입력 검증
    const validatedInput = UpdateDataSchema.parse(params);

    // UPDATE 쿼리 검증
    validateUpdateQuery(validatedInput.query);

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
          ? `데이터가 성공적으로 업데이트되었습니다. 영향받은 행 수: ${result.rowsAffected}`
          : `데이터 업데이트 실패: ${result.error}`
      }],
      structuredContent: output
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';

    return {
      content: [{
        type: 'text',
        text: `데이터 업데이트 중 오류 발생: ${errorMessage}`
      }],
      structuredContent: {
        success: false,
        error: errorMessage
      }
    };
  }
}

/**
 * UPDATE 쿼리 유효성 검사
 */
function validateUpdateQuery(query: string): void {
  const trimmedQuery = query.trim().toLowerCase();

  // UPDATE 쿼리인지 확인
  if (!trimmedQuery.startsWith('update')) {
    throw new Error('UPDATE 쿼리만 허용됩니다');
  }

  // 기본적인 UPDATE 구문 검사
  if (!trimmedQuery.includes('set')) {
    throw new Error('UPDATE 쿼리에 SET 절이 필요합니다');
  }

  // 위험한 쿼리 패턴 검사
  const dangerousPatterns = [
    /drop\s+table/i,
    /delete\s+from/i,
    /truncate/i,
    /alter\s+table/i,
    /create\s+table/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error('허용되지 않는 SQL 구문이 포함되어 있습니다');
    }
  }
}