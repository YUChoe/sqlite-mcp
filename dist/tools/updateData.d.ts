/**
 * 데이터 업데이트 도구
 * UPDATE SQL을 실행하고 영향받은 행 수를 반환합니다.
 */
import type { UpdateDataInput } from '../types/schemas.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';
/**
 * 데이터 업데이트 도구 정의
 */
export declare const updateDataTool: ToolDefinition;
/**
 * 데이터 업데이트 함수 (MCP 서버에서 직접 호출용)
 */
export declare function updateData(params: UpdateDataInput): Promise<ToolResult>;
//# sourceMappingURL=updateData.d.ts.map