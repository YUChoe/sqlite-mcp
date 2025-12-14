/**
 * 테이블 생성 도구
 * CREATE TABLE SQL을 생성하고 실행합니다.
 */
import type { CreateTableInput, QueryResultOutput } from '../types/schemas.js';
import type { ToolDefinition } from '../types/index.js';
/**
 * 테이블 생성 도구 정의
 */
export declare const createTableTool: ToolDefinition;
/**
 * 테이블 생성 함수 (MCP 서버에서 직접 호출용)
 */
export declare function createTable(params: CreateTableInput): Promise<QueryResultOutput>;
//# sourceMappingURL=createTable.d.ts.map