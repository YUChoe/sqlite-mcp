/**
 * MCP 서버 구현
 * Model Context Protocol을 사용하여 SQLite CRUD 도구들을 노출하는 서버
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, InitializeRequestSchema, InitializedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
// 도구 임포트
import { createTableTool, insertDataTool, selectDataTool, getSchemaTool, updateDataTool, deleteDataTool, metaCommandsTool } from '../tools/index.js';
// 오류 처리 임포트
import { ErrorHandler } from './ErrorHandler.js';
/**
 * SQLite MCP 서버 클래스
 */
export class SQLiteMCPServer {
    server;
    constructor(config) {
        this.server = new Server({
            name: config.name,
            version: config.version,
        }, {
            capabilities: config.capabilities,
        });
        this.setupToolHandlers();
    }
    /**
     * 도구 핸들러 설정
     */
    setupToolHandlers() {
        // 초기화 핸들러
        this.server.setRequestHandler(InitializeRequestSchema, async () => {
            return {
                protocolVersion: "2024-11-05",
                capabilities: {
                    tools: { listChanged: true }
                },
                serverInfo: {
                    name: "sqlite-mcp",
                    version: "1.0.0"
                }
            };
        });
        // 초기화 완료 알림 핸들러
        this.server.setNotificationHandler(InitializedNotificationSchema, async () => {
            // 초기화 완료 처리 (필요시)
        });
        // 사용 가능한 도구 목록 반환
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    createTableTool,
                    insertDataTool,
                    selectDataTool,
                    getSchemaTool,
                    updateDataTool,
                    deleteDataTool,
                    metaCommandsTool
                ]
            };
        });
        // 도구 실행 핸들러
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'create_table':
                        return await this.executeCreateTable(args);
                    case 'insert_data':
                        return await this.executeInsertData(args);
                    case 'select_data':
                        return await this.executeSelectData(args);
                    case 'get_schema':
                        return await this.executeGetSchema(args);
                    case 'update_data':
                        return await this.executeUpdateData(args);
                    case 'delete_data':
                        return await this.executeDeleteData(args);
                    case 'meta_commands':
                        return await this.executeMetaCommands(args);
                    default:
                        throw new Error(`알 수 없는 도구: ${name}`);
                }
            }
            catch (error) {
                // 통합 오류 처리 시스템 사용
                const errorResponse = ErrorHandler.handleGenericError(error, {
                    tool: name,
                    path: args?.dbPath,
                    query: args?.query
                });
                // 오류 로깅
                if (error instanceof Error) {
                    const mcpError = ErrorHandler.handleMCPError(error, { tool: name, args });
                    ErrorHandler.logError(mcpError, { tool: name, args });
                }
                return errorResponse;
            }
        });
    }
    /**
     * 테이블 생성 도구 실행
     */
    async executeCreateTable(args) {
        try {
            const { createTable } = await import('../tools/createTable.js');
            const result = await createTable(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return ErrorHandler.handleGenericError(error, {
                path: args?.dbPath,
                tool: 'create_table'
            });
        }
    }
    /**
     * 데이터 삽입 도구 실행
     */
    async executeInsertData(args) {
        try {
            const { insertData } = await import('../tools/insertData.js');
            const result = await insertData(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return ErrorHandler.handleGenericError(error, {
                path: args?.dbPath,
                tool: 'insert_data'
            });
        }
    }
    /**
     * 데이터 조회 도구 실행
     */
    async executeSelectData(args) {
        try {
            const { selectData } = await import('../tools/selectData.js');
            const result = await selectData(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return ErrorHandler.handleGenericError(error, {
                path: args?.dbPath,
                query: args?.query,
                tool: 'select_data'
            });
        }
    }
    /**
     * 스키마 정보 조회 도구 실행
     */
    async executeGetSchema(args) {
        try {
            const { getSchema } = await import('../tools/getSchema.js');
            const result = await getSchema(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return ErrorHandler.handleGenericError(error, {
                path: args?.dbPath,
                tool: 'get_schema'
            });
        }
    }
    /**
     * 데이터 업데이트 도구 실행
     */
    async executeUpdateData(args) {
        try {
            const { updateData } = await import('../tools/updateData.js');
            const result = await updateData(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return ErrorHandler.handleGenericError(error, {
                path: args?.dbPath,
                query: args?.query,
                tool: 'update_data'
            });
        }
    }
    /**
     * 데이터 삭제 도구 실행
     */
    async executeDeleteData(args) {
        try {
            const { deleteData } = await import('../tools/deleteData.js');
            const result = await deleteData(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return ErrorHandler.handleGenericError(error, {
                path: args?.dbPath,
                query: args?.query,
                tool: 'delete_data'
            });
        }
    }
    /**
     * 메타 명령 도구 실행
     */
    async executeMetaCommands(args) {
        try {
            const { executeMetaCommand } = await import('../tools/metaCommands.js');
            const result = await executeMetaCommand(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return ErrorHandler.handleGenericError(error, {
                path: args?.dbPath,
                tool: 'meta_commands'
            });
        }
    }
    /**
     * 서버 시작 (Stdio 전송 사용)
     */
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('SQLite MCP 서버가 시작되었습니다');
        // 서버가 무한 대기 상태를 유지하도록 함
        return new Promise(() => {
            // 이 Promise는 절대 resolve되지 않아 서버가 계속 실행됨
        });
    }
    /**
     * 서버 종료
     */
    async stop() {
        await this.server.close();
        console.error('SQLite MCP 서버가 종료되었습니다');
    }
    /**
     * 서버 인스턴스 반환
     */
    getServer() {
        return this.server;
    }
}
/**
 * 기본 MCP 서버 설정
 */
export const defaultConfig = {
    name: 'sqlite-mcp-server',
    version: '1.0.0',
    capabilities: {
        tools: { listChanged: true }
    }
};
//# sourceMappingURL=MCPServer.js.map