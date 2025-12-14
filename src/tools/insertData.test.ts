/**
 * 데이터 삽입 도구 테스트
 * **Feature: sqlite-mcp-server, Property 4: 데이터 삽입 라운드트립**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createTableTool } from './createTable';
import { insertDataTool } from './insertData';
import { DatabaseManager } from '../database/DatabaseManager';
import type { CreateTableInput, InsertDataInput } from '../types/schemas';

describe('Insert Data Tool', () => {
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

  test('**Feature: sqlite-mcp-server, Property 4: 데이터 삽입 라운드트립**', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 테이블 이름 생성기
        fc.constantFrom('table1', 'table2', 'table3', 'users', 'items', 'data', 'records', 'entries'),

        // 테이블 스키마 생성기
        fc.array(
          fc.record({
            name: fc.constantFrom('col1', 'col2', 'col3', 'col4', 'col5', 'id', 'name', 'value', 'data', 'info'),
            type: fc.constantFrom('INTEGER', 'TEXT', 'REAL')
          }),
          { minLength: 1, maxLength: 3 }
        ),

        // 삽입할 데이터 생성기
        fc.record({
          textValue: fc.string({ maxLength: 100 }),
          intValue: fc.integer({ min: -1000000, max: 1000000 }),
          realValue: fc.float({ min: -1000.0, max: 1000.0 }),
          boolValue: fc.boolean(),
          nullValue: fc.constant(null)
        }),

        async (tableName, schemaColumns, testData) => {
          const dbPath = path.join(tempDir, `test_${Date.now()}_${Math.random()}.db`);

          // 중복 컬럼명 제거
          const uniqueColumns = schemaColumns.filter((col, index, arr) =>
            arr.findIndex(c => c.name === col.name) === index
          );

          if (uniqueColumns.length === 0) return;

          try {
            // 테이블 생성
            const createInput: CreateTableInput = {
              dbPath,
              tableName,
              columns: uniqueColumns
            };

            const createResult = await createTableTool.handler(createInput);
            expect(createResult.structuredContent?.success).toBe(true);

          // 삽입할 데이터 준비 (스키마에 맞게)
          const insertData: Record<string, any> = {};

          for (const column of uniqueColumns) {
            switch (column.type) {
              case 'INTEGER':
                insertData[column.name] = testData.intValue;
                break;
              case 'TEXT':
                insertData[column.name] = testData.textValue;
                break;
              case 'REAL':
                insertData[column.name] = testData.realValue;
                break;
            }
          }

          // 데이터 삽입
          const insertInput: InsertDataInput = {
            dbPath,
            tableName,
            data: insertData
          };

          const insertResult = await insertDataTool.handler(insertInput);
          expect(insertResult.structuredContent?.success).toBe(true);
          expect(insertResult.structuredContent?.lastInsertRowid).toBeDefined();

          const insertedId = insertResult.structuredContent?.lastInsertRowid;

          // 데이터 조회하여 라운드트립 검증
          const selectResult = dbManager.executeQuery(
            dbPath,
            `SELECT * FROM ${tableName} WHERE rowid = ?`,
            [insertedId]
          );

          expect(selectResult.success).toBe(true);
          expect(selectResult.data).toHaveLength(1);

          const retrievedData = selectResult.data?.[0];
          expect(retrievedData).toBeDefined();

          // 각 컬럼 값이 올바르게 저장되고 조회되는지 확인
          for (const column of uniqueColumns) {
            const originalValue = insertData[column.name];
            const retrievedValue = retrievedData[column.name];

            switch (column.type) {
              case 'INTEGER':
                expect(retrievedValue).toBe(originalValue);
                break;
              case 'TEXT':
                expect(retrievedValue).toBe(originalValue);
                break;
              case 'REAL':
                // 부동소수점 비교는 근사치로
                if (originalValue !== null) {
                  expect(Math.abs(retrievedValue - originalValue)).toBeLessThan(0.0001);
                } else {
                  expect(retrievedValue).toBeNull();
                }
                break;
            }
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

  test('should handle empty data object', async () => {
    const dbPath = path.join(tempDir, 'test.db');

    try {
      // 먼저 테이블 생성
      const createInput: CreateTableInput = {
        dbPath,
        tableName: 'test_table',
        columns: [{ name: 'id', type: 'INTEGER' }]
      };

      await createTableTool.handler(createInput);

      // 빈 데이터로 삽입 시도
      const insertInput: InsertDataInput = {
        dbPath,
        tableName: 'test_table',
        data: {}
      };

      const result = await insertDataTool.handler(insertInput);
      expect(result.structuredContent?.success).toBe(false);
      expect(result.structuredContent?.error).toContain('삽입할 데이터가 필요합니다');
    } finally {
      dbManager.closeDatabase(dbPath);
    }
  });

  test('should handle invalid table name', async () => {
    const dbPath = path.join(tempDir, 'test.db');

    try {
      const insertInput: InsertDataInput = {
        dbPath,
        tableName: '123invalid',
        data: { id: 1 }
      };

      const result = await insertDataTool.handler(insertInput);
      expect(result.structuredContent?.success).toBe(false);
      expect(result.structuredContent?.error).toContain('유효한 테이블 이름이어야 합니다');
    } finally {
      dbManager.closeDatabase(dbPath);
    }
  });

  test('should handle invalid column names', async () => {
    const dbPath = path.join(tempDir, 'test.db');

    try {
      const insertInput: InsertDataInput = {
        dbPath,
        tableName: 'test_table',
        data: { '123invalid': 'value' }
      };

      const result = await insertDataTool.handler(insertInput);
      expect(result.structuredContent?.success).toBe(false);
      expect(result.structuredContent?.error).toContain('유효하지 않은 컬럼 이름');
    } finally {
      dbManager.closeDatabase(dbPath);
    }
  });

  test('should handle various data types', async () => {
    const dbPath = path.join(tempDir, 'test.db');

    try {
      // 다양한 타입의 컬럼을 가진 테이블 생성
      const createInput: CreateTableInput = {
        dbPath,
        tableName: 'test_table',
        columns: [
          { name: 'text_col', type: 'TEXT' },
          { name: 'int_col', type: 'INTEGER' },
          { name: 'real_col', type: 'REAL' },
          { name: 'bool_col', type: 'INTEGER' },
          { name: 'null_col', type: 'TEXT' }
        ]
      };

      await createTableTool.handler(createInput);

      // 다양한 타입의 데이터 삽입
      const insertInput: InsertDataInput = {
        dbPath,
        tableName: 'test_table',
        data: {
          text_col: 'test string',
          int_col: 42,
          real_col: 3.14,
          bool_col: true,
          null_col: null
        }
      };

      const result = await insertDataTool.handler(insertInput);
      expect(result.structuredContent?.success).toBe(true);

      // 데이터 조회하여 확인
      const selectResult = dbManager.executeQuery(
        dbPath,
        'SELECT * FROM test_table'
      );

      expect(selectResult.success).toBe(true);
      expect(selectResult.data).toHaveLength(1);

      const row = selectResult.data?.[0];
      expect(row.text_col).toBe('test string');
      expect(row.int_col).toBe(42);
      expect(Math.abs(row.real_col - 3.14)).toBeLessThan(0.0001);
      expect(row.bool_col).toBe(1); // boolean은 1로 저장됨
      expect(row.null_col).toBeNull();
    } finally {
      dbManager.closeDatabase(dbPath);
    }
  });
});