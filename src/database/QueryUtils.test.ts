/**
 * QueryUtils 단위 테스트
 */

import {
  detectQueryType,
  validateSQLParams,
  validateTableName,
  validateColumnName,
  basicSQLInjectionCheck,
  TransactionBuilder,
  validateQueryResult,
  classifySQLError,
  measureQueryPerformance,
  createBatchOperations
} from './QueryUtils';
import { SQLErrorType } from '../types/index';

describe('QueryUtils', () => {
  describe('detectQueryType', () => {
    test('should detect SELECT queries', () => {
      expect(detectQueryType('SELECT * FROM users')).toBe('SELECT');
      expect(detectQueryType('  select id from table  ')).toBe('SELECT');
    });

    test('should detect INSERT queries', () => {
      expect(detectQueryType('INSERT INTO users VALUES (1, "test")')).toBe('INSERT');
      expect(detectQueryType('insert into table (col) values (?)')).toBe('INSERT');
    });

    test('should detect UPDATE queries', () => {
      expect(detectQueryType('UPDATE users SET name = ?')).toBe('UPDATE');
    });

    test('should detect DELETE queries', () => {
      expect(detectQueryType('DELETE FROM users WHERE id = ?')).toBe('DELETE');
    });

    test('should detect CREATE queries', () => {
      expect(detectQueryType('CREATE TABLE users (id INTEGER)')).toBe('CREATE');
    });

    test('should return UNKNOWN for unrecognized queries', () => {
      expect(detectQueryType('EXPLAIN QUERY PLAN SELECT * FROM users')).toBe('UNKNOWN');
    });
  });

  describe('validateSQLParams', () => {
    test('should validate matching parameter counts', () => {
      expect(validateSQLParams('SELECT * FROM users WHERE id = ?', [1])).toBe(true);
      expect(validateSQLParams('INSERT INTO users (name, age) VALUES (?, ?)', ['John', 25])).toBe(true);
    });

    test('should reject mismatched parameter counts', () => {
      expect(validateSQLParams('SELECT * FROM users WHERE id = ?', [])).toBe(false);
      expect(validateSQLParams('SELECT * FROM users WHERE id = ? AND name = ?', [1])).toBe(false);
    });

    test('should handle queries without parameters', () => {
      expect(validateSQLParams('SELECT * FROM users', [])).toBe(true);
    });
  });

  describe('validateTableName', () => {
    test('should accept valid table names', () => {
      expect(validateTableName('users')).toBe(true);
      expect(validateTableName('user_profiles')).toBe(true);
      expect(validateTableName('_temp')).toBe(true);
      expect(validateTableName('Table123')).toBe(true);
    });

    test('should reject invalid table names', () => {
      expect(validateTableName('123users')).toBe(false); // 숫자로 시작
      expect(validateTableName('user-profiles')).toBe(false); // 하이픈 포함
      expect(validateTableName('user profiles')).toBe(false); // 공백 포함
      expect(validateTableName('')).toBe(false); // 빈 문자열
    });

    test('should reject overly long table names', () => {
      const longName = 'a'.repeat(65);
      expect(validateTableName(longName)).toBe(false);
    });
  });

  describe('validateColumnName', () => {
    test('should use same rules as table names', () => {
      expect(validateColumnName('user_id')).toBe(true);
      expect(validateColumnName('123invalid')).toBe(false);
    });
  });

  describe('basicSQLInjectionCheck', () => {
    test('should pass safe queries', () => {
      expect(basicSQLInjectionCheck('SELECT * FROM users WHERE id = ?')).toBe(true);
      expect(basicSQLInjectionCheck('INSERT INTO users (name) VALUES (?)')).toBe(true);
    });

    test('should detect dangerous patterns', () => {
      expect(basicSQLInjectionCheck('SELECT * FROM users; DROP TABLE users;')).toBe(false);
      expect(basicSQLInjectionCheck('SELECT * FROM users UNION SELECT * FROM passwords')).toBe(false);
      expect(basicSQLInjectionCheck('SELECT * FROM users -- comment')).toBe(false);
      expect(basicSQLInjectionCheck('SELECT * FROM users /* comment */')).toBe(false);
    });
  });

  describe('TransactionBuilder', () => {
    let builder: TransactionBuilder;

    beforeEach(() => {
      builder = new TransactionBuilder();
    });

    test('should build insert operations', () => {
      builder.insert('users', { name: 'John', age: 25 });
      const operations = builder.build();

      expect(operations).toHaveLength(1);
      expect(operations[0].sql).toBe('INSERT INTO users (name, age) VALUES (?, ?)');
      expect(operations[0].params).toEqual(['John', 25]);
    });

    test('should build update operations', () => {
      builder.update('users', { name: 'Jane' }, 'id = ?', [1]);
      const operations = builder.build();

      expect(operations).toHaveLength(1);
      expect(operations[0].sql).toBe('UPDATE users SET name = ? WHERE id = ?');
      expect(operations[0].params).toEqual(['Jane', 1]);
    });

    test('should build delete operations', () => {
      builder.delete('users', 'age < ?', [18]);
      const operations = builder.build();

      expect(operations).toHaveLength(1);
      expect(operations[0].sql).toBe('DELETE FROM users WHERE age < ?');
      expect(operations[0].params).toEqual([18]);
    });

    test('should chain multiple operations', () => {
      builder
        .insert('users', { name: 'John' })
        .update('users', { active: true }, 'name = ?', ['John'])
        .delete('logs', 'created_at < ?', ['2023-01-01']);

      const operations = builder.build();
      expect(operations).toHaveLength(3);
    });

    test('should clear operations', () => {
      builder.insert('users', { name: 'John' });
      expect(builder.build()).toHaveLength(1);

      builder.clear();
      expect(builder.build()).toHaveLength(0);
    });

    test('should reject invalid table names', () => {
      expect(() => builder.insert('123invalid', { name: 'John' })).toThrow();
      expect(() => builder.update('invalid-table', { name: 'John' }, 'id = ?', [1])).toThrow();
      expect(() => builder.delete('invalid table', 'id = ?', [1])).toThrow();
    });
  });

  describe('validateQueryResult', () => {
    test('should validate SELECT results', () => {
      const selectResult = { success: true, data: [{ id: 1, name: 'John' }] };
      expect(validateQueryResult(selectResult, 'SELECT')).toBe(true);

      const emptySelectResult = { success: true, data: [] };
      expect(validateQueryResult(emptySelectResult, 'SELECT')).toBe(true);
    });

    test('should validate MODIFY results', () => {
      const modifyResult = { success: true, rowsAffected: 1 };
      expect(validateQueryResult(modifyResult, 'MODIFY')).toBe(true);

      const noRowsResult = { success: true, rowsAffected: 0 };
      expect(validateQueryResult(noRowsResult, 'MODIFY')).toBe(true);
    });

    test('should reject failed results', () => {
      const failedResult = { success: false, error: 'SQL error' };
      expect(validateQueryResult(failedResult, 'SELECT')).toBe(false);
      expect(validateQueryResult(failedResult, 'MODIFY')).toBe(false);
    });
  });

  describe('classifySQLError', () => {
    test('should classify syntax errors', () => {
      const syntaxError = new Error('syntax error near "FROM"');
      expect(classifySQLError(syntaxError)).toBe(SQLErrorType.SYNTAX_ERROR);
    });

    test('should classify table not exists errors', () => {
      const tableError = new Error('no such table: nonexistent_table');
      expect(classifySQLError(tableError)).toBe(SQLErrorType.TABLE_NOT_EXISTS);
    });

    test('should classify column not exists errors', () => {
      const columnError = new Error('no such column: nonexistent_column');
      expect(classifySQLError(columnError)).toBe(SQLErrorType.COLUMN_NOT_EXISTS);
    });

    test('should classify constraint violations', () => {
      const constraintError = new Error('UNIQUE constraint failed');
      expect(classifySQLError(constraintError)).toBe(SQLErrorType.CONSTRAINT_VIOLATION);
    });
  });

  describe('measureQueryPerformance', () => {
    test('should measure execution time', () => {
      let measuredDuration: number | undefined;
      let measuredType: string | undefined;

      const result = measureQueryPerformance(
        () => 'test result',
        'SELECT',
        (duration, type) => {
          measuredDuration = duration;
          measuredType = type;
        }
      );

      expect(result).toBe('test result');
      expect(measuredDuration).toBeGreaterThanOrEqual(0);
      expect(measuredType).toBe('SELECT');
    });

    test('should measure error execution time', () => {
      let measuredType: string | undefined;

      expect(() => {
        measureQueryPerformance(
          () => { throw new Error('test error'); },
          'INSERT',
          (_duration, type) => {
            measuredType = type;
          }
        );
      }).toThrow('test error');

      expect(measuredType).toBe('INSERT_ERROR');
    });
  });

  describe('createBatchOperations', () => {
    test('should create batch operations', () => {
      const records = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 },
        { name: 'Bob', age: 35 }
      ];

      const batches = createBatchOperations('users', records, 2);

      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(2); // 첫 번째 배치: 2개 레코드
      expect(batches[1]).toHaveLength(1); // 두 번째 배치: 1개 레코드

      expect(batches[0][0].sql).toBe('INSERT INTO users (name, age) VALUES (?, ?)');
      expect(batches[0][0].params).toEqual(['John', 25]);
    });

    test('should handle empty records', () => {
      const batches = createBatchOperations('users', []);
      expect(batches).toHaveLength(0);
    });

    test('should reject invalid table names', () => {
      expect(() => createBatchOperations('123invalid', [{ name: 'John' }])).toThrow();
    });
  });
});