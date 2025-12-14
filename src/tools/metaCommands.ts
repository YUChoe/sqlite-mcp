/**
 * SQLite 메타 명령 도구
 * .tables, .schema, .indexes, .pragma 등의 SQLite 메타 명령을 처리합니다.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { MetaCommandSchema, MetaResultSchema } from '../types/schemas';
import type { MetaCommandInput, MetaResultOutput } from '../types/schemas';
import type { ToolDefinition, ToolResult } from '../types/index';

/**
 * SQLite 메타 명령 도구
 */
export const metaCommandsTool: ToolDefinition = {
  name: 'meta_commands',
  description: 'SQLite 메타 명령(.tables, .schema, .indexes, .pragma)을 실행하여 데이터베이스 구조 정보를 조회합니다.',
  inputSchema: MetaCommandSchema,
  outputSchema: MetaResultSchema,
  handler: metaCommandsHandler
};

/**
 * 메타 명령 핸들러
 */
async function metaCommandsHandler(params: MetaCommandInput): Promise<ToolResult> {
  try {
    // 입력 검증
    const validatedParams = MetaCommandSchema.parse(params);
    const { dbPath, command, target } = validatedParams;

    // 데이터베이스 매니저 인스턴스 생성
    const dbManager = new DatabaseManager();

    let result: MetaResultOutput;

    // 명령에 따라 처리
    switch (command) {
      case '.tables':
        result = await executeTablesCommand(dbManager, dbPath);
        break;
      case '.schema':
        result = await executeSchemaCommand(dbManager, dbPath, target);
        break;
      case '.indexes':
        result = await executeIndexesCommand(dbManager, dbPath, target);
        break;
      case '.pragma':
        result = await executePragmaCommand(dbManager, dbPath, target);
        break;
      default:
        result = {
          success: false,
          result: '',
          error: `지원하지 않는 명령입니다: ${command}`
        };
    }

    // 결과 검증 및 반환
    const validatedResult = MetaResultSchema.parse(result);

    return {
      content: [{ type: 'text', text: JSON.stringify(validatedResult, null, 2) }],
      structuredContent: validatedResult
    };

  } catch (error) {
    const result: MetaResultOutput = {
      success: false,
      result: '',
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result
    };
  }
}

/**
 * .tables 명령 실행 - 모든 테이블과 뷰 목록 반환
 */
async function executeTablesCommand(dbManager: DatabaseManager, dbPath: string): Promise<MetaResultOutput> {
  try {
    const query = `
      SELECT name, type
      FROM sqlite_master
      WHERE type IN ('table', 'view')
        AND name NOT LIKE 'sqlite_%'
      ORDER BY type, name
    `;

    const queryResult = dbManager.executeQuery(dbPath, query);

    if (!queryResult.success) {
      return {
        success: false,
        result: '',
        error: queryResult.error || '.tables 명령 실행에 실패했습니다'
      };
    }

    // 결과를 SQLite CLI와 유사한 형식으로 포맷
    const items = queryResult.data || [];
    const result = items.map(item => `${item.name} (${item.type})`).join('\n');

    return {
      success: true,
      result: result || '테이블이나 뷰가 없습니다'
    };

  } catch (error) {
    return {
      success: false,
      result: '',
      error: error instanceof Error ? error.message : '.tables 명령 실행 중 오류가 발생했습니다'
    };
  }
}
/**
 * .schema 명령 실행 - 데이터베이스 또는 특정 테이블의 DDL 스키마 반환
 */
async function executeSchemaCommand(dbManager: DatabaseManager, dbPath: string, target?: string): Promise<MetaResultOutput> {
  try {
    let query: string;
    let params: any[] = [];

    if (target) {
      // 특정 테이블의 스키마
      query = `
        SELECT sql
        FROM sqlite_master
        WHERE type IN ('table', 'view', 'index', 'trigger')
          AND (tbl_name = ? OR name = ?)
          AND sql IS NOT NULL
        ORDER BY type, name
      `;
      params = [target, target];
    } else {
      // 전체 데이터베이스 스키마
      query = `
        SELECT sql
        FROM sqlite_master
        WHERE type IN ('table', 'view', 'index', 'trigger')
          AND name NOT LIKE 'sqlite_%'
          AND sql IS NOT NULL
        ORDER BY type, name
      `;
    }

    const queryResult = dbManager.executeQuery(dbPath, query, params);

    if (!queryResult.success) {
      return {
        success: false,
        result: '',
        error: queryResult.error || '.schema 명령 실행에 실패했습니다'
      };
    }

    // DDL 문들을 결합
    const schemas = queryResult.data || [];
    const result = schemas
      .map(row => row.sql)
      .filter(sql => sql) // null 값 제거
      .join(';\n\n') + (schemas.length > 0 ? ';' : '');

    return {
      success: true,
      result: result || (target ? `테이블 '${target}'의 스키마를 찾을 수 없습니다` : '스키마가 없습니다')
    };

  } catch (error) {
    return {
      success: false,
      result: '',
      error: error instanceof Error ? error.message : '.schema 명령 실행 중 오류가 발생했습니다'
    };
  }
}

