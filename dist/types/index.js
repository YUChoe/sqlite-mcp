/**
 * SQLite MCP 서버의 핵심 타입 정의
 */
// ============================================================================
// 오류 처리 관련 타입
// ============================================================================
/**
 * 데이터베이스 오류 타입
 */
export var DatabaseErrorType;
(function (DatabaseErrorType) {
    DatabaseErrorType["INVALID_PATH"] = "INVALID_PATH";
    DatabaseErrorType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    DatabaseErrorType["DISK_FULL"] = "DISK_FULL";
    DatabaseErrorType["CORRUPTED_DATABASE"] = "CORRUPTED_DATABASE";
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
//# sourceMappingURL=index.js.map