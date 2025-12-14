/**
 * DELETE 데이터 도구 테스트
 */

import { deleteDataTool } from './deleteData';
import { DatabaseManager } from '../database/DatabaseManager';
import fs from 'fs';
import path from 'path';

// 테스트용 데이터베이스 경로
const TEST_DB_DIR = 'test-dbs';
const getTestDbPath = () => path.join(TEST_DB_DIR, `test-delete-${Date.now()}.db`);

// 테스트 전 설정
beforeAll(() => {
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }
});

describe('deleteDataTool', () => {
  let testDbPath: string;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    testDbPath = getTestDbPath();
    dbManager = new DatabaseManager();

    // 테스트용 테이블과 데이터 생성
    dbManager.executeQuery(testDbPath, `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER
      )
    `);

    // 테스트 데이터 삽입
    dbManager.executeQuery(testDbPath,
      'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
      ['Alice', 'alice@example.com', 25]
    );
    dbManager.executeQuery(testDbPath,
      'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
      ['Bob', 'bob@example.com', 30]
    );
    dbManager.executeQuery(testDbPath,
      'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
      ['Charlie', 'charlie@example.com', 35]
    );
  });

  afterEach(() => {
    // 데이터베이스 연결 닫기
    dbManager.closeAllDatabases();

    // 테스트 데이터베이스 정리
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (error) {
        // Windows에서 파일이 잠겨있을 수 있으므로 무시
        console.warn(`파일 삭제 실패: ${testDbPath}`, error);
      }
    }
  });

  test('조건부 DELETE 쿼리 실행', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'DELETE FROM users WHERE age > ?',
      params: [30]
    });

    expect(result.structuredContent).toEqual({
      success: true,
      rowsAffected: 1
    });

    expect(result.content[0].text).toContain('데이터가 성공적으로 삭제되었습니다');
    expect(result.content[0].text).toContain('삭제된 행 수: 1');

    // 삭제 후 데이터 확인
    const selectResult = dbManager.executeQuery(testDbPath, 'SELECT COUNT(*) as count FROM users');
    expect(selectResult.data?.[0].count).toBe(2);
  });

  test('전체 테이블 DELETE 실행', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'DELETE FROM users'
    });

    expect(result.structuredContent).toEqual({
      success: true,
      rowsAffected: 3
    });

    // 삭제 후 데이터 확인
    const selectResult = dbManager.executeQuery(testDbPath, 'SELECT COUNT(*) as count FROM users');
    expect(selectResult.data?.[0].count).toBe(0);
  });

  test('조건에 맞는 행이 없는 경우', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'DELETE FROM users WHERE age > ?',
      params: [100]
    });

    expect(result.structuredContent).toEqual({
      success: true,
      rowsAffected: 0
    });

    expect(result.content[0].text).toContain('삭제된 행 수: 0');
  });

  test('잘못된 DELETE 쿼리 - SELECT 쿼리 시도', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'SELECT * FROM users'
    });

    expect(result.structuredContent).toEqual({
      success: false,
      error: 'DELETE 쿼리만 허용됩니다'
    });
  });

  test('잘못된 DELETE 쿼리 - FROM 절 누락', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'DELETE users WHERE id = 1'
    });

    expect(result.structuredContent).toEqual({
      success: false,
      error: 'DELETE 쿼리에 FROM 절이 필요합니다'
    });
  });

  test('위험한 SQL 구문 차단 - DROP TABLE', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'DELETE FROM users; DROP TABLE users;'
    });

    expect(result.structuredContent).toEqual({
      success: false,
      error: '허용되지 않는 SQL 구문이 포함되어 있습니다'
    });
  });

  test('존재하지 않는 테이블 삭제 시도', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'DELETE FROM nonexistent_table'
    });

    expect(result.structuredContent?.success).toBe(false);
    expect(result.structuredContent?.error).toContain('no such table');
  });

  test('잘못된 데이터베이스 경로', async () => {
    const result = await deleteDataTool.handler({
      dbPath: '/invalid/path/database.db',
      query: 'DELETE FROM users WHERE id = 1'
    });

    expect(result.structuredContent?.success).toBe(false);
    expect(result.structuredContent?.error).toBeDefined();
  });

  test('매개변수화된 DELETE 쿼리', async () => {
    const result = await deleteDataTool.handler({
      dbPath: testDbPath,
      query: 'DELETE FROM users WHERE name = ? AND age = ?',
      params: ['Alice', 25]
    });

    expect(result.structuredContent).toEqual({
      success: true,
      rowsAffected: 1
    });

    // Alice가 삭제되었는지 확인
    const selectResult = dbManager.executeQuery(testDbPath, 'SELECT * FROM users WHERE name = ?', ['Alice']);
    expect(selectResult.data?.length).toBe(0);
  });
});

