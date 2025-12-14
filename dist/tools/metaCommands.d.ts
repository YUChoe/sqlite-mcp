/**
 * SQLite 메타 명령 도구
 * .tables, .schema, .indexes, .pragma 등의 SQLite 메타 명령을 처리합니다.
 */
import type { MetaCommandInput, MetaResultOutput } from '../types/schemas.js';
import type { ToolDefinition } from '../types/index.js';
/**
 * SQLite 메타 명령 도구
 */
export declare const metaCommandsTool: ToolDefinition;
/**
 * 메타 명령 실행 함수 (MCP 서버에서 직접 호출용)
 */
export declare function executeMetaCommand(params: MetaCommandInput): Promise<MetaResultOutput>;
//# sourceMappingURL=metaCommands.d.ts.map