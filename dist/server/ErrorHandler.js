/**
 * 통합 오류 처리 시스템
 * MCP 서버의 모든 오류를 일관되게 처리하고 분류
 */
/**
 * 데이터베이스 오류 타입
 */
export var DatabaseErrorType;
(function (DatabaseErrorType) {
    DatabaseErrorType["INVALID_PATH"] = "INVALID_PATH";
    DatabaseErrorType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    DatabaseErrorType["DISK_FULL"] = "DISK_FULL";
    DatabaseErrorType["CORRUPTED_DATABASE"] = "CORRUPTED_DATABASE";
    DatabaseErrorType["CONNECTION_FAILED"] = "CONNECTION_FAILED";
})(DatabaseErrorType || (DatabaseErrorType = {}));
/**
 * SQL 오류 타입
 */
export var SQLErrorType;
(function (SQLErrorType) {
    SQLErrorType["SYNTAX_ERROR"] = "SYNTAX_ERROR";
    SQLErrorType["TABLE_NOT_EXISTS"] = "TABLE_NOT_EXISTS";
    SQLErrorType["COLUMN_NOT_EXISTS"] = "COLUMN_NOT_EXISTS";
    SQLErrorType["CONSTRAINT_VIOLATION"] = "CONSTRAINT_VIOLATION";
    SQLErrorType["TYPE_MISMATCH"] = "TYPE_MISMATCH";
})(SQLErrorType || (SQLErrorType = {}));
/**
 * MCP 프로토콜 오류 타입
 */
export var MCPErrorType;
(function (MCPErrorType) {
    MCPErrorType["INVALID_REQUEST"] = "INVALID_REQUEST";
    MCPErrorType["TOOL_NOT_FOUND"] = "TOOL_NOT_FOUND";
    MCPErrorType["INVALID_PARAMETERS"] = "INVALID_PARAMETERS";
    MCPErrorType["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(MCPErrorType || (MCPErrorType = {}));
/**
 * 통합 오류 처리 클래스
 */
export class ErrorHandler {
    /**
     * 데이터베이스 오류 분류 및 처리
     */
    static handleDatabaseError(error, path) {
        const message = error.message.toLowerCase();
        if (message.includes('no such file') || message.includes('cannot open')) {
            return {
                type: DatabaseErrorType.INVALID_PATH,
                message: `데이터베이스 파일을 찾을 수 없습니다: ${path}`,
                path,
                originalError: error
            };
        }
        if (message.includes('permission denied') || message.includes('access denied')) {
            return {
                type: DatabaseErrorType.PERMISSION_DENIED,
                message: `데이터베이스 파일에 대한 접근 권한이 없습니다: ${path}`,
                path,
                originalError: error
            };
        }
        if (message.includes('disk full') || message.includes('no space')) {
            return {
                type: DatabaseErrorType.DISK_FULL,
                message: `디스크 공간이 부족합니다: ${path}`,
                path,
                originalError: error
            };
        }
        if (message.includes('corrupt') || message.includes('malformed')) {
            return {
                type: DatabaseErrorType.CORRUPTED_DATABASE,
                message: `데이터베이스 파일이 손상되었습니다: ${path}`,
                path,
                originalError: error
            };
        }
        return {
            type: DatabaseErrorType.CONNECTION_FAILED,
            message: `데이터베이스 연결에 실패했습니다: ${error.message}`,
            path,
            originalError: error
        };
    }
    /**
     * SQL 오류 분류 및 처리
     */
    static handleSQLError(error, query) {
        const message = error.message.toLowerCase();
        if (message.includes('syntax error') || message.includes('near')) {
            return {
                type: SQLErrorType.SYNTAX_ERROR,
                message: `SQL 구문 오류: ${error.message}`,
                query
            };
        }
        if (message.includes('no such table')) {
            return {
                type: SQLErrorType.TABLE_NOT_EXISTS,
                message: `테이블이 존재하지 않습니다: ${error.message}`,
                query
            };
        }
        if (message.includes('no such column')) {
            return {
                type: SQLErrorType.COLUMN_NOT_EXISTS,
                message: `컬럼이 존재하지 않습니다: ${error.message}`,
                query
            };
        }
        if (message.includes('constraint') || message.includes('unique') || message.includes('foreign key')) {
            return {
                type: SQLErrorType.CONSTRAINT_VIOLATION,
                message: `제약 조건 위반: ${error.message}`,
                query
            };
        }
        if (message.includes('type') || message.includes('affinity')) {
            return {
                type: SQLErrorType.TYPE_MISMATCH,
                message: `데이터 타입 불일치: ${error.message}`,
                query
            };
        }
        return {
            type: SQLErrorType.SYNTAX_ERROR,
            message: `SQL 실행 오류: ${error.message}`,
            query
        };
    }
    /**
     * MCP 프로토콜 오류 분류 및 처리
     */
    static handleMCPError(error, context) {
        const message = error.message.toLowerCase();
        if (message.includes('tool not found') || message.includes('unknown tool')) {
            return {
                type: MCPErrorType.TOOL_NOT_FOUND,
                message: `도구를 찾을 수 없습니다: ${error.message}`,
                code: -32601,
                data: context
            };
        }
        if (message.includes('invalid parameters') || message.includes('validation')) {
            return {
                type: MCPErrorType.INVALID_PARAMETERS,
                message: `잘못된 매개변수: ${error.message}`,
                code: -32602,
                data: context
            };
        }
        if (message.includes('invalid request') || message.includes('malformed')) {
            return {
                type: MCPErrorType.INVALID_REQUEST,
                message: `잘못된 요청: ${error.message}`,
                code: -32600,
                data: context
            };
        }
        return {
            type: MCPErrorType.INTERNAL_ERROR,
            message: `내부 서버 오류: ${error.message}`,
            code: -32603,
            data: context
        };
    }
    /**
     * 오류를 MCP 응답 형식으로 변환
     */
    static formatErrorResponse(error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        errorType: error.type,
                        ...(('code' in error) && { code: error.code }),
                        ...(('path' in error) && { path: error.path }),
                        ...(('query' in error) && { query: error.query })
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
    /**
     * 일반 오류를 처리하고 적절한 형식으로 변환
     */
    static handleGenericError(error, context) {
        if (!(error instanceof Error)) {
            return this.formatErrorResponse({
                type: MCPErrorType.INTERNAL_ERROR,
                message: `알 수 없는 오류: ${String(error)}`,
                code: -32603
            });
        }
        // 컨텍스트에 따라 적절한 오류 처리기 선택
        if (context?.path && (error.message.includes('database') || error.message.includes('sqlite'))) {
            const dbError = this.handleDatabaseError(error, context.path);
            return this.formatErrorResponse(dbError);
        }
        if (context?.query) {
            const sqlError = this.handleSQLError(error, context.query);
            return this.formatErrorResponse(sqlError);
        }
        if (context?.tool) {
            const mcpError = this.handleMCPError(error, context);
            return this.formatErrorResponse(mcpError);
        }
        // 기본 MCP 오류로 처리
        const mcpError = this.handleMCPError(error);
        return this.formatErrorResponse(mcpError);
    }
    /**
     * 오류 로깅
     */
    static logError(error, context) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            errorType: error.type,
            message: error.message,
            context,
            ...(('originalError' in error) && error.originalError && {
                stack: error.originalError.stack
            })
        };
        console.error('SQLite MCP Server Error:', JSON.stringify(logEntry, null, 2));
    }
}
//# sourceMappingURL=ErrorHandler.js.map