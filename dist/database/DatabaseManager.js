/**
 * SQLite 데이터베이스 연결 관리자
 * 여러 데이터베이스 파일에 대한 연결을 관리하고 캐싱합니다.
 */
import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
/**
 * SQLite 데이터베이스 매니저 구현
 */
export class DatabaseManager {
    connections = new Map();
    maxConnections = 50;
    connectionTimeout = 30 * 60 * 1000; // 30분
    /**
     * 데이터베이스 연결 가져오기
     */
    getDatabase(dbPath) {
        const normalizedPath = this.validateAndNormalizePath(dbPath);
        const existingDb = this.connections.get(normalizedPath);
        if (existingDb) {
            existingDb.lastAccessed = new Date();
            return existingDb;
        }
        if (this.connections.size >= this.maxConnections) {
            this.cleanupOldConnections();
        }
        const database = this.createNewConnection(normalizedPath);
        this.connections.set(normalizedPath, database);
        return database;
    }
    /**
     * 특정 데이터베이스 연결 닫기
     */
    closeDatabase(dbPath) {
        const normalizedPath = this.validateAndNormalizePath(dbPath);
        const database = this.connections.get(normalizedPath);
        if (database) {
            database.connection.close();
            this.connections.delete(normalizedPath);
        }
    }
    /**
     * 모든 데이터베이스 연결 닫기
     */
    closeAllDatabases() {
        for (const [, database] of this.connections) {
            database.connection.close();
        }
        this.connections.clear();
    }
    /**
     * SQL 쿼리 실행
     */
    async executeQuery(dbPath, sql, params = []) {
        try {
            const database = this.getDatabase(dbPath);
            return new Promise((resolve) => {
                const sqlLower = sql.trim().toLowerCase();
                if (sqlLower.startsWith('select') || sqlLower.startsWith('pragma')) {
                    database.connection.all(sql, params, (err, rows) => {
                        if (err) {
                            resolve({
                                success: false,
                                error: err.message
                            });
                        }
                        else {
                            resolve({
                                success: true,
                                data: rows
                            });
                        }
                    });
                }
                else {
                    database.connection.run(sql, params, function (err) {
                        if (err) {
                            resolve({
                                success: false,
                                error: err.message
                            });
                        }
                        else {
                            const result = {
                                success: true,
                                rowsAffected: this.changes
                            };
                            if (this.lastID) {
                                result.lastInsertRowid = this.lastID;
                            }
                            resolve(result);
                        }
                    });
                }
            });
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * 트랜잭션 실행
     */
    async executeTransaction(dbPath, operations) {
        const database = this.getDatabase(dbPath);
        const results = [];
        try {
            await new Promise((resolve, reject) => {
                database.connection.exec('BEGIN TRANSACTION', (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            for (const operation of operations) {
                const result = await this.executeQuery(dbPath, operation.sql, operation.params);
                results.push(result);
                if (!result.success) {
                    await new Promise((resolve) => {
                        database.connection.exec('ROLLBACK', () => resolve());
                    });
                    return {
                        success: false,
                        results,
                        error: result.error || '알 수 없는 오류가 발생했습니다'
                    };
                }
            }
            await new Promise((resolve, reject) => {
                database.connection.exec('COMMIT', (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            return {
                success: true,
                results
            };
        }
        catch (error) {
            await new Promise((resolve) => {
                database.connection.exec('ROLLBACK', () => resolve());
            });
            return {
                success: false,
                results,
                error: error.message
            };
        }
    }
    /**
     * 경로 검증 및 정규화
     */
    validateAndNormalizePath(dbPath) {
        if (!dbPath || typeof dbPath !== 'string') {
            throw new Error('데이터베이스 경로가 유효하지 않습니다');
        }
        if (dbPath.includes('..')) {
            throw new Error('상위 디렉토리 접근은 허용되지 않습니다');
        }
        return path.resolve(dbPath);
    }
    /**
     * 새 데이터베이스 연결 생성
     */
    createNewConnection(dbPath) {
        try {
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const connection = new sqlite3.Database(dbPath);
            connection.exec('PRAGMA journal_mode = WAL');
            return {
                path: dbPath,
                connection,
                lastAccessed: new Date()
            };
        }
        catch (error) {
            throw new Error(`데이터베이스 연결 실패: ${error.message}`);
        }
    }
    /**
     * 오래된 연결 정리
     */
    cleanupOldConnections() {
        const now = new Date();
        const connectionsToRemove = [];
        for (const [path, database] of this.connections) {
            const timeDiff = now.getTime() - database.lastAccessed.getTime();
            if (timeDiff > this.connectionTimeout) {
                connectionsToRemove.push(path);
            }
        }
        connectionsToRemove.forEach(dbPath => {
            const database = this.connections.get(dbPath);
            if (database) {
                database.connection.close();
                this.connections.delete(dbPath);
            }
        });
        if (this.connections.size >= this.maxConnections) {
            const oldestEntry = Array.from(this.connections.entries())
                .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime())[0];
            if (oldestEntry) {
                const [dbPath, database] = oldestEntry;
                database.connection.close();
                this.connections.delete(dbPath);
            }
        }
    }
}
//# sourceMappingURL=DatabaseManager.js.map