/**
 * SQLite MCP 서버 도구 모음
 */

// Create 작업 도구
import { createTableTool } from './createTable';
import { insertDataTool } from './insertData';

// Read 작업 도구
import { selectDataTool } from './selectData';
import { getSchemaTool } from './getSchema';

// Update 작업 도구
import { updateDataTool } from './updateData';

// Delete 작업 도구
import { deleteDataTool } from './deleteData';

// Meta 명령 도구
import { metaCommandsTool } from './metaCommands';

// 개별 도구 export
export { createTableTool } from './createTable';
export { insertDataTool } from './insertData';
export { selectDataTool } from './selectData';
export { getSchemaTool } from './getSchema';
export { updateDataTool } from './updateData';
export { deleteDataTool } from './deleteData';
export { metaCommandsTool } from './metaCommands';

// 모든 Create 도구를 배열로 내보내기
export const createTools = [
  createTableTool,
  insertDataTool
];

// 모든 Read 도구를 배열로 내보내기
export const readTools = [
  selectDataTool,
  getSchemaTool
];

// 모든 Update 도구를 배열로 내보내기
export const updateTools = [
  updateDataTool
];

// 모든 Delete 도구를 배열로 내보내기
export const deleteTools = [
  deleteDataTool
];

// 모든 Meta 명령 도구를 배열로 내보내기
export const metaTools = [
  metaCommandsTool
];