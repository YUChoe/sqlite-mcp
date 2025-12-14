# Requirements Document

## Introduction

SQLite CRUD 기능을 제공하는 MCP(Model Context Protocol) 서버를 TypeScript로 구현합니다. 이 서버는 다양한 SQLite 데이터베이스 파일에 대해 생성(Create), 읽기(Read), 업데이트(Update), 삭제(Delete) 작업을 수행할 수 있는 API를 제공합니다.

## Glossary

- **MCP_Server**: Model Context Protocol을 구현하는 서버 애플리케이션
- **SQLite_Database**: SQLite 형식의 데이터베이스 파일
- **CRUD_Operations**: Create, Read, Update, Delete 데이터베이스 작업
- **Database_Path**: SQLite 데이터베이스 파일의 파일 시스템 경로
- **API_Endpoint**: 클라이언트가 호출할 수 있는 서버 기능

## Requirements

### Requirement 1

**User Story:** 개발자로서 다양한 SQLite 데이터베이스 파일에 연결하고 싶습니다. 각 요청마다 데이터베이스 경로를 지정할 수 있어야 합니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 데이터베이스 경로를 파라미터로 제공하면 THE MCP_Server SHALL 해당 경로의 SQLite_Database에 연결한다
2. WHEN 잘못된 데이터베이스 경로가 제공되면 THE MCP_Server SHALL 적절한 오류 메시지를 반환한다
3. WHEN 데이터베이스 파일이 존재하지 않으면 THE MCP_Server SHALL 새로운 SQLite_Database 파일을 생성한다
4. WHEN 동시에 여러 데이터베이스 경로 요청이 들어오면 THE MCP_Server SHALL 각각을 독립적으로 처리한다

### Requirement 2

**User Story:** 개발자로서 SQLite 데이터베이스에 새로운 데이터를 생성하고 싶습니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 테이블 생성 요청을 보내면 THE MCP_Server SHALL 지정된 스키마로 테이블을 생성한다
2. WHEN 클라이언트가 데이터 삽입 요청을 보내면 THE MCP_Server SHALL 지정된 테이블에 데이터를 삽입한다
3. WHEN 잘못된 SQL 구문이 제공되면 THE MCP_Server SHALL SQL 오류 정보를 반환한다
4. WHEN 삽입 작업이 성공하면 THE MCP_Server SHALL 삽입된 행의 ID를 반환한다

### Requirement 3

**User Story:** 개발자로서 SQLite 데이터베이스에서 데이터를 조회하고 싶습니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 SELECT 쿼리를 보내면 THE MCP_Server SHALL 쿼리 결과를 JSON 형태로 반환한다
2. WHEN 조건부 쿼리가 요청되면 THE MCP_Server SHALL WHERE 절을 적용하여 필터링된 결과를 반환한다
3. WHEN 존재하지 않는 테이블을 조회하면 THE MCP_Server SHALL 테이블 존재하지 않음 오류를 반환한다
4. WHEN 빈 결과 집합이 반환되면 THE MCP_Server SHALL 빈 배열을 반환한다

### Requirement 4

**User Story:** 개발자로서 SQLite 데이터베이스의 기존 데이터를 수정하고 싶습니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 UPDATE 쿼리를 보내면 THE MCP_Server SHALL 지정된 조건에 맞는 행들을 업데이트한다
2. WHEN 업데이트 작업이 완료되면 THE MCP_Server SHALL 영향받은 행의 수를 반환한다
3. WHEN 업데이트 조건에 맞는 행이 없으면 THE MCP_Server SHALL 0개 행이 영향받았음을 반환한다
4. WHEN 잘못된 컬럼명이 사용되면 THE MCP_Server SHALL 컬럼 존재하지 않음 오류를 반환한다

### Requirement 5

**User Story:** 개발자로서 SQLite 데이터베이스에서 불필요한 데이터를 삭제하고 싶습니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 DELETE 쿼리를 보내면 THE MCP_Server SHALL 지정된 조건에 맞는 행들을 삭제한다
2. WHEN 삭제 작업이 완료되면 THE MCP_Server SHALL 삭제된 행의 수를 반환한다
3. WHEN 삭제 조건에 맞는 행이 없으면 THE MCP_Server SHALL 0개 행이 삭제되었음을 반환한다
4. WHEN 테이블 전체 삭제가 요청되면 THE MCP_Server SHALL 모든 행을 삭제하고 결과를 반환한다

### Requirement 6

**User Story:** 개발자로서 데이터베이스 스키마 정보를 조회하고 싶습니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 테이블 목록을 요청하면 THE MCP_Server SHALL 데이터베이스의 모든 테이블 이름을 반환한다
2. WHEN 클라이언트가 특정 테이블의 스키마를 요청하면 THE MCP_Server SHALL 컬럼 정보와 데이터 타입을 반환한다
3. WHEN 존재하지 않는 테이블의 스키마를 요청하면 THE MCP_Server SHALL 테이블 존재하지 않음 오류를 반환한다
4. WHEN 빈 데이터베이스의 테이블 목록을 요청하면 THE MCP_Server SHALL 빈 배열을 반환한다

### Requirement 7

**User Story:** 개발자로서 SQLite 메타데이터 명령을 실행하여 데이터베이스 구조를 분석하고 싶습니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 .tables 명령을 요청하면 THE MCP_Server SHALL 모든 테이블과 뷰의 목록을 반환한다
2. WHEN 클라이언트가 .schema 명령을 요청하면 THE MCP_Server SHALL 전체 데이터베이스의 DDL 스키마를 반환한다
3. WHEN 클라이언트가 특정 테이블에 대한 .schema 명령을 요청하면 THE MCP_Server SHALL 해당 테이블의 DDL만 반환한다
4. WHEN 클라이언트가 .indexes 명령을 요청하면 THE MCP_Server SHALL 모든 인덱스 정보를 반환한다
5. WHEN 클라이언트가 .pragma 명령을 요청하면 THE MCP_Server SHALL 데이터베이스 설정 정보를 반환한다

### Requirement 8

**User Story:** 개발자로서 MCP 프로토콜을 통해 안전하고 표준화된 방식으로 서버와 통신하고 싶습니다.

#### Acceptance Criteria

1. WHEN 클라이언트가 MCP 프로토콜로 연결하면 THE MCP_Server SHALL 표준 MCP 핸드셰이크를 수행한다
2. WHEN 클라이언트가 사용 가능한 도구 목록을 요청하면 THE MCP_Server SHALL 모든 CRUD_Operations를 도구로 노출한다
3. WHEN 잘못된 MCP 메시지가 수신되면 THE MCP_Server SHALL 표준 MCP 오류 응답을 반환한다
4. WHEN 서버가 시작되면 THE MCP_Server SHALL MCP 프로토콜 버전 정보를 제공한다

### Requirement 9

**User Story:** 개발자로서 프로젝트 문서를 다국어로 읽고 싶습니다.

#### Acceptance Criteria

1. WHEN README.md 파일이 생성되면 THE MCP_Server SHALL 영어 버전을 먼저 작성한다
2. WHEN 영어 문서 작성이 완료되면 THE MCP_Server SHALL 한글 버전을 추가로 작성한다
3. WHEN 문서 구조가 변경되면 THE MCP_Server SHALL 두 언어 모두에서 동일한 구조를 유지한다
4. WHEN 기능이 업데이트되면 THE MCP_Server SHALL 영어와 한글 문서를 모두 업데이트한다