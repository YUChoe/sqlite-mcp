/**
 * 데이터 삭제 도구
 * DELETE SQL을 실행하고 삭제된 행 수를 반환합니다.
 */
import type { DeleteDataInput } from '../types/schemas.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';
/**
 * 데이터 삭제 도구 정의
 */
export declare const deleteDataTool: ToolDefinition;
/**
 * 데이터 삭제 함수 (MCP 서버에서 직접 호출용)
 */
export declare function deleteData(params: DeleteDataInput): Promise<ToolResult>;
//# sourceMappingURL=deleteData.d.ts.map