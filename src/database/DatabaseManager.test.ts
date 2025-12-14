/**
 * DatabaseManager Property-Based Tests
 * **Feature: sqlite-mcp-server, Property 1: 데이터베이스 연결 처리**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseManager } from './DatabaseManager';

describe('DatabaseManager Property Tests', () => {
  let manager: DatabaseManager;
  let tempDir: string;

  beforeEach(() => {
    manager = new DatabaseManager();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-test-'));
  });

  afterEach(() => {
    manager.closeAllDatabases();
    // 임시 디렉토리 정리
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('**Feature: sqlite-mcp-server, Property 1: 데이터베이스 연결 처리**', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 })
        .filter(s =>
          !s.includes('\0') &&
          !s.includes('..') &&
          !s.includes('.') &&
          !/[<>:"|?*\\/]/.test(s) &&
          s.trim().length > 0 &&
          !s.startsWith(' ') &&
          !s.endsWith(' ')
        ),
      (filename) => {
        const dbPath = path.join(tempDir, `${filename}.db`);

        // 유효한 경로는 성공적으로 연결되어야 함 (Requirements 1.1)
        const database = manager.getDatabase(dbPath);
        expect(database).toBeDefined();
        expect(database.path).toBe(dbPath);
        expect(database.connection).toBeDefined();
        expect(database.lastAccessed).toBeInstanceOf(Date);

        // 파일이 생성되어야 함 (Requirements 1.3)
        expect(fs.existsSync(dbPath)).toBe(true);

        // 같은 경로로 다시 요청하면 캐시된 연결을 반환해야 함
        const database2 = manager.getDatabase(dbPath);
        expect(database2).toBe(database);

        return true;
      }
    ), { numRuns: 100 });
  });

  test('잘못된 경로는 적절한 오류를 반환해야 함 (Requirements 1.2)', () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant(''),
        fc.constant('..'),
        fc.constant('../test.db'),
        fc.constant('../../test.db')
      ),
      (invalidPath) => {
        expect(() => {
          manager.getDatabase(invalidPath);
        }).toThrow();

        return true;
      }
    ), { numRuns: 20 });
  });

  test('존재하지 않는 디렉토리에 데이터베이스 생성 (Requirements 1.3)', () => {
    fc.assert(fc.property(
      fc.array(
        fc.string({ minLength: 1, maxLength: 10 })
          .filter(s =>
            !s.includes('\0') &&
            !s.includes('..') &&
            !s.includes('.') &&
            !/[<>:"|?*\\/]/.test(s) &&
            s.trim().length > 0 &&
            !s.startsWith(' ') &&
            !s.endsWith(' ')
          ),
        { minLength: 1, maxLength: 3 }
      ),
      (pathSegments) => {
        const nestedPath = path.join(tempDir, ...pathSegments, 'test.db');

        // 중첩된 디렉토리가 없어도 데이터베이스가 생성되어야 함
        const database = manager.getDatabase(nestedPath);
        expect(database).toBeDefined();
        expect(fs.existsSync(nestedPath)).toBe(true);

        return true;
      }
    ), { numRuns: 50 });
  });

  test('**Feature: sqlite-mcp-server, Property 2: 동시 데이터베이스 처리**', () => {
    fc.assert(fc.property(
      fc.array(
        fc.string({ minLength: 1, maxLength: 20 })
          .filter(s =>
            !s.includes('\0') &&
            !s.includes('..') &&
            !s.includes('.') &&
            !/[<>:"|?*\\/]/.test(s) &&
            s.trim().length > 0 &&
            !s.startsWith(' ') &&
            !s.endsWith(' ')
          ),
        { minLength: 2, maxLength: 5 }
      ).filter(arr => {
        // 중복된 파일명 제거
        const uniqueNames = new Set(arr);
        return uniqueNames.size === arr.length && arr.length >= 2;
      }),
      (filenames) => {
        const dbPaths = filenames.map(name => path.join(tempDir, `${name}.db`));

        // 여러 데이터베이스에 동시 접근
        const databases = dbPaths.map(dbPath => manager.getDatabase(dbPath));

        // 각 데이터베이스는 독립적이어야 함 (Requirements 1.4)
        for (let i = 0; i < databases.length; i++) {
          expect(databases[i]).toBeDefined();
          expect(databases[i].path).toBe(dbPaths[i]);
          expect(fs.existsSync(dbPaths[i])).toBe(true);

          // 다른 데이터베이스와 다른 연결이어야 함
          for (let j = i + 1; j < databases.length; j++) {
            expect(databases[i].connection).not.toBe(databases[j].connection);
            expect(databases[i].path).not.toBe(databases[j].path);
          }
        }

        // 각 데이터베이스에서 독립적인 작업 수행
        const testId = Date.now();
        for (let i = 0; i < dbPaths.length; i++) {
          const tableName = `test_${testId}_${i}`;
          const result = manager.executeQuery(
            dbPaths[i],
            `CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY, name TEXT)`
          );
          expect(result.success).toBe(true);

          const insertResult = manager.executeQuery(
            dbPaths[i],
            `INSERT INTO ${tableName} (name) VALUES (?)`,
            [`test_${i}`]
          );
          expect(insertResult.success).toBe(true);
        }

        // 각 데이터베이스의 데이터가 독립적인지 확인
        for (let i = 0; i < dbPaths.length; i++) {
          const tableName = `test_${testId}_${i}`;
          const selectResult = manager.executeQuery(
            dbPaths[i],
            `SELECT * FROM ${tableName}`
          );
          expect(selectResult.success).toBe(true);
          expect(selectResult.data).toHaveLength(1);
          expect(selectResult.data![0].name).toBe(`test_${i}`);
        }

        return true;
      }
    ), { numRuns: 50 });
  });
});