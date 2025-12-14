/**
 * Stdio 전송 계층 구현
 * 표준 입출력을 통한 MCP 통신
 */

import { SQLiteMCPServer } from '../MCPServer.js';

/**
 * Stdio 전송 설정 인터페이스
 */
export interface StdioTransportConfig {
  server: SQLiteMCPServer;
}

/**
 * Stdio 전송 클래스
 */
export class StdioTransport {
  private server: SQLiteMCPServer;

  constructor(config: StdioTransportConfig) {
    this.server = config.server;
  }

  /**
   * Stdio 전송 시작
   */
  async start(): Promise<void> {
    try {
      await this.server.start();
      console.error('Stdio 전송이 시작되었습니다');
    } catch (error) {
      console.error('Stdio 전송 시작 실패:', error);
      throw error;
    }
  }

  /**
   * Stdio 전송 중지
   */
  async stop(): Promise<void> {
    try {
      await this.server.stop();
      console.error('Stdio 전송이 중지되었습니다');
    } catch (error) {
      console.error('Stdio 전송 중지 실패:', error);
      throw error;
    }
  }
}

/**
 * Stdio 전송 팩토리 함수
 */
export function createStdioTransport(server: SQLiteMCPServer): StdioTransport {
  return new StdioTransport({ server });
}