/**
 * Zod 스키마 정의
 * MCP 도구의 입력/출력 검증을 위한 스키마들
 */
import { z } from 'zod';
/**
 * 데이터베이스 경로 스키마
 */
export declare const DatabasePathSchema: z.ZodString;
/**
 * 테이블 이름 스키마
 */
export declare const TableNameSchema: z.ZodString;
/**
 * SQL 쿼리 스키마
 */
export declare const SQLQuerySchema: z.ZodString;
/**
 * 쿼리 파라미터 스키마
 */
export declare const QueryParamsSchema: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
/**
 * 테이블 컬럼 정의 스키마
 */
export declare const ColumnDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    constraints: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    constraints?: string | undefined;
}, {
    type: string;
    name: string;
    constraints?: string | undefined;
}>;
/**
 * 테이블 생성 입력 스키마
 */
export declare const CreateTableSchema: z.ZodObject<{
    dbPath: z.ZodString;
    tableName: z.ZodString;
    columns: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        constraints: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        constraints?: string | undefined;
    }, {
        type: string;
        name: string;
        constraints?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
    tableName: string;
    columns: {
        type: string;
        name: string;
        constraints?: string | undefined;
    }[];
}, {
    dbPath: string;
    tableName: string;
    columns: {
        type: string;
        name: string;
        constraints?: string | undefined;
    }[];
}>;
/**
 * 데이터 삽입 입력 스키마
 */
export declare const InsertDataSchema: z.ZodObject<{
    dbPath: z.ZodString;
    tableName: z.ZodString;
    data: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
    tableName: string;
    data: Record<string, any>;
}, {
    dbPath: string;
    tableName: string;
    data: Record<string, any>;
}>;
/**
 * SELECT 쿼리 입력 스키마
 */
export declare const SelectDataSchema: z.ZodObject<{
    dbPath: z.ZodString;
    query: z.ZodString;
    params: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
    query: string;
    params?: any[] | undefined;
}, {
    dbPath: string;
    query: string;
    params?: any[] | undefined;
}>;
/**
 * 스키마 정보 조회 입력 스키마
 */
export declare const GetSchemaSchema: z.ZodObject<{
    dbPath: z.ZodString;
    tableName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
    tableName?: string | undefined;
}, {
    dbPath: string;
    tableName?: string | undefined;
}>;
/**
 * UPDATE 쿼리 입력 스키마
 */
export declare const UpdateDataSchema: z.ZodObject<{
    dbPath: z.ZodString;
    query: z.ZodString;
    params: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
    query: string;
    params?: any[] | undefined;
}, {
    dbPath: string;
    query: string;
    params?: any[] | undefined;
}>;
/**
 * DELETE 쿼리 입력 스키마
 */
export declare const DeleteDataSchema: z.ZodObject<{
    dbPath: z.ZodString;
    query: z.ZodString;
    params: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
    query: string;
    params?: any[] | undefined;
}, {
    dbPath: string;
    query: string;
    params?: any[] | undefined;
}>;
/**
 * SQLite 메타 명령 스키마
 */
export declare const MetaCommandSchema: z.ZodObject<{
    dbPath: z.ZodString;
    command: z.ZodEnum<[".tables", ".schema", ".indexes", ".pragma"]>;
    target: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dbPath: string;
    command: ".tables" | ".schema" | ".indexes" | ".pragma";
    target?: string | undefined;
}, {
    dbPath: string;
    command: ".tables" | ".schema" | ".indexes" | ".pragma";
    target?: string | undefined;
}>;
/**
 * 쿼리 결과 스키마
 */
export declare const QueryResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>;
    rowsAffected: z.ZodOptional<z.ZodNumber>;
    lastInsertRowid: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data?: Record<string, any>[] | undefined;
    rowsAffected?: number | undefined;
    lastInsertRowid?: number | undefined;
    error?: string | undefined;
}, {
    success: boolean;
    data?: Record<string, any>[] | undefined;
    rowsAffected?: number | undefined;
    lastInsertRowid?: number | undefined;
    error?: string | undefined;
}>;
/**
 * 스키마 정보 결과 스키마
 */
export declare const SchemaResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    tables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    schema: z.ZodOptional<z.ZodString>;
    columns: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        notnull: z.ZodBoolean;
        dflt_value: z.ZodAny;
        pk: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        notnull: boolean;
        pk: boolean;
        dflt_value?: any;
    }, {
        type: string;
        name: string;
        notnull: boolean;
        pk: boolean;
        dflt_value?: any;
    }>, "many">>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    columns?: {
        type: string;
        name: string;
        notnull: boolean;
        pk: boolean;
        dflt_value?: any;
    }[] | undefined;
    error?: string | undefined;
    tables?: string[] | undefined;
    schema?: string | undefined;
}, {
    success: boolean;
    columns?: {
        type: string;
        name: string;
        notnull: boolean;
        pk: boolean;
        dflt_value?: any;
    }[] | undefined;
    error?: string | undefined;
    tables?: string[] | undefined;
    schema?: string | undefined;
}>;
/**
 * 메타 명령 결과 스키마
 */
export declare const MetaResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    result: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    result: string;
    error?: string | undefined;
}, {
    success: boolean;
    result: string;
    error?: string | undefined;
}>;
export type CreateTableInput = z.infer<typeof CreateTableSchema>;
export type InsertDataInput = z.infer<typeof InsertDataSchema>;
export type SelectDataInput = z.infer<typeof SelectDataSchema>;
export type UpdateDataInput = z.infer<typeof UpdateDataSchema>;
export type DeleteDataInput = z.infer<typeof DeleteDataSchema>;
export type GetSchemaInput = z.infer<typeof GetSchemaSchema>;
export type MetaCommandInput = z.infer<typeof MetaCommandSchema>;
export type QueryResultOutput = z.infer<typeof QueryResultSchema>;
export type SchemaResultOutput = z.infer<typeof SchemaResultSchema>;
export type MetaResultOutput = z.infer<typeof MetaResultSchema>;
//# sourceMappingURL=schemas.d.ts.map