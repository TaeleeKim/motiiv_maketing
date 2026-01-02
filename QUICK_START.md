# 빠른 시작 가이드

## 1단계: 의존성 설치

```bash
cd /Users/ktl0602/MIDAS/motiiv_marketing
npm install
```

## 2단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 추가하세요:

```bash
OPENAI_API_KEY=sk-your-openai-key-here
SERPER_API_KEY=your-serper-key-here
```

### API Key 발급

#### OpenAI API Key
1. https://platform.openai.com/api-keys 접속
2. 로그인 후 "Create new secret key" 클릭
3. 생성된 키를 복사하여 `.env.local`에 붙여넣기

#### Serper API Key
1. https://serper.dev 접속
2. 무료 회원가입 (Google 계정으로 가능)
3. Dashboard에서 API Key 확인
4. 키를 복사하여 `.env.local`에 붙여넣기
5. 무료 플랜: 월 2,500회 검색 가능

## 3단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 4단계: 사용하기

1. **URL 입력 칸**에 분석할 URL을 입력 (한 줄에 하나씩)
   ```
   https://example.com/article1
   https://example.com/article2
   ```

2. **타겟 독자** 설정 (기본값: 구조/토목 엔지니어)

3. **키워드 언어** 선택 (한국어+영어 / 한국어만 / 영어만)

4. **분석 시작** 버튼 클릭

5. 결과 확인:
   - 각 URL의 요약
   - 추출된 키워드 5개
   - AI가 작성한 댓글 초안
   - 추천 커뮤니티 페이지 목록
   - UTM 파라미터가 포함된 추적 링크

## 문제 해결

### Port 3000이 이미 사용 중인 경우

```bash
npm run dev -- -p 3001
```

### API Key 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 파일명이 정확히 `.env.local`인지 확인 (`.env.local.example` 아님)
- API Key에 공백이나 따옴표가 없는지 확인

### CORS 오류

- 일부 웹사이트는 크롤링을 차단할 수 있습니다
- 다른 URL로 시도해보세요

## 테스트용 샘플 URL

```
https://en.wikipedia.org/wiki/Structural_engineering
https://www.engineeringnews.co.za/
```

## 다음 단계

- Google Analytics 연동하여 UTM 추적 시작
- HubSpot과 연동하여 리드 소스 분석
- 댓글 히스토리 관리 시스템 구축

