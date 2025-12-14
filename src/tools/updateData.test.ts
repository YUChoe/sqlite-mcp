/**
 * UPDATE 데이터 도구 테스트
 */

import { updateDataTool } from './updateData';
import { createTableTool } from './createTable';
import { insertDataTool } from './insertData';
import { selectDataTool } from './selectData';
import fs from 'fs';
import path from 'path';

describe('updateDataTool', () => {
  const testDbDir = 'test-dbs';
  let testDbPath: string;

  beforeEach(() => {
    // 테스트 데이터베이스 디렉토리 생성
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }

    // 고유한 테스트 데이터베이스 파일 경로 생성
    testDbPath = path.join(testDbDir, `test-update-${Date.now()}.db`);
  });

  afterEach(() => {
    // 데이터베이스 연결 닫기
    const dbManager = new (require('../database/DatabaseManager').DatabaseManager)();
    dbManager.closeAllDatabases();

    // 테스트 후 데이터베이스 파일 정리
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (error) {
        // Windows에서 파일이 잠겨있을 수 있으므로 무시
        console.warn(`파일 삭제 실패: ${testDbPath}`, error);
      }
    }
  });

  describe('기본 UPDATE 작업', () => {
    test('단일 행 업데이트가 성공해야 함', async () => {
      // 테이블 생성
      await createTableTool.handler({
        dbPath: testDbPath,
        tableName: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'TEXT' },
          { name: 'age', type: 'INTEGER' }
        ]
      });

      // 테스트 데이터 삽입
      await insertDataTool.handler({
        dbPath: testDbPath,
        tableName: 'users',
        data: { id: 1, name: 'Alice', age: 25 }
      });

      await insertDataTool.handler({
        dbPath: testDbPath,
        tableName: 'users',
        data: { id: 2, name: 'Bob', age: 30 }
      });

      // UPDATE 실행
      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: 'UPDATE users SET age = ? WHERE id = ?',
        params: [26, 1]
      });

      expect(result.structuredContent.success).toBe(true);
      expect(result.structuredContent.rowsAffected).toBe(1);

      // 업데이트 결과 확인
      const selectResult = await selectDataTool.handler({
        dbPath: testDbPath,
        query: 'SELECT * FROM users WHERE id = 1'
      });

      expect(selectResult.structuredContent.data).toEqual([
        { id: 1, name: 'Alice', age: 26 }
      ]);
    });

    test('여러 행 업데이트가 성공해야 함', async () => {
      // 테이블 생성
      await createTableTool.handler({
        dbPath: testDbPath,
        tableName: 'products',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'TEXT' },
          { name: 'price', type: 'REAL' },
          { name: 'category', type: 'TEXT' }
        ]
      });

      // 테스트 데이터 삽입
      const products = [
        { id: 1, name: 'Product A', price: 10.0, category: 'electronics' },
        { id: 2, name: 'Product B', price: 20.0, category: 'electronics' },
        { id: 3, name: 'Product C', price: 15.0, category: 'books' }
      ];

      for (const product of products) {
        await insertDataTool.handler({
          dbPath: testDbPath,
          tableName: 'products',
          data: product
        });
      }

      // 카테고리별 가격 업데이트
      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: 'UPDATE products SET price = price * 1.1 WHERE category = ?',
        params: ['electronics']
      });

      expect(result.structuredContent.success).toBe(true);
      expect(result.structuredContent.rowsAffected).toBe(2);

      // 업데이트 결과 확인
      const selectResult = await selectDataTool.handler({
        dbPath: testDbPath,
        query: 'SELECT * FROM products WHERE category = ? ORDER BY id',
        params: ['electronics']
      });

      expect(selectResult.structuredContent.data).toEqual([
        { id: 1, name: 'Product A', price: 11.0, category: 'electronics' },
        { id: 2, name: 'Product B', price: 22.0, category: 'electronics' }
      ]);
    });

    test('조건에 맞는 행이 없을 때 0개 행 영향을 반환해야 함', async () => {
      // 테이블 생성
      await createTableTool.handler({
        dbPath: testDbPath,
        tableName: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'TEXT' }
        ]
      });

      // 존재하지 않는 ID로 업데이트 시도
      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: 'UPDATE users SET name = ? WHERE id = ?',
        params: ['New Name', 999]
      });

      expect(result.structuredContent.success).toBe(true);
      expect(result.structuredContent.rowsAffected).toBe(0);
    });
  });

  describe('오류 처리', () => {
    test('잘못된 테이블명으로 업데이트 시 오류를 반환해야 함', async () => {
      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: 'UPDATE nonexistent_table SET name = ?',
        params: ['test']
      });

      expect(result.structuredContent.success).toBe(false);
      expect(result.structuredContent.error).toContain('no such table');
    });

    test('잘못된 컬럼명으로 업데이트 시 오류를 반환해야 함', async () => {
      // 테이블 생성
      await createTableTool.handler({
        dbPath: testDbPath,
        tableName: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'TEXT' }
        ]
      });

      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: 'UPDATE users SET nonexistent_column = ?',
        params: ['test']
      });

      expect(result.structuredContent.success).toBe(false);
      expect(result.structuredContent.error).toContain('no such column');
    });

    test('UPDATE가 아닌 쿼리 실행 시 오류를 반환해야 함', async () => {
      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: 'SELECT * FROM users',
        params: []
      });

      expect(result.structuredContent.success).toBe(false);
      expect(result.structuredContent.error).toContain('UPDATE 쿼리만 허용됩니다');
    });

    test('SET 절이 없는 UPDATE 쿼리 시 오류를 반환해야 함', async () => {
      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: 'UPDATE users WHERE id = 1',
        params: []
      });

      expect(result.structuredContent.success).toBe(false);
      expect(result.structuredContent.error).toContain('SET 절이 필요합니다');
    });

    test('위험한 SQL 구문 포함 시 오류를 반환해야 함', async () => {
      const dangerousQueries = [
        'UPDATE users SET name = "test"; DROP TABLE users;',
        'UPDATE users SET name = (SELECT * FROM (DELETE FROM users))',
        'UPDATE users SET name = "test"; TRUNCATE TABLE users;'
      ];

      for (const query of dangerousQueries) {
        const result = await updateDataTool.handler({
          dbPath: testDbPath,
          query,
          params: []
        });

        expect(result.structuredContent.success).toBe(false);
        expect(result.structuredContent.error).toContain('허용되지 않는 SQL 구문');
      }
    });

    test('잘못된 데이터베이스 경로 시 오류를 반환해야 함', async () => {
      const result = await updateDataTool.handler({
        dbPath: '/invalid/path/database.db',
        query: 'UPDATE users SET name = ?',
        params: ['test']
      });

      expect(result.structuredContent.success).toBe(false);
      expect(result.structuredContent.error).toBeDefined();
    });
  });

  describe('입력 검증', () => {
    test('빈 데이터베이스 경로 시 오류를 반환해야 함', async () => {
      const result = await updateDataTool.handler({
        dbPath: '',
        query: 'UPDATE users SET name = ?',
        params: ['test']
      });

      expect(result.structuredContent.success).toBe(false);
      expect(result.structuredContent.error).toContain('데이터베이스 경로는 필수입니다');
    });

    test('빈 쿼리 시 오류를 반환해야 함', async () => {
      const result = await updateDataTool.handler({
        dbPath: testDbPath,
        query: '',
        params: []
      });

      expect(result.structuredContent.success).toBe(false);
      expect(result.structuredContent.error).toContain('SQL 쿼리는 필수입니다');
    });
  });
});

