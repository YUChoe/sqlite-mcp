/**
 * MCP 서버 구현
 * Model Context Protocol을 사용하여 SQLite CRUD 도구들을 노출하는 서버
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
/**
 * MCP 서버 설정 인터페이스
 */
interface MCPServerConfig {
    name: string;
    version: string;
    capabilities: {
        tools: {
            listChanged: boolean;
        };
    };
}
/**
 * SQLite MCP 서버 클래스
 */
export declare class SQLiteMCPServer {
    private server;
    constructor(config: MCPServerConfig);
    /**
     * 도구 핸들러 설정
     */
    private setupToolHandlers;
    /**
     * 테이블 생성 도구 실행
     */
    private executeCreateTable;
    /**
     * 데이터 삽입 도구 실행
     */
    private executeInsertData;
    /**
     * 데이터 조회 도구 실행
     */
    private executeSelectData;
    /**
     * 스키마 정보 조회 도구 실행
     */
    private executeGetSchema;
    /**
     * 데이터 업데이트 도구 실행
     */
    private executeUpdateData;
    /**
     * 데이터 삭제 도구 실행
     */
    private executeDeleteData;
    /**
     * 메타 명령 도구 실행
     */
    private executeMetaCommands;
    /**
     * 테스트 도구 실행
     */
    private executeTestTool;
    /**
     * 서버 시작 (Stdio 전송 사용)
     */
    start(): Promise<void>;
    /**
     * 서버 종료
     */
    stop(): Promise<void>;
    /**
     * 서버 인스턴스 반환
     */
    getServer(): Server;
}
/**
 * 기본 MCP 서버 설정
 */
export declare const defaultConfig: MCPServerConfig;
export {};
//# sourceMappingURL=MCPServer.d.ts.map