/**
 * Zod 스키마를 JSON Schema로 변환하는 유틸리티
 */
import { z } from 'zod';
/**
 * Zod 스키마를 JSON Schema로 변환
 */
export function zodToJsonSchema(zodSchema) {
    // 기본적인 Zod 타입들을 JSON Schema로 매핑
    if (zodSchema instanceof z.ZodString) {
        const schema = { type: 'string' };
        // 문자열 제약사항 처리
        const checks = zodSchema._def.checks || [];
        for (const check of checks) {
            if (check.kind === 'min') {
                schema.minLength = check.value;
            }
            else if (check.kind === 'max') {
                schema.maxLength = check.value;
            }
            else if (check.kind === 'regex') {
                schema.pattern = check.regex.source;
            }
        }
        return schema;
    }
    if (zodSchema instanceof z.ZodNumber) {
        return { type: 'number' };
    }
    if (zodSchema instanceof z.ZodBoolean) {
        return { type: 'boolean' };
    }
    if (zodSchema instanceof z.ZodArray) {
        return {
            type: 'array',
            items: zodToJsonSchema(zodSchema._def.type)
        };
    }
    if (zodSchema instanceof z.ZodObject) {
        const shape = zodSchema._def.shape();
        const properties = {};
        const required = [];
        for (const [key, value] of Object.entries(shape)) {
            properties[key] = zodToJsonSchema(value);
            // 필수 필드 확인
            if (!value.isOptional()) {
                required.push(key);
            }
        }
        const schema = {
            type: 'object',
            properties
        };
        if (required.length > 0) {
            schema.required = required;
        }
        return schema;
    }
    if (zodSchema instanceof z.ZodRecord) {
        return {
            type: 'object',
            additionalProperties: zodToJsonSchema(zodSchema._def.valueType)
        };
    }
    if (zodSchema instanceof z.ZodEnum) {
        return {
            type: 'string',
            enum: zodSchema._def.values
        };
    }
    if (zodSchema instanceof z.ZodOptional) {
        return zodToJsonSchema(zodSchema._def.innerType);
    }
    if (zodSchema instanceof z.ZodAny) {
        return {};
    }
    // 기본값
    return { type: 'object' };
}
//# sourceMappingURL=schemaConverter.js.map