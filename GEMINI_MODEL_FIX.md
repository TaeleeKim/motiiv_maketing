# Gemini 모델명 문제 해결

## 에러 원인

```
[404 Not Found] models/gemini-pro is not found for API version v1beta
```

`@google/generative-ai` v0.21.0에서 지원하는 모델명이 변경되었습니다.

## 해결 방법

### 옵션 1: Latest 버전 사용 (권장) ✅

```typescript
model: 'gemini-1.5-flash-latest'
```

**장점**:
- 항상 최신 안정 버전 사용
- 자동 업데이트

### 옵션 2: 특정 버전 지정

```typescript
model: 'gemini-1.5-flash-001'
```

### 옵션 3: Pro 모델 (더 강력)

```typescript
model: 'gemini-1.5-pro-latest'
```

**특징**:
- 더 나은 품질
- 느린 속도
- 더 비싼 비용

## 사용 가능한 모델 (v0.21.0)

| 모델명 | 설명 | 속도 | 품질 |
|--------|------|------|------|
| `gemini-1.5-flash-latest` | 최신 Flash (권장) | 빠름 | 좋음 |
| `gemini-1.5-flash-001` | Flash 특정 버전 | 빠름 | 좋음 |
| `gemini-1.5-pro-latest` | 최신 Pro | 느림 | 우수 |
| `gemini-1.5-pro-001` | Pro 특정 버전 | 느림 | 우수 |

## API 키 확인

API 키가 올바른지 확인:

```bash
# .env.local 확인
cat .env.local | grep GOOGLE_GEMINI_API_KEY

# 키가 있는지 확인
echo $GOOGLE_GEMINI_API_KEY
```

## 테스트

```bash
# 개발 서버 재시작
npm run dev

# 브라우저에서 테스트
# http://localhost:3000
```

## 참고

- [Gemini Models 문서](https://ai.google.dev/gemini-api/docs/models/gemini)
- [SDK 버전별 모델명 변경사항](https://github.com/google/generative-ai-js/releases)

