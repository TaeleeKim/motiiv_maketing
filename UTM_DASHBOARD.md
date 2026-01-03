# UTM 관리 대시보드 가이드

## 개요

UTM 관리 대시보드는 생성된 UTM 추적 URL을 관리하고 통계를 확인할 수 있는 기능입니다. URL 분석 시 자동으로 생성된 UTM 링크를 저장하고 관리할 수 있습니다.

## UTM 저장 위치

### 브라우저 로컬 스토리지

UTM URL은 **브라우저의 로컬 스토리지(LocalStorage)**에 저장됩니다.

- **저장 키**: `motiiv_utm_records`
- **저장 위치**: 브라우저의 로컬 스토리지 (개발자 도구 → Application → Local Storage에서 확인 가능)
- **최대 저장 개수**: 1,000개
- **저장 형식**: JSON 배열

### 저장 데이터 구조

```typescript
{
  id: string;              // 고유 ID (타임스탬프 + 랜덤 문자열)
  originalUrl: string;     // 원본 URL
  trackingUrl: string;    // UTM 파라미터가 포함된 추적 URL
  source: string;         // utm_source (예: reddit.com)
  medium: string;         // utm_medium (항상 'comment')
  campaign: string;       // utm_campaign (키워드 기반)
  createdAt: string;      // 생성 일시 (ISO 8601 형식)
  title?: string;        // 페이지 제목 (선택사항)
  filter?: string;       // 검색 필터 (선택사항)
}
```

### 저장 위치 확인 방법

1. **Chrome/Edge 브라우저**:
   - F12 또는 우클릭 → 검사
   - Application 탭 → Storage → Local Storage
   - 현재 도메인 선택
   - `motiiv_utm_records` 키 확인

2. **Firefox 브라우저**:
   - F12 또는 우클릭 → 검사
   - Storage 탭 → Local Storage
   - 현재 도메인 선택
   - `motiiv_utm_records` 키 확인

3. **Safari 브라우저**:
   - 개발자 메뉴 활성화 필요
   - 개발자 도구 → Storage → Local Storage
   - `motiiv_utm_records` 키 확인

### 주의사항

- **브라우저별로 독립적**: 각 브라우저마다 별도의 로컬 스토리지를 사용합니다
- **도메인별로 독립적**: 다른 도메인에서는 접근할 수 없습니다
- **데이터 영구성**: 브라우저 캐시를 삭제하거나 시크릿 모드를 사용하면 데이터가 사라질 수 있습니다
- **백업 권장**: 중요한 UTM 데이터는 별도로 백업하는 것을 권장합니다

## 대시보드 기능

### 1. 통계 카드

- **전체 UTM**: 생성된 UTM 링크의 총 개수
- **최근 7일**: 최근 7일간 생성된 UTM 링크 개수
- **소스 수**: 서로 다른 소스(utm_source)의 개수

### 2. 필터링

- **소스 필터**: utm_source별로 필터링 (예: reddit.com, quora.com)
- **캠페인 필터**: utm_campaign별로 필터링 (키워드 기반)

### 3. UTM 목록

각 UTM 레코드에는 다음 정보가 표시됩니다:

- 페이지 제목
- 원본 URL
- UTM 추적 URL
- 소스, 미디엄, 캠페인 태그
- 생성 일시
- 검색 필터 정보

### 4. 기능

- **복사**: UTM 추적 URL을 클립보드에 복사
- **삭제**: 개별 UTM 레코드 삭제
- **전체 삭제**: 모든 UTM 레코드 일괄 삭제

## UTM 조회수 및 성과 추적

### 현재 구현 상태

현재 UTM 대시보드는 **생성된 UTM 링크를 저장하고 관리**하는 기능만 제공합니다. **조회수, 클릭수, 전환율 등의 성과 지표는 직접 추적하지 않습니다.**

### 구글 애널리틱스(GA4)를 통한 성과 추적

UTM 파라미터의 성과를 추적하려면 **구글 애널리틱스 4 (GA4)**를 사용해야 합니다.

#### 1. 구글 애널리틱스 설정

1. Google Analytics 4 계정 생성 및 웹사이트 연결
2. 추적 코드를 웹사이트에 설치
3. 별도의 API 연동 없이 자동으로 UTM 파라미터 추적 시작

#### 2. 성과 확인 방법

**기본 보고서**:
- 경로: 보고서 → 획득 → 캠페인
- UTM 파라미터별 트래픽, 세션 수, 사용자 수 확인

