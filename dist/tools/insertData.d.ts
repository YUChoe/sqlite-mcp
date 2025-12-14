/**
 * 데이터 삽입 도구
 * INSERT SQL을 생성하고 실행합니다.
 */
import type { InsertDataInput, QueryResultOutput } from '../types/schemas.js';
import type { ToolDefinition } from '../types/index.js';
/**
 * 데이터 삽입 도구 정의
 */
export declare const insertDataTool: ToolDefinition;
/**
 * 데이터 삽입 함수 (MCP 서버에서 직접 호출용)
 */
export declare function insertData(params: InsertDataInput): Promise<QueryResultOutput>;
//# sourceMappingURL=insertData.d.ts.map