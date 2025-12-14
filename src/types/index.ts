/**
 * SQLite MCP 서버의 핵심 타입 정의
 */

import { z } from 'zod';
import type { Database as SQLite3Database } from 'sqlite3';

// ============================================================================
// Database Manager 관련 타입
// ============================================================================

/**
 * 데이터베이스 연결 정보
 */
export interface Database {
  /** 데이터베이스 파일 경로 */
  path: string;
  /** sqlite3 데이터베이스 연결 */
  connection: SQLite3Database;
  /** 마지막 접근 시간 */
  lastAccessed: Date;
}

/**
 * 데이터베이스 매니저 인터페이스
 */
export interface DatabaseManager {
  /** 데이터베이스 연결 가져오기 */
  getDatabase(path: string): Database;
  /** 특정 데이터베이스 연결 닫기 */
  closeDatabase(path: string): void;
  /** 모든 데이터베이스 연결 닫기 */
  closeAllDatabases(): void;
  /** SQL 쿼리 실행 */
  executeQuery(path: string, sql: string, params?: any[]): Promise<QueryResult>;
  /** 트랜잭션 실행 */
  executeTransaction(path: string, operations: Operation[]): Promise<TransactionResult>;
}

// ============================================================================
// 쿼리 결과 관련 타입
// ============================================================================

/**
 * SQL 쿼리 실행 결과
 */
export interface QueryResult {
  /** 실행 성공 여부 */
  success: boolean;
  /** 조회된 데이터 (SELECT 쿼리의 경우) */
  data?: any[];
  /** 영향받은 행 수 (INSERT, UPDATE, DELETE의 경우) */
  rowsAffected?: number;
  /** 마지막 삽입된 행의 ID (INSERT의 경우) */
  lastInsertRowid?: number;
  /** 오류 메시지 */
  error?: string;
}

/**
 * 트랜잭션 실행 결과
 */
export interface TransactionResult {
  /** 실행 성공 여부 */
  success: boolean;
  /** 각 작업의 결과 */
  results: QueryResult[];
  /** 오류 메시지 */
  error?: string;
}

/**
 * 트랜잭션 내 개별 작업
 */
export interface Operation {
  /** SQL 쿼리 */
  sql: string;
  /** 쿼리 파라미터 */
  params?: any[];
}

// ============================================================================
// MCP Tool 관련 타입
// ============================================================================

/**
 * MCP 도구 핸들러 함수 타입
 */
export interface ToolHandler {
  (params: any): Promise<ToolResult>;
}

/**
 * MCP 도구 정의
 */
export interface ToolDefinition {
  /** 도구 이름 */
  name: string;
  /** 도구 설명 */
  description: string;
  /** 입력 스키마 (Zod) */
  inputSchema: z.ZodSchema;
  /** 출력 스키마 (Zod) */
  outputSchema: z.ZodSchema;
  /** 도구 핸들러 함수 */
  handler: ToolHandler;
}

/**
 * MCP 도구 실행 결과
 */
export interface ToolResult {
  /** 텍스트 콘텐츠 */
  content: Array<{ type: 'text'; text: string }>;
  /** 구조화된 콘텐츠 (선택사항) */
  structuredContent?: any;
}

// ============================================================================
// 오류 처리 관련 타입
// ============================================================================

/**
 * 데이터베이스 오류 타입
 */
export enum DatabaseErrorType {
  INVALID_PATH = 'INVALID_PATH',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  CORRUPTED_DATABASE = 'CORRUPTED_DATABASE'
}

/**
 * 데이터베이스 오류 정보
 */
export interface DatabaseError {
  type: DatabaseErrorType;
  message: string;
  path: string;
  originalError?: Error;
}

/**
 * SQL 오류 타입
 */
export enum SQLErrorType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  TABLE_NOT_EXISTS = 'TABLE_NOT_EXISTS',
  COLUMN_NOT_EXISTS = 'COLUMN_NOT_EXISTS',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TYPE_MISMATCH = 'TYPE_MISMATCH'
}

/**
 * SQL 오류 정보
 */
export interface SQLError {
  type: SQLErrorType;
  message: string;
  query: string;
  position?: number;
}

/**
 * MCP 프로토콜 오류 타입
 */
export enum MCPErrorType {
  INVALID_REQUEST = 'INVALID_REQUEST',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * MCP 프로토콜 오류 정보
 */
export interface MCPError {
  type: MCPErrorType;
  message: string;
  code: number;
  data?: any;
}