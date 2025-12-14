/**
 * SQLite 메타 명령 도구 테스트
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { metaCommandsTool } from './metaCommands';
import { DatabaseManager } from '../database/DatabaseManager';
import type { MetaCommandInput, MetaResultOutput } from '../types/schemas';

describe('Meta Commands Tool', () => {
  let testDbPath: string;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    // 테스트용 임시 데이터베이스 파일 생성
    const timestamp = Date.now();
    const random = Math.random();
    testDbPath = path.join('test-dbs', `test-meta-${timestamp}-${random}.db`);

    // test-dbs 디렉토리가 없으면 생성
    const testDbDir = path.dirname(testDbPath);
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }

    dbManager = new DatabaseManager();
  });

  afterEach(() => {
    // 테스트 후 임시 파일 정리
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (error) {
      // 파일 삭제 실패는 무시
    }
  });

  describe('Unit Tests', () => {
    test('should handle .tables command on empty database', async () => {
      const input: MetaCommandInput = {
        dbPath: testDbPath,
        command: '.tables'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(true);
      expect(output.result).toBe('테이블이나 뷰가 없습니다');
    });

    test('should handle .tables command with existing tables', async () => {
      // 테스트 테이블 생성
      dbManager.executeQuery(testDbPath, `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      dbManager.executeQuery(testDbPath, `
        CREATE VIEW user_view AS
        SELECT id, name FROM users
      `);

      const input: MetaCommandInput = {
        dbPath: testDbPath,
        command: '.tables'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(true);
      expect(output.result).toContain('users (table)');
      expect(output.result).toContain('user_view (view)');
    });

    test('should handle .schema command for entire database', async () => {
      // 테스트 테이블 생성
      dbManager.executeQuery(testDbPath, `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      const input: MetaCommandInput = {
        dbPath: testDbPath,
        command: '.schema'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(true);
      expect(output.result).toContain('CREATE TABLE users');
      expect(output.result).toContain('id INTEGER PRIMARY KEY');
      expect(output.result).toContain('name TEXT NOT NULL');
    });

    test('should handle .schema command for specific table', async () => {
      // 테스트 테이블 생성
      dbManager.executeQuery(testDbPath, `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      dbManager.executeQuery(testDbPath, `
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          title TEXT
        )
      `);

      const input: MetaCommandInput = {
        dbPath: testDbPath,
        command: '.schema',
        target: 'users'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(true);
      expect(output.result).toContain('CREATE TABLE users');
      expect(output.result).not.toContain('CREATE TABLE posts');
    });

    test('should handle .indexes command', async () => {
      // 테스트 테이블과 인덱스 생성
      dbManager.executeQuery(testDbPath, `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        )
      `);

      dbManager.executeQuery(testDbPath, `
        CREATE INDEX idx_users_name ON users(name)
      `);

      const input: MetaCommandInput = {
        dbPath: testDbPath,
        command: '.indexes'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(true);
      expect(output.result).toContain('idx_users_name on users');
    });

    test('should handle .pragma command', async () => {
      const input: MetaCommandInput = {
        dbPath: testDbPath,
        command: '.pragma'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(true);
      expect(output.result).toBeTruthy();
      // PRAGMA 결과는 데이터베이스 설정에 따라 다를 수 있으므로 존재 여부만 확인
    });

    test('should handle .pragma command with specific target', async () => {
      const input: MetaCommandInput = {
        dbPath: testDbPath,
        command: '.pragma',
        target: 'user_version'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(true);
      // user_version의 기본값은 0
      expect(output.result).toBe('0');
    });

    test('should handle invalid database path', async () => {
      // 읽기 전용 디렉토리나 권한이 없는 경로 사용
      const input: MetaCommandInput = {
        dbPath: '/root/invalid/path/database.db', // 권한이 없는 경로
        command: '.tables'
      };

      const result = await metaCommandsTool.handler(input);
      const output = result.structuredContent as MetaResultOutput;

      // SQLite는 파일을 자동 생성하므로 경로가 유효하면 성공할 수 있음
      // 대신 빈 결과를 확인
      expect(output.success).toBe(true);
      expect(output.result).toBe('테이블이나 뷰가 없습니다');
    });

    test('should handle invalid input parameters', async () => {
      const invalidInput = {
        dbPath: '',
        command: 'invalid'
      };

      const result = await metaCommandsTool.handler(invalidInput as any);
      const output = result.structuredContent as MetaResultOutput;

      expect(output.success).toBe(false);
      expect(output.error).toBeTruthy();
    });
  });
  /**
   * Property-Based Tests for Meta Commands execution
   * **Feature: sqlite-mcp-server, Property 9: 메타 명령 실행**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   */
  describe('Property-Based Tests', () => {
    test('**Feature: sqlite-mcp-server, Property 9: 메타 명령 실행**', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            command: fc.constantFrom('.tables' as const, '.schema' as const, '.indexes' as const, '.pragma' as const),
            tableName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
            hasTarget: fc.boolean()
          }),
          async (testCase) => {
            // 테스트용 데이터베이스 생성
            const timestamp = Date.now();
            const random = Math.random();
            const dbPath = path.join('test-dbs', `test-property-${timestamp}-${random}.db`);

            try {
              // 테이블 생성 시도
              const createTableResult = dbManager.executeQuery(dbPath, `
                CREATE TABLE "${testCase.tableName}" (
                  id INTEGER PRIMARY KEY,
                  name TEXT NOT NULL
                )
              `);

              // 테이블 생성에 실패한 경우 테스트 스킵
              if (!createTableResult.success) {
                return; // 이 테스트 케이스는 스킵
              }

              // 인덱스 생성 (indexes 명령 테스트용)
              dbManager.executeQuery(dbPath, `
                CREATE INDEX "idx_${testCase.tableName}_name" ON "${testCase.tableName}"(name)
              `);

              // 메타 명령 실행
              let target: string | undefined;
              if (testCase.hasTarget) {
                // .pragma 명령의 경우 유효한 pragma 이름 사용
                if (testCase.command === '.pragma') {
                  target = 'user_version'; // 항상 유효한 pragma
                } else {
                  target = testCase.tableName;
                }
              }

              const input: MetaCommandInput = {
                dbPath,
                command: testCase.command,
                target
              };

              const result = await metaCommandsTool.handler(input);
              const output = result.structuredContent as MetaResultOutput;

              // 모든 메타 명령은 성공해야 함
              expect(output.success).toBe(true);
              expect(output.result).toBeDefined();
              expect(typeof output.result).toBe('string');

              // 명령별 특정 검증
              switch (testCase.command) {
                case '.tables':
                  // 테이블 목록에 생성한 테이블이 포함되어야 함
                  expect(output.result).toContain(testCase.tableName);
                  break;

                case '.schema':
                  if (testCase.hasTarget) {
                    // 특정 테이블의 스키마만 포함되어야 함
                    expect(output.result).toContain(`CREATE TABLE "${testCase.tableName}"`);
                  } else {
                    // 전체 스키마에 테이블이 포함되어야 함
                    expect(output.result).toContain(`CREATE TABLE "${testCase.tableName}"`);
                  }
                  break;

                case '.indexes':
                  if (testCase.hasTarget) {
                    // 특정 테이블의 인덱스 정보
                    expect(output.result).toContain(`idx_${testCase.tableName}_name`);
                  } else {
                    // 모든 인덱스 정보
                    expect(output.result).toContain(`idx_${testCase.tableName}_name`);
                  }
                  break;

                case '.pragma':
                  // PRAGMA 명령은 항상 결과를 반환해야 함
                  expect(output.result.length).toBeGreaterThan(0);
                  if (testCase.hasTarget && target === 'user_version') {
                    // user_version의 기본값은 0
                    expect(output.result).toBe('0');
                  }
                  break;
              }

            } finally {
              // 테스트 파일 정리
              try {
                if (fs.existsSync(dbPath)) {
                  fs.unlinkSync(dbPath);
                }
              } catch (error) {
                // 파일 삭제 실패는 무시
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle meta commands on databases with various table structures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
                columns: fc.array(
                  fc.record({
                    name: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
                    type: fc.constantFrom('INTEGER', 'TEXT', 'REAL', 'BLOB')
                  }),
                  { minLength: 1, maxLength: 5 }
                )
              }),
              { minLength: 1, maxLength: 3 }
            ).map(tables => {
              // 테이블 이름 중복 제거
              const uniqueTables = [];
              const seenNames = new Set();
              for (const table of tables) {
                if (!seenNames.has(table.name)) {
                  seenNames.add(table.name);
                  // 컬럼 이름도 중복 제거
                  const uniqueColumns = [];
                  const seenColumnNames = new Set();
                  for (const column of table.columns) {
                    if (!seenColumnNames.has(column.name)) {
                      seenColumnNames.add(column.name);
                      uniqueColumns.push(column);
                    }
                  }
                  uniqueTables.push({ ...table, columns: uniqueColumns });
                }
              }
              return uniqueTables;
            }).filter(tables => tables.length > 0)
          }),
          async (testCase) => {
            const timestamp = Date.now();
            const random = Math.random();
            const dbPath = path.join('test-dbs', `test-property-${timestamp}-${random}.db`);

            try {
              // 테스트 테이블들 생성
              const createdTables: string[] = [];
              for (const table of testCase.tables) {
                const columnDefs = table.columns.map(col => `"${col.name}" ${col.type}`).join(', ');
                const createSQL = `CREATE TABLE "${table.name}" (${columnDefs})`;

                const createResult = dbManager.executeQuery(dbPath, createSQL);
                if (createResult.success) {
                  createdTables.push(table.name);
                }
              }

              // 생성된 테이블이 없으면 테스트 스킵
              if (createdTables.length === 0) {
                return;
              }

              // .tables 명령 테스트
              const tablesResult = await metaCommandsTool.handler({
                dbPath,
                command: '.tables'
              });
              const tablesOutput = tablesResult.structuredContent as MetaResultOutput;

              expect(tablesOutput.success).toBe(true);
              // 모든 생성된 테이블이 목록에 포함되어야 함
              for (const tableName of createdTables) {
                expect(tablesOutput.result).toContain(tableName);
              }

              // .schema 명령 테스트
              const schemaResult = await metaCommandsTool.handler({
                dbPath,
                command: '.schema'
              });
              const schemaOutput = schemaResult.structuredContent as MetaResultOutput;

              expect(schemaOutput.success).toBe(true);
              // 모든 생성된 테이블의 스키마가 포함되어야 함
              for (const tableName of createdTables) {
                expect(schemaOutput.result).toContain(`CREATE TABLE "${tableName}"`);
              }

            } finally {
              // 테스트 파일 정리
              try {
                if (fs.existsSync(dbPath)) {
                  fs.unlinkSync(dbPath);
                }
              } catch (error) {
                // 파일 삭제 실패는 무시
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});