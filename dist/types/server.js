/**
 * MCP 서버 관련 타입 정의
 */
/**
 * 서버 상태
 */
export var ServerState;
(function (ServerState) {
    ServerState["STOPPED"] = "stopped";
    ServerState["STARTING"] = "starting";
    ServerState["RUNNING"] = "running";
    ServerState["STOPPING"] = "stopping";
    ServerState["ERROR"] = "error";
})(ServerState || (ServerState = {}));
//# sourceMappingURL=server.js.map