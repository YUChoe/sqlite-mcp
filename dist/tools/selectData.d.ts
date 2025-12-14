/**
 * SELECT 쿼리 도구
 * SQLite 데이터베이스에서 데이터를 조회하는 기능을 제공합니다.
 */
import type { SelectDataInput, QueryResultOutput } from '../types/schemas.js';
import type { ToolDefinition } from '../types/index.js';
/**
 * SELECT 쿼리 실행 도구
 */
export declare const selectDataTool: ToolDefinition;
/**
 * 데이터 조회 함수 (MCP 서버에서 직접 호출용)
 */
export declare function selectData(params: SelectDataInput): Promise<QueryResultOutput>;
//# sourceMappingURL=selectData.d.ts.map