/**
 * Property-Based Tests for UPDATE operation accuracy
 * **Feature: sqlite-mcp-server, Property 6: UPDATE 작업 정확성**
 * **Validates: Requirements 4.1, 4.2**
 */

import * as fc from 'fast-check';

describe('Property-Based Tests', () => {
  const testDbDir = 'test-dbs';
  let propertyTestDbPath: string;

  beforeEach(() => {
    // 테스트 데이터베이스 디렉토리 생성
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }

    // 고유한 테스트 데이터베이스 파일 경로 생성
    propertyTestDbPath = path.join(testDbDir, `test-update-property-${Date.now()}.db`);
  });

  afterEach(() => {
    // 데이터베이스 연결 닫기
    const dbManager = new (require('../database/DatabaseManager').DatabaseManager)();
    dbManager.closeAllDatabases();

    // 테스트 후 데이터베이스 파일 정리
    if (fs.existsSync(propertyTestDbPath)) {
      try {
        fs.unlinkSync(propertyTestDbPath);
      } catch (error) {
        // Windows에서 파일이 잠겨있을 수 있으므로 무시
        console.warn(`파일 삭제 실패: ${propertyTestDbPath}`, error);
      }
    }
  });

  test('**Feature: sqlite-mcp-server, Property 6: UPDATE 작업 정확성**', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 테이블 이름 생성기
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
        // 초기 데이터 생성기
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 1, maxLength: 10 }
        ).map(arr => {
          // ID 중복 제거
          const uniqueIds = new Set();
          return arr.filter(item => {
            if (uniqueIds.has(item.id)) {
              return false;
            }
            uniqueIds.add(item.id);
            return true;
          });
        }).filter(arr => arr.length > 0),
        // 업데이트할 새 값 생성기
        fc.integer({ min: 101, max: 200 }),
        // 업데이트 조건 생성기 (특정 ID 선택)
        fc.integer({ min: 1, max: 1000 }),

        async (tableName, initialData, newValue, targetId) => {
          // 고유한 데이터베이스 경로 생성
          const dbPath = path.join(testDbDir, `test-property-${Date.now()}-${Math.random()}.db`);

          try {
            // 테이블 생성
            await createTableTool.handler({
              dbPath,
              tableName,
              columns: [
                { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
                { name: 'name', type: 'TEXT' },
                { name: 'value', type: 'INTEGER' }
              ]
            });

            // 초기 데이터 삽입
            for (const data of initialData) {
              await insertDataTool.handler({
                dbPath,
                tableName,
                data
              });
            }

            // 업데이트 전 상태 확인
            const beforeResult = await selectDataTool.handler({
              dbPath,
              query: `SELECT * FROM ${tableName} WHERE id = ?`,
              params: [targetId]
            });

            const beforeCount = beforeResult.structuredContent.data?.length || 0;

            // UPDATE 실행
            const updateResult = await updateDataTool.handler({
              dbPath,
              query: `UPDATE ${tableName} SET value = ? WHERE id = ?`,
              params: [newValue, targetId]
            });

            // 업데이트 후 상태 확인
            const afterResult = await selectDataTool.handler({
              dbPath,
              query: `SELECT * FROM ${tableName} WHERE id = ?`,
              params: [targetId]
            });

            const afterCount = afterResult.structuredContent.data?.length || 0;

            // Property 검증: UPDATE 작업 정확성
            if (updateResult.structuredContent.success) {
              // 1. 영향받은 행 수가 정확해야 함
              expect(updateResult.structuredContent.rowsAffected).toBe(beforeCount);

              // 2. 대상 행이 존재했다면 값이 업데이트되어야 함
              if (beforeCount > 0) {
                expect(afterCount).toBe(1);
                const updatedRow = afterResult.structuredContent.data?.[0];
                expect(updatedRow?.value).toBe(newValue);
                expect(updatedRow?.id).toBe(targetId);
              } else {
                // 3. 대상 행이 없었다면 여전히 없어야 함
                expect(afterCount).toBe(0);
              }

              // 4. 다른 행들은 영향받지 않아야 함
              const allRowsAfter = await selectDataTool.handler({
                dbPath,
                query: `SELECT * FROM ${tableName}`,
                params: []
              });

              const totalRowsAfter = allRowsAfter.structuredContent.data?.length || 0;
              expect(totalRowsAfter).toBe(initialData.length);

              // 5. 업데이트되지 않은 행들의 값은 변경되지 않아야 함
              const unchangedRows = await selectDataTool.handler({
                dbPath,
                query: `SELECT * FROM ${tableName} WHERE id != ?`,
                params: [targetId]
              });

              if (unchangedRows.structuredContent.data) {
                for (const row of unchangedRows.structuredContent.data) {
                  const originalRow = initialData.find(d => d.id === row.id);
                  if (originalRow) {
                    expect(row.value).toBe(originalRow.value);
                    expect(row.name).toBe(originalRow.name);
                  }
                }
              }
            }

          } finally {
            // 데이터베이스 연결 닫기
            const dbManager = new (require('../database/DatabaseManager').DatabaseManager)();
            dbManager.closeDatabase(dbPath);

            // 테스트 후 정리
            if (fs.existsSync(dbPath)) {
              try {
                fs.unlinkSync(dbPath);
              } catch (error) {
                // Windows에서 파일이 잠겨있을 수 있으므로 무시
                console.warn(`파일 삭제 실패: ${dbPath}`, error);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // 30초 타임아웃
});