/**
 * .indexes 명령 실행 - 모든 인덱스 정보 반환
 */
async function executeIndexesCommand(dbManager: DatabaseManager, dbPath: string, target?: string): Promise<MetaResultOutput> {
  try {
    let query: string;
    let params: any[] = [];

    if (target) {
      // 특정 테이블의 인덱스
      query = `
        SELECT name, tbl_name, sql
        FROM sqlite_master
        WHERE type = 'index'
          AND tbl_name = ?
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `;
      params = [target];
    } else {
      // 모든 인덱스
      query = `
        SELECT name, tbl_name, sql
        FROM sqlite_master
        WHERE type = 'index'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY tbl_name, name
      `;
    }

    const queryResult = dbManager.executeQuery(dbPath, query, params);

    if (!queryResult.success) {
      return {
        success: false,
        result: '',
        error: queryResult.error || '.indexes 명령 실행에 실패했습니다'
      };
    }

    // 인덱스 정보를 포맷
    const indexes = queryResult.data || [];
    const result = indexes
      .map(idx => `${idx.name} on ${idx.tbl_name}${idx.sql ? `\n  ${idx.sql}` : ''}`)
      .join('\n\n');

    return {
      success: true,
      result: result || (target ? `테이블 '${target}'에 인덱스가 없습니다` : '인덱스가 없습니다')
    };

  } catch (error) {
    return {
      success: false,
      result: '',
      error: error instanceof Error ? error.message : '.indexes 명령 실행 중 오류가 발생했습니다'
    };
  }
}

/**
 * .pragma 명령 실행 - 데이터베이스 설정 정보 반환
 */
async function executePragmaCommand(dbManager: DatabaseManager, dbPath: string, target?: string): Promise<MetaResultOutput> {
  try {
    let query: string;

    if (target) {
      // 특정 PRAGMA 명령
      query = `PRAGMA ${target}`;
    } else {
      // 주요 PRAGMA 정보들을 조회
      const pragmas = [
        'database_list',
        'table_list',
        'foreign_key_list',
        'index_list',
        'user_version',
        'schema_version',
        'page_size',
        'cache_size',
        'journal_mode',
        'synchronous',
        'foreign_keys'
      ];

      const results: string[] = [];

      for (const pragma of pragmas) {
        try {
          const pragmaResult = dbManager.executeQuery(dbPath, `PRAGMA ${pragma}`);
          if (pragmaResult.success && pragmaResult.data) {
            const data = pragmaResult.data;
            if (data.length > 0) {
              results.push(`${pragma}:`);
              data.forEach(row => {
                const values = Object.values(row).join(' | ');
                results.push(`  ${values}`);
              });
              results.push('');
            }
          }
        } catch (pragmaError) {
          // 개별 PRAGMA 오류는 무시하고 계속 진행
          continue;
        }
      }

      return {
        success: true,
        result: results.join('\n').trim() || 'PRAGMA 정보를 조회할 수 없습니다'
      };
    }

    const queryResult = dbManager.executeQuery(dbPath, query);

    if (!queryResult.success) {
      return {
        success: false,
        result: '',
        error: queryResult.error || '.pragma 명령 실행에 실패했습니다'
      };
    }

    // PRAGMA 결과를 포맷
    const data = queryResult.data || [];
    const result = data
      .map(row => Object.values(row).join(' | '))
      .join('\n');

    return {
      success: true,
      result: result || 'PRAGMA 결과가 없습니다'
    };

  } catch (error) {
    return {
      success: false,
      result: '',
      error: error instanceof Error ? error.message : '.pragma 명령 실행 중 오류가 발생했습니다'
    };
  }
}