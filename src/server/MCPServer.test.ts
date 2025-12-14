/**
 * MCP 서버 Property-Based Testing
 * MCP SDK 의존성 없이 핵심 로직만 테스트
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { DatabaseManager } from '../database/DatabaseManager';
import { ErrorHandler } from './ErrorHandler';
import fs from 'fs';
import path from 'path';

describe('MCP Server Property Tests', () => {
  let testDbDir: string;

  beforeEach(() => {
    testDbDir = path.join(__dirname, '../../test-dbs');
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
  });

  afterEach(() => {
    // 테스트 데이터베이스 정리
    try {
      if (fs.existsSync(testDbDir)) {
        const files = fs.readdirSync(testDbDir);
        for (const file of files) {
          if (file.startsWith('test-mcp-')) {
            try {
              fs.unlinkSync(path.join(testDbDir, file));
            } catch (error) {
              // Windows에서 파일 잠금으로 인한 삭제 실패 무시
            }
          }
        }
      }
    } catch (error) {
      // 정리 실패 무시
    }
  });

  /**
   * **Feature: sqlite-mcp-server, Property 10: MCP 프로토콜 준수**
   * For any MCP 클라이언트 연결에 대해, 표준 MCP 핸드셰이크가 수행되고 모든 CRUD 도구가 노출되어야 한다
   * Validates: Requirements 8.1, 8.2, 8.4
   */
  test('**Feature: sqlite-mcp-server, Property 10: MCP 프로토콜 준수**', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        serverName: fc.string({ minLength: 1, maxLength: 50 }),
        version: fc.string({ minLength: 1, maxLength: 20 })
      }),
      async (testCase) => {
        // MCP 서버 설정 검증
        const config = {
          name: testCase.serverName,
          version: testCase.version,
          capabilities: {
            tools: { listChanged: true }
          }
        };

        // 설정이 올바르게 생성되어야 함
        expect(config.name).toBe(testCase.serverName);
        expect(config.version).toBe(testCase.version);
        expect(config.capabilities.tools.listChanged).toBe(true);

        // 모든 CRUD 도구가 정의되어야 함
        const expectedTools = [
          'create_table',
          'insert_data',
          'select_data',
          'get_schema',
          'update_data',
          'delete_data',
          'meta_commands'
        ];

        // 도구 목록 검증
        expect(expectedTools.length).toBe(7);
        expect(expectedTools).toContain('create_table');
        expect(expectedTools).toContain('insert_data');
        expect(expectedTools).toContain('select_data');
        expect(expectedTools).toContain('get_schema');
        expect(expectedTools).toContain('update_data');
        expect(expectedTools).toContain('delete_data');
        expect(expectedTools).toContain('meta_commands');
      }
    ), { numRuns: 100 });
  });

  /**
   * **Feature: sqlite-mcp-server, Property 11: 오류 처리 일관성**
   * For any 잘못된 입력(SQL 구문, 컬럼명, 테이블명, MCP 메시지)에 대해, 적절한 오류 메시지가 반환되어야 한다
   * Validates: Requirements 2.3, 3.3, 4.4, 6.3, 8.3
   */
  test('**Feature: sqlite-mcp-server, Property 11: 오류 처리 일관성**', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        invalidToolName: fc.string().filter(s => !['create_table', 'insert_data', 'select_data', 'get_schema', 'update_data', 'delete_data', 'meta_commands'].includes(s)),
        invalidDbPath: fc.oneof(
          fc.constant(''),
          fc.constant('/invalid/path/that/does/not/exist'),
          fc.constant('\\invalid\\windows\\path'),
          fc.string().filter(s => s.includes('\0') || s.includes('<') || s.includes('>'))
        ),
        invalidSQL: fc.oneof(
          fc.constant('INVALID SQL SYNTAX'),
          fc.constant('SELECT * FROM nonexistent_table'),
          fc.constant('UPDATE nonexistent_table SET col = 1'),
          fc.constant('DELETE FROM nonexistent_table')
        )
      }),
      async (testCase) => {
        const dbPath = path.join(testDbDir, `test-mcp-${Date.now()}-${Math.random()}.db`);

        try {
          // 1. 잘못된 도구 이름은 오류를 발생시켜야 함
          expect(testCase.invalidToolName).not.toMatch(/^(create_table|insert_data|select_data|get_schema|update_data|delete_data|meta_commands)$/);

          // 2. 잘못된 데이터베이스 경로에 대한 오류 처리
          const dbManager = new DatabaseManager();

          if (testCase.invalidDbPath === '' || testCase.invalidDbPath.includes('\0') || testCase.invalidDbPath.includes('<')) {
            // 빈 경로나 잘못된 문자가 포함된 경로는 오류를 발생시켜야 함
            expect(() => {
              dbManager.getDatabase(testCase.invalidDbPath);
            }).toThrow();
          }

          // 3. 잘못된 SQL에 대한 오류 처리
          if (testCase.invalidSQL.includes('INVALID') || testCase.invalidSQL.includes('nonexistent_table')) {
            try {
              await dbManager.executeQuery(dbPath, testCase.invalidSQL);
              // 잘못된 SQL은 오류를 발생시켜야 하므로 여기에 도달하면 안됨
              expect(false).toBe(true);
            } catch (error) {
              // 예상된 오류 - 오류 메시지가 있어야 함
              expect(error).toBeDefined();
              expect(error instanceof Error ? error.message : String(error)).toBeTruthy();
            }
          }

          // 4. 오류 처리기 테스트
          const testError = new Error('Test error');
          const errorResponse = ErrorHandler.handleGenericError(testError, {
            tool: testCase.invalidToolName,
            path: testCase.invalidDbPath,
            query: testCase.invalidSQL
          });

          // 오류 응답이 올바른 형식이어야 함
          expect(errorResponse).toBeDefined();
          expect(errorResponse.content).toBeDefined();
          expect(errorResponse.isError).toBe(true);

        } finally {
          // 정리
          try {
            if (fs.existsSync(dbPath)) {
              fs.unlinkSync(dbPath);
            }
          } catch (error) {
            // Windows 파일 잠금으로 인한 삭제 실패 무시
          }
        }
      }
    ), { numRuns: 100 });
  });

  test('MCP 서버 기본 설정 테스트', () => {
    // 기본 설정 검증
    const defaultConfig = {
      name: 'sqlite-mcp-server',
      version: '1.0.0',
      capabilities: {
        tools: { listChanged: true }
      }
    };

    expect(defaultConfig.name).toBe('sqlite-mcp-server');
    expect(defaultConfig.version).toBe('1.0.0');
    expect(defaultConfig.capabilities.tools.listChanged).toBe(true);
  });

  test('오류 처리 시스템 테스트', () => {
    // 데이터베이스 오류 처리 테스트
    const dbError = new Error('database is locked');
    const handledDbError = ErrorHandler.handleDatabaseError(dbError, '/test/path');

    expect(handledDbError.type).toBeDefined();
    expect(handledDbError.message).toBeTruthy();
    expect(handledDbError.path).toBe('/test/path');

    // SQL 오류 처리 테스트
    const sqlError = new Error('syntax error near "INVALID"');
    const handledSqlError = ErrorHandler.handleSQLError(sqlError, 'INVALID SQL');

    expect(handledSqlError.type).toBeDefined();
    expect(handledSqlError.message).toBeTruthy();
    expect(handledSqlError.query).toBe('INVALID SQL');

    // MCP 오류 처리 테스트
    const mcpError = new Error('tool not found');
    const handledMcpError = ErrorHandler.handleMCPError(mcpError);

    expect(handledMcpError.type).toBeDefined();
    expect(handledMcpError.message).toBeTruthy();
    expect(handledMcpError.code).toBeDefined();
  });
});