/**
 * Stdio 전송 계층 구현
 * 표준 입출력을 통한 MCP 통신
 */
/**
 * Stdio 전송 클래스
 */
export class StdioTransport {
    server;
    constructor(config) {
        this.server = config.server;
    }
    /**
     * Stdio 전송 시작
     */
    async start() {
        try {
            await this.server.start();
            console.error('Stdio 전송이 시작되었습니다');
        }
        catch (error) {
            console.error('Stdio 전송 시작 실패:', error);
            throw error;
        }
    }
    /**
     * Stdio 전송 중지
     */
    async stop() {
        try {
            await this.server.stop();
            console.error('Stdio 전송이 중지되었습니다');
        }
        catch (error) {
            console.error('Stdio 전송 중지 실패:', error);
            throw error;
        }
    }
}
/**
 * Stdio 전송 팩토리 함수
 */
export function createStdioTransport(server) {
    return new StdioTransport({ server });
}
//# sourceMappingURL=StdioTransport.js.map