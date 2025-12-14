/**
 * 스키마 정보 조회 도구
 * SQLite 데이터베이스의 테이블 목록과 스키마 정보를 조회하는 기능을 제공합니다.
 */
import type { GetSchemaInput } from '../types/schemas.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';
/**
 * 스키마 정보 조회 도구
 */
export declare const getSchemaTool: ToolDefinition;
/**
 * 스키마 정보 조회 함수 (MCP 서버에서 직접 호출용)
 */
export declare function getSchema(params: GetSchemaInput): Promise<ToolResult>;
//# sourceMappingURL=getSchema.d.ts.map