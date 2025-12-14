/**
 * 통합 오류 처리 시스템
 * MCP 서버의 모든 오류를 일관되게 처리하고 분류
 */
/**
 * 데이터베이스 오류 타입
 */
export declare enum DatabaseErrorType {
    INVALID_PATH = "INVALID_PATH",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    DISK_FULL = "DISK_FULL",
    CORRUPTED_DATABASE = "CORRUPTED_DATABASE",
    CONNECTION_FAILED = "CONNECTION_FAILED"
}
/**
 * SQL 오류 타입
 */
export declare enum SQLErrorType {
    SYNTAX_ERROR = "SYNTAX_ERROR",
    TABLE_NOT_EXISTS = "TABLE_NOT_EXISTS",
    COLUMN_NOT_EXISTS = "COLUMN_NOT_EXISTS",
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
    TYPE_MISMATCH = "TYPE_MISMATCH"
}
/**
 * MCP 프로토콜 오류 타입
 */
export declare enum MCPErrorType {
    INVALID_REQUEST = "INVALID_REQUEST",
    TOOL_NOT_FOUND = "TOOL_NOT_FOUND",
    INVALID_PARAMETERS = "INVALID_PARAMETERS",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
/**
 * 데이터베이스 오류 인터페이스
 */
export interface DatabaseError {
    type: DatabaseErrorType;
    message: string;
    path: string;
    originalError?: Error;
}
/**
 * SQL 오류 인터페이스
 */
export interface SQLError {
    type: SQLErrorType;
    message: string;
    query: string;
    position?: number;
}
/**
 * MCP 프로토콜 오류 인터페이스
 */
export interface MCPError {
    type: MCPErrorType;
    message: string;
    code: number;
    data?: any;
}
/**
 * 통합 오류 처리 클래스
 */
export declare class ErrorHandler {
    /**
     * 데이터베이스 오류 분류 및 처리
     */
    static handleDatabaseError(error: Error, path: string): DatabaseError;
    /**
     * SQL 오류 분류 및 처리
     */
    static handleSQLError(error: Error, query: string): SQLError;
    /**
     * MCP 프로토콜 오류 분류 및 처리
     */
    static handleMCPError(error: Error, context?: any): MCPError;
    /**
     * 오류를 MCP 응답 형식으로 변환
     */
    static formatErrorResponse(error: DatabaseError | SQLError | MCPError): any;
    /**
     * 일반 오류를 처리하고 적절한 형식으로 변환
     */
    static handleGenericError(error: unknown, context?: {
        path?: string;
        query?: string;
        tool?: string;
    }): any;
    /**
     * 오류 로깅
     */
    static logError(error: DatabaseError | SQLError | MCPError, context?: any): void;
}
//# sourceMappingURL=ErrorHandler.d.ts.map