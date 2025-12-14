/**
 * 테스트 도구 - MCP 콘텐츠 구조 디버깅용
 */

import { z } from 'zod';
import type { ToolDefinition, ToolResult } from '../types/index.js';

/**
 * 테스트 도구 정의
 */
export const testTool: ToolDefinition = {
  name: 'test_tool',
  description: 'MCP 콘텐츠 구조 테스트용 간단한 도구',
  inputSchema: z.object({
    message: z.string().describe('테스트 메시지')
  }),
  handler: testHandler
};

/**
 * 테스트 핸들러
 */
async function testHandler(params: { message: string }): Promise<ToolResult> {
  console.error('testHandler called with params:', JSON.stringify(params));

  const result: ToolResult = {
    content: [{
      type: 'text',
      text: `테스트 성공: ${params.message}`
    }]
  };

  console.error('testHandler returning:', JSON.stringify(result));
  return result;
}

/**
 * 테스트 함수 (MCP 서버에서 직접 호출용)
 */
export async function testFunction(params: { message: string }): Promise<ToolResult> {
  return await testHandler(params);
}