**상세 분석**:
- 경로: 탐색 분석 → 자유 형식
- 차원: 캠페인 이름, 소스/미디엄, 캠페인 ID
- 지표: 세션, 사용자, 페이지뷰, 전환 등

**실시간 추적**:
- 경로: 보고서 → 실시간
- 현재 활성 UTM 링크의 실시간 트래픽 확인

#### 3. UTM 파라미터별 분석

구글 애널리틱스에서 다음 정보를 확인할 수 있습니다:

- **utm_source**: 트래픽 소스 (예: reddit.com, quora.com)
- **utm_medium**: 트래픽 미디엄 (예: comment)
- **utm_campaign**: 캠페인 이름 (키워드 기반)

**분석 예시**:
```
utm_source=reddit.com
utm_medium=comment
utm_campaign=keyword_weld_analysis
```

#### 4. 고급 분석 기능

**커스텀 보고서 생성**:
1. 탐색 분석 → 자유 형식
2. 차원 추가: 캠페인 이름, 소스/미디엄
3. 지표 추가: 세션, 전환, 수익 등
4. 필터 설정: 특정 소스나 캠페인만 필터링

**목표 및 전환 추적**:
- 특정 UTM 캠페인의 전환율 측정
- 목표 달성률 추적
- ROI 계산

## 사용 방법

### 1. UTM 생성

1. 홈 페이지에서 URL 분석 실행
2. 분석 완료 후 관련 페이지에 UTM 파라미터가 자동으로 추가됨
3. UTM 링크가 자동으로 대시보드에 저장됨

### 2. 대시보드 접근

- 홈 페이지의 "UTM 대시보드" 링크 클릭
- 또는 `/dashboard` 경로로 직접 접근

### 3. UTM 관리

- **복사**: UTM 링크를 클릭하여 커뮤니티에 댓글 작성 시 사용
- **필터링**: 소스나 캠페인별로 필터링하여 원하는 UTM 찾기
- **삭제**: 더 이상 사용하지 않는 UTM 삭제

### 4. 성과 확인

- 구글 애널리틱스 대시보드에서 UTM별 성과 확인
- 어떤 소스(reddit, quora 등)가 가장 효과적인지 분석
- 어떤 키워드 캠페인이 가장 많은 트래픽을 유도하는지 확인

## UTM 파라미터 구조

생성되는 UTM URL의 구조:

```
https://원본URL?utm_source={소스}&utm_medium=comment&utm_campaign={캠페인}
```

**예시**:
```
https://motiiv.ai/en/article/view/311?utm_source=reddit.com&utm_medium=comment&utm_campaign=keyword_weld_analysis
```

### 파라미터 설명

- **utm_source**: 트래픽 소스 (예: reddit.com, quora.com, linkedin.com)
- **utm_medium**: 트래픽 미디엄 (항상 'comment')
- **utm_campaign**: 캠페인 이름 (키워드 기반, 예: keyword_weld_analysis)

## 데이터 백업 및 복구

### 백업 방법

로컬 스토리지의 데이터는 브라우저 개발자 도구에서 직접 백업할 수 있습니다:

1. 개발자 도구 열기 (F12)
2. Application → Local Storage → 현재 도메인
3. `motiiv_utm_records` 키의 값을 복사
4. 텍스트 파일로 저장

### 복구 방법

1. 개발자 도구 열기 (F12)
2. Application → Local Storage → 현재 도메인
3. `motiiv_utm_records` 키 추가
4. 백업한 JSON 데이터 붙여넣기

## 제한사항

- **최대 저장 개수**: 1,000개 (초과 시 가장 오래된 레코드부터 삭제)
- **브라우저 종속**: 다른 브라우저나 기기에서는 접근 불가
- **조회수 추적 없음**: 대시보드에서는 조회수를 추적하지 않음 (GA4 사용 필요)
- **데이터 영구성**: 브라우저 캐시 삭제 시 데이터 손실 가능

## 향후 개선 계획

- [ ] 구글 애널리틱스 API 연동으로 조회수 실시간 표시
- [ ] 데이터베이스 연동으로 다중 기기 접근 지원
- [ ] CSV/Excel 내보내기 기능
- [ ] UTM 성과 대시보드 (클릭수, 전환율 등)
- [ ] 자동 백업 기능

## 문의 및 지원

문제가 발생하거나 기능 개선 제안이 있으시면 이슈를 등록해주세요.

