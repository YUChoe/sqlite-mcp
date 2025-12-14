/**
 * MCP 서버 구현
 * Model Context Protocol을 사용하여 SQLite CRUD 도구들을 노출하는 서버
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  InitializedNotificationSchema,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';

// 도구 임포트
import {
  createTableTool,
  insertDataTool,
  selectDataTool,
  getSchemaTool,
  updateDataTool,
  deleteDataTool,
  metaCommandTool
} from '../tools/index.js';

// 테스트 도구 임포트
import { testTool } from '../tools/testTool.js';



// 스키마 변환 유틸리티 임포트
import { zodToJsonSchema } from '../utils/schemaConverter.js';

/**
 * MCP 서버 설정 인터페이스
 */
interface MCPServerConfig {
  name: string;
  version: string;
  capabilities: {
    tools: { listChanged: boolean };
  };
}

/**
 * SQLite MCP 서버 클래스
 */
export class SQLiteMCPServer {
  private server: Server;

  constructor(config: MCPServerConfig) {
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: config.capabilities,
      }
    );

    this.setupToolHandlers();
  }

  /**
   * 도구 핸들러 설정
   */
  private setupToolHandlers(): void {
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
          {
            name: createTableTool.name,
            description: createTableTool.description,
            inputSchema: zodToJsonSchema(createTableTool.inputSchema)
          },
          {
            name: insertDataTool.name,
            description: insertDataTool.description,
            inputSchema: zodToJsonSchema(insertDataTool.inputSchema)
          },
          {
            name: selectDataTool.name,
            description: selectDataTool.description,
            inputSchema: zodToJsonSchema(selectDataTool.inputSchema)
          },
          {
            name: getSchemaTool.name,
            description: getSchemaTool.description,
            inputSchema: zodToJsonSchema(getSchemaTool.inputSchema)
          },
          {
            name: updateDataTool.name,
            description: updateDataTool.description,
            inputSchema: zodToJsonSchema(updateDataTool.inputSchema)
          },
          {
            name: deleteDataTool.name,
            description: deleteDataTool.description,
            inputSchema: zodToJsonSchema(deleteDataTool.inputSchema)
          },
          {
            name: metaCommandTool.name,
            description: metaCommandTool.description,
            inputSchema: zodToJsonSchema(metaCommandTool.inputSchema)
          },
          {
            name: testTool.name,
            description: testTool.description,
            inputSchema: zodToJsonSchema(testTool.inputSchema)
          }
        ]
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;

      console.error('=== MCP Tool Call ===');
      console.error('Tool name:', name);
      console.error('Arguments:', JSON.stringify(args, null, 2));

      try {
        let result: CallToolResult;

        switch (name) {
          case 'create_table':
            result = await this.executeCreateTable(args);
            break;
          case 'insert_data':
            result = await this.executeInsertData(args);
            break;
          case 'select_data':
            result = await this.executeSelectData(args);
            break;
          case 'get_schema':
            result = await this.executeGetSchema(args);
            break;
          case 'update_data':
            result = await this.executeUpdateData(args);
            break;
          case 'delete_data':
            result = await this.executeDeleteData(args);
            break;
          case 'meta_commands':
            result = await this.executeMetaCommands(args);
            break;
          case 'test_tool':
            result = await this.executeTestTool(args);
            break;
          default:
            result = {
              content: [{
                type: 'text' as const,
                text: `알 수 없는 도구: ${name}`
              }]
            };
        }

        console.error('=== Final Result ===');
        console.error('Result:', JSON.stringify(result, null, 2));
        console.error('Content length:', result.content?.length);
        console.error('First content item:', JSON.stringify(result.content?.[0], null, 2));

        // 결과 검증 및 보정
        if (!result.content || !Array.isArray(result.content)) {
          console.error('ERROR: Invalid content structure');
          return {
            content: [{
              type: 'text' as const,
              text: 'Internal error: Invalid content structure'
            }]
          };
        }

        // 각 content 항목 검증
        const validatedContent = result.content.map((item, index) => {
          console.error(`Validating content item ${index}:`, JSON.stringify(item, null, 2));

          if (!item || typeof item !== 'object') {
            console.error(`ERROR: Content item ${index} is not an object`);
            return { type: 'text' as const, text: 'Invalid content item' };
          }

          if (item.type !== 'text') {
            console.error(`ERROR: Content item ${index} type is not 'text':`, item.type);
            return { type: 'text' as const, text: 'Invalid content type' };
          }

          if (typeof item.text !== 'string') {
            console.error(`ERROR: Content item ${index} text is not a string:`, typeof item.text, item.text);
            return { type: 'text' as const, text: String(item.text || 'Empty text') };
          }

          return { type: 'text' as const, text: item.text };
        });

        const finalResult = { content: validatedContent };
        console.error('=== Validated Final Result ===');
        console.error('Final result:', JSON.stringify(finalResult, null, 2));

        return finalResult;

      } catch (error) {
        console.error('=== Tool Execution Error ===');
        console.error('Error:', error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        return {
          content: [{
            type: 'text' as const,
            text: `도구 실행 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    });
  }

  /**
   * 테이블 생성 도구 실행
   */
  private async executeCreateTable(args: any): Promise<CallToolResult> {
    console.error('executeCreateTable called with args:', JSON.stringify(args));
    const { createTable } = await import('../tools/createTable.js');
    const result = await createTable(args);
    console.error('executeCreateTable result:', JSON.stringify(result));
    console.error('executeCreateTable result.content:', JSON.stringify(result.content));
    console.error('executeCreateTable result.content[0]:', JSON.stringify(result.content?.[0]));
    console.error('executeCreateTable result.content[0].text:', result.content?.[0]?.text);

    // 명시적으로 CallToolResult 형식으로 반환 (타입 리터럴 사용)
    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 데이터 삽입 도구 실행
   */
  private async executeInsertData(args: any): Promise<CallToolResult> {
    console.error('executeInsertData called with args:', JSON.stringify(args));
    const { insertData } = await import('../tools/insertData.js');
    const result = await insertData(args);
    console.error('executeInsertData result:', JSON.stringify(result));

    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 데이터 조회 도구 실행
   */
  private async executeSelectData(args: any): Promise<CallToolResult> {
    console.error('executeSelectData called with args:', JSON.stringify(args));
    const { selectData } = await import('../tools/selectData.js');
    const result = await selectData(args);
    console.error('executeSelectData result:', JSON.stringify(result));

    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 스키마 정보 조회 도구 실행
   */
  private async executeGetSchema(args: any): Promise<CallToolResult> {
    console.error('executeGetSchema called with args:', JSON.stringify(args));
    const { getSchema } = await import('../tools/getSchema.js');
    const result = await getSchema(args);
    console.error('executeGetSchema result:', JSON.stringify(result));
    console.error('executeGetSchema result.content:', JSON.stringify(result.content));
    console.error('executeGetSchema result.content[0]:', JSON.stringify(result.content?.[0]));
    console.error('executeGetSchema result.content[0].text:', result.content?.[0]?.text);

    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 데이터 업데이트 도구 실행
   */
  private async executeUpdateData(args: any): Promise<CallToolResult> {
    console.error('executeUpdateData called with args:', JSON.stringify(args));
    const { updateData } = await import('../tools/updateData.js');
    const result = await updateData(args);
    console.error('executeUpdateData result:', JSON.stringify(result));

    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 데이터 삭제 도구 실행
   */
  private async executeDeleteData(args: any): Promise<CallToolResult> {
    console.error('executeDeleteData called with args:', JSON.stringify(args));
    const { deleteData } = await import('../tools/deleteData.js');
    const result = await deleteData(args);
    console.error('executeDeleteData result:', JSON.stringify(result));

    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 메타 명령 도구 실행
   */
  private async executeMetaCommands(args: any): Promise<CallToolResult> {
    console.error('executeMetaCommands called with args:', JSON.stringify(args));
    const { executeMetaCommand } = await import('../tools/metaCommands.js');
    const result = await executeMetaCommand(args);
    console.error('executeMetaCommands result:', JSON.stringify(result));

    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 테스트 도구 실행
   */
  private async executeTestTool(args: any): Promise<CallToolResult> {
    console.error('executeTestTool called with args:', JSON.stringify(args));
    const { testFunction } = await import('../tools/testTool.js');
    const result = await testFunction(args);
    console.error('executeTestTool result:', JSON.stringify(result));

    return {
      content: result.content.map(item => ({
        type: 'text' as const,
        text: item.text || ''
      }))
    };
  }

  /**
   * 서버 시작 (Stdio 전송 사용)
   */
  async start(): Promise<void> {
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
  async stop(): Promise<void> {
    await this.server.close();
    console.error('SQLite MCP 서버가 종료되었습니다');
  }

  /**
   * 서버 인스턴스 반환
   */
  getServer(): Server {
    return this.server;
  }
}

/**
 * 기본 MCP 서버 설정
 */
export const defaultConfig: MCPServerConfig = {
  name: 'sqlite-mcp-server',
  version: '1.0.0',
  capabilities: {
    tools: { listChanged: true }
  }
};