// Jest 설정 파일
// 테스트 환경 초기화 및 공통 설정

// 테스트 타임아웃 설정 (30초)
jest.setTimeout(30000);

// 전역 테스트 설정
global.console = {
  ...console,
  // 테스트 중 불필요한 로그 출력 방지
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};