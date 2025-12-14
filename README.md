# SQLite MCP Server

A comprehensive Model Context Protocol (MCP) server implementation that provides full CRUD (Create, Read, Update, Delete) operations for SQLite databases. This server allows clients to interact with multiple SQLite database files through a standardized MCP interface.

## Overview

This MCP server provides comprehensive SQLite database operations through the Model Context Protocol. It supports Create, Read, Update, Delete (CRUD) operations on multiple SQLite database files, with each operation accepting a database path parameter for flexible multi-database management.

## Features

- **Multi-database Support**: Connect to different SQLite databases per request
- **Full CRUD Operations**: Create, Read, Update, Delete operations
- **Schema Management**: Table creation, schema inspection, and metadata queries
- **SQLite Meta Commands**: Support for `.tables`, `.schema`, `.indexes`, `.pragma` commands
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Property-based Testing**: Comprehensive testing with fast-check
- **MCP Protocol Compliance**: Standard MCP protocol implementation

## Installation

```bash
npm install
```

## Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## Project Structure

```
src/
├── types/          # Type definitions and schemas
├── tools/          # MCP tool implementations
├── database/       # Database management
├── server/         # MCP server implementation
└── index.ts        # Entry point
```

## Usage

The server exposes the following MCP tools:

### Create Operations
- `create-table`: Create new tables with specified schema
- `insert-data`: Insert data into existing tables

### Read Operations
- `select-data`: Execute SELECT queries with optional parameters
- `get-schema`: Retrieve table schema information

### Update Operations
- `update-data`: Execute UPDATE queries with conditions

### Delete Operations
- `delete-data`: Execute DELETE queries with conditions

### Meta Operations
- `meta-command`: Execute SQLite meta commands (.tables, .schema, etc.)

## Requirements

This implementation satisfies the following requirements:
- Multi-database connection management (Requirements 1.1-1.4)
- Complete CRUD operations (Requirements 2.1-5.4)
- Schema and metadata access (Requirements 6.1-7.5)
- MCP protocol compliance (Requirements 8.1-8.4)
- Multilingual documentation (Requirements 9.1-9.4)

## License

MIT

---

# SQLite MCP 서버

TypeScript로 구현된 SQLite CRUD 작업을 위한 MCP(Model Context Protocol) 서버입니다.

## 개요

이 MCP 서버는 Model Context Protocol을 통해 포괄적인 SQLite 데이터베이스 작업을 제공합니다. 여러 SQLite 데이터베이스 파일에 대한 생성, 읽기, 업데이트, 삭제(CRUD) 작업을 지원하며, 각 작업마다 데이터베이스 경로 매개변수를 받아 유연한 다중 데이터베이스 관리가 가능합니다.

## 기능

- **다중 데이터베이스 지원**: 요청별로 다른 SQLite 데이터베이스에 연결
- **완전한 CRUD 작업**: 생성, 읽기, 업데이트, 삭제 작업
- **스키마 관리**: 테이블 생성, 스키마 검사, 메타데이터 쿼리
- **SQLite 메타 명령**: `.tables`, `.schema`, `.indexes`, `.pragma` 명령 지원
- **타입 안전성**: Zod 검증을 포함한 완전한 TypeScript 구현
- **속성 기반 테스트**: fast-check를 사용한 포괄적인 테스트
- **MCP 프로토콜 준수**: 표준 MCP 프로토콜 구현

## 설치

```bash
npm install
```

## 개발

```bash
# 프로젝트 빌드
npm run build

# 개발 모드 실행
npm run dev

# 테스트 실행
npm test

# 커버리지와 함께 테스트 실행
npm run test:coverage

# 코드 린트
npm run lint
```

## 프로젝트 구조

```
src/
├── types/          # 타입 정의 및 스키마
├── tools/          # MCP 도구 구현
├── database/       # 데이터베이스 관리
├── server/         # MCP 서버 구현
└── index.ts        # 진입점
```

## 사용법

서버는 다음 MCP 도구들을 제공합니다:

### 생성 작업
- `create-table`: 지정된 스키마로 새 테이블 생성
- `insert-data`: 기존 테이블에 데이터 삽입

### 읽기 작업
- `select-data`: 선택적 매개변수와 함께 SELECT 쿼리 실행
- `get-schema`: 테이블 스키마 정보 조회

### 업데이트 작업
- `update-data`: 조건과 함께 UPDATE 쿼리 실행

### 삭제 작업
- `delete-data`: 조건과 함께 DELETE 쿼리 실행

### 메타 작업
- `meta-command`: SQLite 메타 명령 실행 (.tables, .schema 등)

## 요구사항

이 구현은 다음 요구사항을 만족합니다:
- 다중 데이터베이스 연결 관리 (요구사항 1.1-1.4)
- 완전한 CRUD 작업 (요구사항 2.1-5.4)
- 스키마 및 메타데이터 접근 (요구사항 6.1-7.5)
- MCP 프로토콜 준수 (요구사항 8.1-8.4)
- 다국어 문서화 (요구사항 9.1-9.4)

## 라이선스

MIT