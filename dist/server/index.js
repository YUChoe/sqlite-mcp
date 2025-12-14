/**
 * MCP 서버 진입점
 * SQLite MCP 서버를 시작하는 메인 파일
 */
import { SQLiteMCPServer, defaultConfig } from './MCPServer.js';
import { createStdioTransport } from './transport/index.js';
/**
 * 메인 함수 - MCP 서버 시작
 */
async function main() {
    try {
        const server = new SQLiteMCPServer(defaultConfig);
        const transport = createStdioTransport(server);
        // 프로세스 종료 시 정리 작업
        process.on('SIGINT', async () => {
            console.error('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
            await transport.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.error('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
            await transport.stop();
            process.exit(0);
        });
        // 서버 시작
        await transport.start();
    }
    catch (error) {
        console.error('서버 시작 중 오류 발생:', error);
        process.exit(1);
    }
}
// 메인 함수 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('예상치 못한 오류:', error);
        process.exit(1);
    });
}
export { SQLiteMCPServer, defaultConfig } from './MCPServer.js';
//# sourceMappingURL=index.js.map