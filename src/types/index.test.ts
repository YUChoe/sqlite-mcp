/**
 * 타입 정의 테스트
 */

import { describe, test, expect } from '@jest/globals';
import {
  DatabaseErrorType,
  SQLErrorType,
  MCPErrorType,
  type QueryResult
} from './index';

describe('Types', () => {
  describe('Enums', () => {
    test('DatabaseErrorType should have correct values', () => {
      expect(DatabaseErrorType.INVALID_PATH).toBe('INVALID_PATH');
      expect(DatabaseErrorType.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
      expect(DatabaseErrorType.DISK_FULL).toBe('DISK_FULL');
      expect(DatabaseErrorType.CORRUPTED_DATABASE).toBe('CORRUPTED_DATABASE');
    });

    test('SQLErrorType should have correct values', () => {
      expect(SQLErrorType.SYNTAX_ERROR).toBe('SYNTAX_ERROR');
      expect(SQLErrorType.TABLE_NOT_EXISTS).toBe('TABLE_NOT_EXISTS');
      expect(SQLErrorType.COLUMN_NOT_EXISTS).toBe('COLUMN_NOT_EXISTS');
      expect(SQLErrorType.CONSTRAINT_VIOLATION).toBe('CONSTRAINT_VIOLATION');
      expect(SQLErrorType.TYPE_MISMATCH).toBe('TYPE_MISMATCH');
    });

    test('MCPErrorType should have correct values', () => {
      expect(MCPErrorType.INVALID_REQUEST).toBe('INVALID_REQUEST');
      expect(MCPErrorType.TOOL_NOT_FOUND).toBe('TOOL_NOT_FOUND');
      expect(MCPErrorType.INVALID_PARAMETERS).toBe('INVALID_PARAMETERS');
      expect(MCPErrorType.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });

  describe('Interface Structure', () => {
    test('QueryResult should have correct structure', () => {
      const result: QueryResult = {
        success: true,
        data: [{ id: 1, name: 'test' }],
        rowsAffected: 1,
        lastInsertRowid: 1
      };

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1, name: 'test' }]);
      expect(result.rowsAffected).toBe(1);
      expect(result.lastInsertRowid).toBe(1);
    });

    test('QueryResult should allow optional fields', () => {
      const result: QueryResult = {
        success: false,
        error: 'Test error'
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(result.data).toBeUndefined();
      expect(result.rowsAffected).toBeUndefined();
    });
  });
});