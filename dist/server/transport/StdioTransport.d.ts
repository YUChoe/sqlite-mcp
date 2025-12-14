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
export declare class StdioTransport {
    private server;
    constructor(config: StdioTransportConfig);
    /**
     * Stdio 전송 시작
     */
    start(): Promise<void>;
    /**
     * Stdio 전송 중지
     */
    stop(): Promise<void>;
}
/**
 * Stdio 전송 팩토리 함수
 */
export declare function createStdioTransport(server: SQLiteMCPServer): StdioTransport;
//# sourceMappingURL=StdioTransport.d.ts.map