/**
 * Zod 스키마 테스트
 */

import { describe, test, expect } from '@jest/globals';
import {
  CreateTableSchema,
  InsertDataSchema,
  MetaCommandSchema,
  QueryResultSchema
} from './schemas';

describe('Schemas', () => {
  describe('CreateTableSchema', () => {
    test('should validate correct input', () => {
      const validInput = {
        dbPath: '/path/to/database.db',
        tableName: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'TEXT' }
        ]
      };

      const result = CreateTableSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should reject invalid table name', () => {
      const invalidInput = {
        dbPath: '/path/to/database.db',
        tableName: '123invalid',
        columns: [{ name: 'id', type: 'INTEGER' }]
      };

      const result = CreateTableSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    test('should reject empty columns array', () => {
      const invalidInput = {
        dbPath: '/path/to/database.db',
        tableName: 'users',
        columns: []
      };

      const result = CreateTableSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('InsertDataSchema', () => {
    test('should validate correct input', () => {
      const validInput = {
        dbPath: '/path/to/database.db',
        tableName: 'users',
        data: { id: 1, name: 'John Doe' }
      };

      const result = InsertDataSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should reject empty data object', () => {
      const invalidInput = {
        dbPath: '/path/to/database.db',
        tableName: 'users',
        data: {}
      };

      const result = InsertDataSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('MetaCommandSchema', () => {
    test('should validate correct meta commands', () => {
      const commands = ['.tables', '.schema', '.indexes', '.pragma'];

      commands.forEach(command => {
        const input = {
          dbPath: '/path/to/database.db',
          command
        };

        const result = MetaCommandSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    test('should reject invalid meta command', () => {
      const invalidInput = {
        dbPath: '/path/to/database.db',
        command: '.invalid'
      };

      const result = MetaCommandSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('QueryResultSchema', () => {
    test('should validate successful query result', () => {
      const validResult = {
        success: true,
        data: [{ id: 1, name: 'test' }],
        rowsAffected: 1
      };

      const result = QueryResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    test('should validate error result', () => {
      const errorResult = {
        success: false,
        error: 'Database error'
      };

      const result = QueryResultSchema.safeParse(errorResult);
      expect(result.success).toBe(true);
    });
  });
});