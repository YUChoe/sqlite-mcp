/**
 * SQLite 메타 명령어 도구
 * .tables, .schema, .indexes, .pragma 등의 SQLite 메타 명령어를 구현합니다.
 */
import { DatabaseManager } from '../database/DatabaseManager.js';
import { MetaCommandSchema } from '../types/schemas.js';
/**
 * 메타 명령어 도구 정의
 */
export const metaCommandTool = {
    name: 'meta_command',
    description: 'SQLite 메타 명령어(.tables, .schema, .indexes, .pragma)를 실행합니다',
    inputSchema: MetaCommandSchema,
    handler: metaCommandHandler
};
/**
 * 메타 명령어 핸들러
 */
async function metaCommandHandler(params) {
    const dbManager = new DatabaseManager();
    try {
        // 입력 검증
        const validatedInput = MetaCommandSchema.parse(params);
        const { dbPath, command, target } = validatedInput;
        let result;
        switch (command) {
            case '.tables':
                result = await handleTablesCommand(dbManager, dbPath);
                break;
            case '.schema':
                result = await handleSchemaCommand(dbManager, dbPath, target);
                break;
            case '.indexes':
                result = await handleIndexesCommand(dbManager, dbPath, target);
                break;
            case '.pragma':
                result = await handlePragmaCommand(dbManager, dbPath, target);
                break;
            default:
                result = {
                    success: false,
                    result: '',
                    error: `지원하지 않는 명령어입니다: ${command}`
                };
        }
        return {
            content: [{
                    type: 'text',
                    text: result.success ? result.result : `오류: ${result.error}`
                }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
        return {
            content: [{
                    type: 'text',
                    text: `메타 명령어 실행 중 오류 발생: ${errorMessage}`
                }]
        };
    }
}
/**
 * .tables 명령어 처리
 */
async function handleTablesCommand(dbManager, dbPath) {
    const query = `
    SELECT name, type
    FROM sqlite_master
    WHERE type IN ('table', 'view')
      AND name NOT LIKE 'sqlite_%'
    ORDER BY type, name
  `;
    const queryResult = await dbManager.executeQuery(dbPath, query);
    if (!queryResult.success) {
        return {
            success: false,
            result: '',
            error: queryResult.error || '.tables 명령 실행에 실패했습니다'
        };
    }
    const tables = queryResult.data || [];
    if (tables.length === 0) {
        return {
            success: true,
            result: '테이블이 없습니다.'
        };
    }
    const result = tables
        .map((row) => `${row.name} (${row.type})`)
        .join('\n');
    return {
        success: true,
        result
    };
}
/**
 * .schema 명령어 처리
 */
async function handleSchemaCommand(dbManager, dbPath, target) {
    let query;
    let params = [];
    if (target) {
        // 특정 테이블/뷰의 스키마
        query = `
      SELECT sql
      FROM sqlite_master
      WHERE name = ?
        AND type IN ('table', 'view', 'index', 'trigger')
        AND sql IS NOT NULL
    `;
        params = [target];
    }
    else {
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
    const queryResult = await dbManager.executeQuery(dbPath, query, params);
    if (!queryResult.success) {
        return {
            success: false,
            result: '',
            error: queryResult.error || '.schema 명령 실행에 실패했습니다'
        };
    }
    const schemas = queryResult.data || [];
    if (schemas.length === 0) {
        const message = target
            ? `'${target}'에 대한 스키마를 찾을 수 없습니다.`
            : '스키마가 없습니다.';
        return {
            success: true,
            result: message
        };
    }
    const result = schemas
        .map((row) => row.sql)
        .filter(Boolean)
        .join(';\n\n') + ';';
    return {
        success: true,
        result
    };
}
/**
 * .indexes 명령어 처리
 */
async function handleIndexesCommand(dbManager, dbPath, target) {
    let query;
    let params = [];
    if (target) {
        // 특정 테이블의 인덱스
        query = `
      SELECT name, sql
      FROM sqlite_master
      WHERE type = 'index'
        AND tbl_name = ?
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;
        params = [target];
    }
    else {
        // 모든 인덱스
        query = `
      SELECT name, tbl_name, sql
      FROM sqlite_master
      WHERE type = 'index'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `;
    }
    const queryResult = await dbManager.executeQuery(dbPath, query, params);
    if (!queryResult.success) {
        return {
            success: false,
            result: '',
            error: queryResult.error || '.indexes 명령 실행에 실패했습니다'
        };
    }
    const indexes = queryResult.data || [];
    if (indexes.length === 0) {
        const message = target
            ? `'${target}' 테이블에 인덱스가 없습니다.`
            : '인덱스가 없습니다.';
        return {
            success: true,
            result: message
        };
    }
    const result = indexes
        .map((row) => {
        if (target) {
            return `${row.name}: ${row.sql || 'AUTO INDEX'}`;
        }
        else {
            return `${row.tbl_name}.${row.name}: ${row.sql || 'AUTO INDEX'}`;
        }
    })
        .join('\n');
    return {
        success: true,
        result
    };
}
/**
 * .pragma 명령어 처리
 */
async function handlePragmaCommand(dbManager, dbPath, target) {
    if (!target) {
        return {
            success: false,
            result: '',
            error: 'PRAGMA 명령어에는 대상이 필요합니다 (예: user_version, table_info(테이블명))'
        };
    }
    try {
        const query = `PRAGMA ${target}`;
        const queryResult = await dbManager.executeQuery(dbPath, query);
        if (!queryResult.success) {
            return {
                success: false,
                result: '',
                error: queryResult.error || 'PRAGMA 명령 실행에 실패했습니다'
            };
        }
        const data = queryResult.data || [];
        if (data.length === 0) {
            return {
                success: true,
                result: '결과가 없습니다.'
            };
        }
        // 결과를 포맷팅
        const result = data
            .map((row) => {
            const values = Object.values(row);
            return values.join(' | ');
        })
            .join('\n');
        return {
            success: true,
            result
        };
    }
    catch (error) {
        return {
            success: false,
            result: '',
            error: error instanceof Error ? error.message : 'PRAGMA 명령 실행에 실패했습니다'
        };
    }
}
/**
 * 메타 명령어 실행 함수 (MCP 서버에서 직접 호출용)
 */
export async function executeMetaCommand(params) {
    return await metaCommandHandler(params);
}
//# sourceMappingURL=metaCommands.js.map