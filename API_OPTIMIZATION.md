# API 사용량 최적화 가이드

## 문제: Gemini API 할당량 초과

### 에러 메시지
```
429 Too Many Requests - You exceeded your current quota
```

## 원인

1. **실험 모델 사용**: `gemini-2.0-flash-exp`는 무료 할당량이 매우 제한적
2. **과도한 토큰 사용**: 크롤링된 데이터에 불필요한 내용 포함
3. **긴 프롬프트**: 상세한 프롬프트로 인한 입력 토큰 증가

## 해결 방법

### 1. 안정적인 모델 사용 ✅

```typescript
// ❌ Before: 실험 모델 (제한적)
model: 'gemini-2.0-flash-exp'

// ✅ After: 안정 모델 (무료 할당량 더 많음)
model: 'gemini-1.5-flash'
```

**무료 할당량 비교**:
- `gemini-2.0-flash-exp`: 매우 제한적 (실험용)
- `gemini-1.5-flash`: 15 RPM, 1,500 RPD, 1M TPM

### 2. 크롤링 데이터 최적화 ✅

불필요한 요소 제거:
```typescript
// 제거되는 요소
$('script, style, nav, footer, header, iframe, noscript, ' +
  'aside, .sidebar, .advertisement, .ad, ' +
  '.cookie-banner, .social-share, .related-posts, ' +
  '.comments, button, form, .menu, .navigation')
  .remove();
```

**개선 결과**:
- Before: 10,000자 제한
- After: 5,000자 제한 (토큰 50% 절약)

### 3. 프롬프트 최적화 ✅

```typescript
// ❌ Before: 긴 프롬프트 (~500 토큰)
const prompt = `
당신은 전문 마케팅 분석가입니다. 아래 웹페이지 내용을 분석하여 다음 정보를 제공해주세요.

# 웹페이지 정보
제목: ${title}
내용: ${content.substring(0, 3000)}
...상세한 지침...
`;

// ✅ After: 간결한 프롬프트 (~300 토큰)
const prompt = `제목: ${title}
내용: ${content.substring(0, 2000)}

${targetAudience} 관점에서:
1. 요약 (3문장)
2. 키워드 5개
3. 댓글 초안 (2문장)

JSON만 출력:
{"summary":"...","keywords":["..."],"commentDraft":"..."}`;
```

**개선 결과**:
- 입력 토큰 40% 절약
- 응답 속도 개선

### 4. 재시도 로직 추가 ✅

429 에러 발생 시 자동 재시도:

```typescript
let retries = 0;
const maxRetries = 3;

while (retries < maxRetries) {
  try {
    result = await model.generateContent(prompt);
    break;
  } catch (err) {
    if (err.message.includes('429')) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, 10000 * retries));
    } else {
      throw err;
    }
  }
}
```

## 토큰 사용량 예측

### URL 1개당 평균 토큰

| 항목 | Before | After | 절감률 |
|------|--------|-------|--------|
| 입력 (프롬프트) | ~1,200 | ~700 | 42% ↓ |
| 출력 (응답) | ~300 | ~200 | 33% ↓ |
| **총합** | **~1,500** | **~900** | **40% ↓** |

### 무료 할당량으로 처리 가능한 URL 수

**Gemini 1.5 Flash 무료 티어**:
- 1M TPM (분당 토큰)
- 1,500 RPD (일일 요청)

**계산**:
- 1개 URL = 900 토큰
- 분당 최대: 1,000,000 ÷ 900 = **~1,100개 URL**
- 하루 최대: **1,500개 URL** (RPD 제한)

## 사용 팁

### 1. 한 번에 적은 수의 URL 처리

```
권장: 5-10개씩
최대: 50개 (할당량 고려)
```

### 2. 시간 간격 두기

여러 번 실행할 때:
```
첫 실행: 10개 URL
1분 대기
두 번째 실행: 10개 URL
```

### 3. 에러 발생 시 대응

```
429 에러 → 1분 대기 후 재시도
자동 재시도 3회 실행됨
```

### 4. 할당량 모니터링

https://ai.dev/usage?tab=rate-limit 에서 확인

## 추가 최적화 (선택)

### 캐싱 구현

동일 URL 재요청 방지:

```typescript
// 간단한 메모리 캐시
const cache = new Map<string, AnalysisResult>();

export async function analyzeContent(options: AnalyzeOptions) {
  const cacheKey = `${options.title}-${options.content.substring(0, 100)}`;
  
  if (cache.has(cacheKey)) {
    console.log('[Cache] 캐시된 결과 반환');
    return cache.get(cacheKey)!;
  }
  
  const result = await analyzeContentInternal(options);
  cache.set(cacheKey, result);
  return result;
}
```

### 배치 처리

여러 URL을 한 번의 요청으로:

```typescript
// 여러 URL을 하나의 프롬프트로
const prompt = `
URL 1: ${title1} - ${content1.substring(0, 1000)}
URL 2: ${title2} - ${content2.substring(0, 1000)}
...
각각 분석해서 JSON 배열로 반환
`;
```

## 참고 자료

- [Gemini API 할당량](https://ai.google.dev/gemini-api/docs/rate-limits)
- [사용량 모니터링](https://ai.dev/usage?tab=rate-limit)
- [토큰 계산기](https://platform.openai.com/tokenizer) (참고용)

