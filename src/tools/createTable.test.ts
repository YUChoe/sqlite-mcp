/**
 * 테이블 생성 도구 테스트
 * **Feature: sqlite-mcp-server, Property 3: 테이블 생성 일관성**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createTableTool } from './createTable';
import { DatabaseManager } from '../database/DatabaseManager';
import type { CreateTableInput } from '../types/schemas';

describe('Create Table Tool', () => {
  let tempDir: string;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    // 임시 디렉토리 생성
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-test-'));
    dbManager = new DatabaseManager();
  });

  afterEach(() => {
    // 정리
    dbManager.closeAllDatabases();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('**Feature: sqlite-mcp-server, Property 3: 테이블 생성 일관성**', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 테이블 이름 생성기
        fc.string({ minLength: 1, maxLength: 20 })
          .filter(name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)),

        // 컬럼 정의 생성기
        fc.array(
          fc.record({
            name: fc.constantFrom('col1', 'col2', 'col3', 'col4', 'col5', 'id', 'name', 'value', 'data', 'info', 'item', 'field', 'attr', 'prop'),
            type: fc.constantFrom('INTEGER', 'TEXT', 'REAL', 'BLOB'),
            constraints: fc.option(fc.constantFrom('PRIMARY KEY', 'NOT NULL', 'UNIQUE'))
          }),
          { minLength: 1, maxLength: 5 }
        ),

        async (tableName, columns) => {
          const dbPath = path.join(tempDir, `test_${Date.now()}_${Math.random()}.db`);

          // 중복 컬럼명 제거 및 타입 변환
          let uniqueColumns = columns
            .filter((col, index, arr) =>
              arr.findIndex(c => c.name.toLowerCase() === col.name.toLowerCase()) === index
            )
            .map(col => ({
              ...col,
              constraints: col.constraints || undefined
            }));

          // PRIMARY KEY는 하나만 허용
          let hasPrimaryKey = false;
          uniqueColumns = uniqueColumns.map(col => {
            if (col.constraints === 'PRIMARY KEY') {
              if (hasPrimaryKey) {
                return { ...col, constraints: undefined };
              } else {
                hasPrimaryKey = true;
                return col;
              }
            }
            return col;
          });

          if (uniqueColumns.length === 0) return;

          const input: CreateTableInput = {
            dbPath,
            tableName,
            columns: uniqueColumns
          };

          try {
            // 테이블 생성 실행
            const result = await createTableTool.handler(input);

            // 결과 검증
            if (!result.structuredContent?.success) {
              console.log('Table creation failed:', {
                tableName,
                columns: uniqueColumns,
                error: result.structuredContent?.error
              });
            }
            expect(result.structuredContent?.success).toBe(true);

            // 실제로 테이블이 생성되었는지 확인
            const checkResult = dbManager.executeQuery(
              dbPath,
              "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
              [tableName]
            );

            expect(checkResult.success).toBe(true);
            expect(checkResult.data).toHaveLength(1);
            expect(checkResult.data?.[0].name).toBe(tableName);

            // 스키마 확인
            const schemaResult = dbManager.executeQuery(
              dbPath,
              `PRAGMA table_info(${tableName})`
            );

            expect(schemaResult.success).toBe(true);
            expect(schemaResult.data).toBeDefined();
            expect(schemaResult.data).toHaveLength(uniqueColumns.length);

            // 각 컬럼이 올바르게 생성되었는지 확인
            const actualColumns = schemaResult.data || [];
            for (const expectedCol of uniqueColumns) {
              const actualCol = actualColumns.find(col => col.name === expectedCol.name);
              expect(actualCol).toBeDefined();
              expect(actualCol.type.toUpperCase()).toBe(expectedCol.type.toUpperCase());
            }
          } finally {
            // 데이터베이스 연결 명시적으로 닫기
            dbManager.closeDatabase(dbPath);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should handle invalid table names', async () => {
    const dbPath = path.join(tempDir, 'test.db');

    const invalidInput: CreateTableInput = {
      dbPath,
      tableName: '123invalid', // 숫자로 시작하는 잘못된 이름
      columns: [{ name: 'id', type: 'INTEGER' }]
    };

    try {
      const result = await createTableTool.handler(invalidInput);
      expect(result.structuredContent?.success).toBe(false);
      expect(result.structuredContent?.error).toContain('유효한 테이블 이름이어야 합니다');
    } finally {
      dbManager.closeDatabase(dbPath);
    }
  });

  test('should handle invalid column names', async () => {
    const dbPath = path.join(tempDir, 'test.db');

    const invalidInput: CreateTableInput = {
      dbPath,
      tableName: 'test_table',
      columns: [{ name: '123invalid', type: 'INTEGER' }] // 잘못된 컬럼명
    };

    try {
      const result = await createTableTool.handler(invalidInput);
      expect(result.structuredContent?.success).toBe(false);
      expect(result.structuredContent?.error).toContain('유효하지 않은 컬럼 이름');
    } finally {
      dbManager.closeDatabase(dbPath);
    }
  });

  test('should handle invalid column types', async () => {
    const dbPath = path.join(tempDir, 'test.db');

    const invalidInput: CreateTableInput = {
      dbPath,
      tableName: 'test_table',
      columns: [{ name: 'id', type: 'INVALID_TYPE' }] // 잘못된 타입
    };

    try {
      const result = await createTableTool.handler(invalidInput);
      expect(result.structuredContent?.success).toBe(false);
      expect(result.structuredContent?.error).toContain('유효하지 않은 컬럼 타입');
    } finally {
      dbManager.closeDatabase(dbPath);
    }
  });
});