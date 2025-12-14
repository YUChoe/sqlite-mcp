/**
 * 테스트 도구 - MCP 콘텐츠 구조 디버깅용
 */
import type { ToolDefinition, ToolResult } from '../types/index.js';
/**
 * 테스트 도구 정의
 */
export declare const testTool: ToolDefinition;
/**
 * 테스트 함수 (MCP 서버에서 직접 호출용)
 */
export declare function testFunction(params: {
    message: string;
}): Promise<ToolResult>;
//# sourceMappingURL=testTool.d.ts.map