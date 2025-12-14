/**
 * 스키마 정보 조회 도구 테스트
 * **Feature: sqlite-mcp-server, Property 8: 스키마 정보 정확성**
 * **Validates: Requirements 6.1, 6.2**
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { getSchemaTool } from './getSchema';
import { createTableTool } from './createTable';
import { DatabaseManager } from '../database/DatabaseManager';

describe('Get Schema Tool Tests', () => {
  let testDbPath: string;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    // 테스트용 임시 데이터베이스 파일 경로 생성
    testDbPath = path.join(__dirname, '../../test-dbs', `test-schema-${Date.now()}.db`);

    // 테스트 디렉토리 생성
    const testDir = path.dirname(testDbPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    dbManager = new DatabaseManager();
  });

  afterEach(() => {
    // 테스트 후 정리
    try {
      dbManager.closeDatabase(testDbPath);
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (error) {
      // 정리 중 오류는 무시
    }
  });

  test('**Feature: sqlite-mcp-server, Property 8: 스키마 정보 정확성**', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 테이블 정의 생성기
        fc.array(
          fc.record({
            tableName: fc.string({ minLength: 1, maxLength: 20 })
              .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
            columns: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 20 })
                  .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
                type: fc.constantFrom('INTEGER', 'TEXT', 'REAL', 'BLOB'),
                constraints: fc.option(
                  fc.constantFrom('PRIMARY KEY', 'NOT NULL', 'UNIQUE'),
                  { freq: 3 }
                )
              }),
              { minLength: 1, maxLength: 5 }
            )
          }),
          { minLength: 1, maxLength: 3 }
        ),

        async (tableDefinitions) => {
          try {
            // 중복 테이블명 제거
            const uniqueTableDefs = tableDefinitions.filter((def, index, arr) =>
              arr.findIndex(d => d.tableName === def.tableName) === index
            );

            if (uniqueTableDefs.length === 0) return;

            const createdTables: string[] = [];

            // 1. 테이블들 생성
            for (const tableDef of uniqueTableDefs) {
              // 중복 컬럼명 제거
              const uniqueColumns = tableDef.columns.filter((col, index, arr) =>
                arr.findIndex(c => c.name === col.name) === index
              );

              if (uniqueColumns.length === 0) continue;

              const createResult = await (createTableTool.handler as any)({
                dbPath: testDbPath,
                tableName: tableDef.tableName,
                columns: uniqueColumns
              });

              const createResponse = createResult.structuredContent || { success: false };
              if (createResponse.success) {
                createdTables.push(tableDef.tableName);
              }
            }

            if (createdTables.length === 0) return;

            // 2. 전체 테이블 목록 조회 테스트
            const allTablesResult = await (getSchemaTool.handler as any)({
              dbPath: testDbPath
            });

            const allTablesResponse = allTablesResult.structuredContent || JSON.parse(allTablesResult.content[0].text);

            // Property 8: 스키마 정보 정확성 검증 - 테이블 목록
            expect(allTablesResponse.success).toBe(true);
            expect(allTablesResponse).toHaveProperty('tables');
            expect(Array.isArray(allTablesResponse.tables)).toBe(true);

            // 생성된 모든 테이블이 목록에 포함되어야 함
            for (const tableName of createdTables) {
              expect(allTablesResponse.tables).toContain(tableName);
            }

            // 3. 각 테이블의 스키마 정보 조회 테스트
            for (let i = 0; i < Math.min(createdTables.length, 2); i++) {
              const tableName = createdTables[i];
              const originalTableDef = uniqueTableDefs.find(def => def.tableName === tableName);

              if (!originalTableDef) continue;

              const schemaResult = await (getSchemaTool.handler as any)({
                dbPath: testDbPath,
                tableName
              });

              const schemaResponse = schemaResult.structuredContent || JSON.parse(schemaResult.content[0].text);

              // Property 8: 스키마 정보 정확성 검증 - 특정 테이블 스키마
              expect(schemaResponse.success).toBe(true);
              expect(schemaResponse).toHaveProperty('columns');
              expect(Array.isArray(schemaResponse.columns)).toBe(true);
              expect(schemaResponse).toHaveProperty('schema');
              expect(typeof schemaResponse.schema).toBe('string');

              // 컬럼 정보 검증
              const uniqueColumns = originalTableDef.columns.filter((col, index, arr) =>
                arr.findIndex(c => c.name === col.name) === index
              );

              expect(schemaResponse.columns.length).toBe(uniqueColumns.length);

              // 각 컬럼이 올바르게 반환되는지 확인
              for (const originalCol of uniqueColumns) {
                const returnedCol = schemaResponse.columns.find(
                  (col: any) => col.name === originalCol.name
                );

                expect(returnedCol).toBeDefined();
                expect(returnedCol.type).toBe(originalCol.type);
                expect(typeof returnedCol.notnull).toBe('boolean');
                expect(typeof returnedCol.pk).toBe('boolean');
              }

              // DDL 스키마에 테이블명이 포함되어야 함
              expect(schemaResponse.schema.toLowerCase()).toContain(tableName.toLowerCase());
            }

          } catch (error) {
            // 예상치 못한 오류가 발생한 경우 실패
            throw new Error(`Property test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('존재하지 않는 테이블 스키마 조회 시 오류 반환', async () => {
    const result = await (getSchemaTool.handler as any)({
      dbPath: testDbPath,
      tableName: 'nonexistent_table'
    });

    const response = result.structuredContent || JSON.parse(result.content[0].text);
    expect(response.success).toBe(false);
    expect(response.error).toContain('존재하지 않습니다');
  });

  test('빈 데이터베이스의 테이블 목록 조회', async () => {
    const result = await (getSchemaTool.handler as any)({
      dbPath: testDbPath
    });

    const response = result.structuredContent || JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.tables).toEqual([]);
  });

  test('특정 테이블의 상세 스키마 정보 조회', async () => {
    // 테스트 테이블 생성
    await (createTableTool.handler as any)({
      dbPath: testDbPath,
      tableName: 'test_table',
      columns: [
        { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
        { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
        { name: 'age', type: 'INTEGER' }
      ]
    });

    const result = await (getSchemaTool.handler as any)({
      dbPath: testDbPath,
      tableName: 'test_table'
    });

    const response = result.structuredContent || JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
    expect(response.columns).toHaveLength(3);

    // ID 컬럼이 PRIMARY KEY인지 확인
    const idColumn = response.columns.find((col: any) => col.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn.pk).toBe(true);

    // NAME 컬럼이 NOT NULL인지 확인
    const nameColumn = response.columns.find((col: any) => col.name === 'name');
    expect(nameColumn).toBeDefined();
    expect(nameColumn.notnull).toBe(true);
  });
});