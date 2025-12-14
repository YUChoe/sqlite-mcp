/**
 * MCP 서버 관련 타입 정의
 */
/**
 * MCP 서버 설정
 */
export interface MCPServerConfig {
    /** 서버 이름 */
    name: string;
    /** 서버 버전 */
    version: string;
    /** 서버 기능 */
    capabilities: {
        /** 도구 관련 기능 */
        tools: {
            /** 도구 목록 변경 알림 지원 */
            listChanged: boolean;
        };
    };
}
/**
 * 서버 실행 옵션
 */
export interface ServerOptions {
    /** 서버 설정 */
    config: MCPServerConfig;
    /** 디버그 모드 */
    debug?: boolean;
    /** 로그 레벨 */
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
}
/**
 * 전송 계층 타입
 */
export type TransportType = 'stdio' | 'http';
/**
 * HTTP 서버 옵션
 */
export interface HTTPServerOptions {
    /** 포트 번호 */
    port: number;
    /** 호스트 주소 */
    host?: string;
    /** CORS 설정 */
    cors?: boolean;
}
/**
 * 서버 상태
 */
export declare enum ServerState {
    STOPPED = "stopped",
    STARTING = "starting",
    RUNNING = "running",
    STOPPING = "stopping",
    ERROR = "error"
}
/**
 * 서버 통계 정보
 */
export interface ServerStats {
    /** 시작 시간 */
    startTime: Date;
    /** 총 요청 수 */
    totalRequests: number;
    /** 성공한 요청 수 */
    successfulRequests: number;
    /** 실패한 요청 수 */
    failedRequests: number;
    /** 활성 데이터베이스 연결 수 */
    activeDatabases: number;
}
//# sourceMappingURL=server.d.ts.map