/**
 * Property-Based Tests for DELETE operation accuracy
 * **Feature: sqlite-mcp-server, Property 7: DELETE 작업 정확성**
 * **Validates: Requirements 5.1, 5.2**
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
    propertyTestDbPath = path.join(testDbDir, `test-delete-property-${Date.now()}.db`);
  });

  afterEach(() => {
    // 데이터베이스 연결 닫기
    const dbManager = new DatabaseManager();
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

  test('**Feature: sqlite-mcp-server, Property 7: DELETE 작업 정확성**', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 테이블 이름 생성기
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
        // 초기 데이터 생성기
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            category: fc.oneof(
              fc.constant('A'),
              fc.constant('B'),
              fc.constant('C')
            )
          }),
          { minLength: 1, maxLength: 15 }
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
        // 삭제 조건 생성기 (카테고리 기반)
        fc.oneof(
          fc.constant('A'),
          fc.constant('B'),
          fc.constant('C'),
          fc.constant('D') // 존재하지 않는 카테고리
        ),

        async (tableName, initialData, deleteCategory) => {
          // 고유한 데이터베이스 경로 생성
          const dbPath = path.join(testDbDir, `test-property-${Date.now()}-${Math.random()}.db`);

          try {
            const dbManager = new DatabaseManager();

            // 테이블 생성
            dbManager.executeQuery(dbPath, `
              CREATE TABLE ${tableName} (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL
              )
            `);

            // 초기 데이터 삽입
            for (const data of initialData) {
              dbManager.executeQuery(dbPath,
                `INSERT INTO ${tableName} (id, name, category) VALUES (?, ?, ?)`,
                [data.id, data.name, data.category]
              );
            }

            // 삭제 전 상태 확인
            const beforeAllResult = dbManager.executeQuery(dbPath, `SELECT * FROM ${tableName}`);
            const beforeTargetResult = dbManager.executeQuery(dbPath,
              `SELECT * FROM ${tableName} WHERE category = ?`,
              [deleteCategory]
            );

            const totalRowsBefore = beforeAllResult.data?.length || 0;
            const targetRowsBefore = beforeTargetResult.data?.length || 0;

            // DELETE 실행
            const deleteResult = await deleteDataTool.handler({
              dbPath,
              query: `DELETE FROM ${tableName} WHERE category = ?`,
              params: [deleteCategory]
            });

            // 삭제 후 상태 확인
            const afterAllResult = dbManager.executeQuery(dbPath, `SELECT * FROM ${tableName}`);
            const afterTargetResult = dbManager.executeQuery(dbPath,
              `SELECT * FROM ${tableName} WHERE category = ?`,
              [deleteCategory]
            );

            const totalRowsAfter = afterAllResult.data?.length || 0;
            const targetRowsAfter = afterTargetResult.data?.length || 0;

            // Property 검증: DELETE 작업 정확성
            if (deleteResult.structuredContent?.success) {
              // 1. 삭제된 행 수가 정확해야 함
              expect(deleteResult.structuredContent.rowsAffected).toBe(targetRowsBefore);

              // 2. 조건에 맞는 행들이 모두 삭제되어야 함
              expect(targetRowsAfter).toBe(0);

              // 3. 전체 행 수가 올바르게 감소해야 함
              expect(totalRowsAfter).toBe(totalRowsBefore - targetRowsBefore);

              // 4. 삭제되지 않은 행들은 그대로 남아있어야 함
              if (afterAllResult.data) {
                for (const remainingRow of afterAllResult.data) {
                  // 남은 행들은 삭제 조건에 맞지 않아야 함
                  expect(remainingRow.category).not.toBe(deleteCategory);

                  // 남은 행들은 원본 데이터에 존재했던 것이어야 함
                  const originalRow = initialData.find(d => d.id === remainingRow.id);
                  expect(originalRow).toBeDefined();
                  expect(originalRow?.name).toBe(remainingRow.name);
                  expect(originalRow?.category).toBe(remainingRow.category);
                }
              }

              // 5. 삭제 조건에 맞지 않는 행들의 수는 변하지 않아야 함
              const remainingCategories = new Set(initialData
                .filter(d => d.category !== deleteCategory)
                .map(d => d.category)
              );

              for (const category of remainingCategories) {
                const beforeCategoryResult = dbManager.executeQuery(dbPath,
                  `SELECT COUNT(*) as count FROM ${tableName} WHERE category = ?`,
                  [category]
                );
                const originalCategoryCount = initialData.filter(d => d.category === category).length;

                // 원본 데이터와 현재 데이터베이스의 해당 카테고리 행 수가 같아야 함
                expect(beforeCategoryResult.data?.[0]?.count).toBe(originalCategoryCount);
              }
            }

          } finally {
            // 데이터베이스 연결 닫기
            const dbManager = new DatabaseManager();
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