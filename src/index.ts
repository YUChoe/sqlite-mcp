#!/usr/bin/env node

/**
 * SQLite MCP 서버 진입점
 * npx로 실행 가능한 메인 파일
 */

import { SQLiteMCPServer, defaultConfig } from './server/MCPServer.js';
import { createStdioTransport } from './server/transport/index.js';

/**
 * 메인 함수 - MCP 서버 시작
 */
async function main(): Promise<void> {
  try {
    console.error('SQLite MCP 서버를 시작합니다...');

    const server = new SQLiteMCPServer(defaultConfig);
    const transport = createStdioTransport(server);

    // 프로세스 종료 시 정리 작업
    process.on('SIGINT', async () => {
      console.error('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
      await transport.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
      await transport.stop();
      process.exit(0);
    });

    // 서버 시작
    await transport.start();
    console.error('SQLite MCP 서버가 성공적으로 시작되었습니다.');

  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
}

// 메인 함수 실행
main().catch((error) => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});