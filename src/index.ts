/**
 * SQLite MCP 서버 진입점
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { MCPServerConfig } from './types/server.js';

/**
 * 서버 설정
 */
const serverConfig: MCPServerConfig = {
  name: 'sqlite-mcp-server',
  version: '1.0.0',
  capabilities: {
    tools: {
      listChanged: true
    }
  }
};

/**
 * 메인 함수
 */
async function main() {
  console.error('SQLite MCP 서버를 시작합니다...');

  try {
    // MCP 서버 인스턴스 생성
    const server = new Server({
      name: serverConfig.name,
      version: serverConfig.version
    }, {
      capabilities: serverConfig.capabilities
    });

    // Stdio 전송 계층 설정
    const transport = new StdioServerTransport();

    // 서버와 전송 계층 연결
    await server.connect(transport);

    console.error('SQLite MCP 서버가 성공적으로 시작되었습니다.');

  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
}

// 프로세스 종료 시 정리 작업
process.on('SIGINT', () => {
  console.error('서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('서버를 종료합니다...');
  process.exit(0);
});

// 메인 함수 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('예상치 못한 오류:', error);
    process.exit(1);
  });
}