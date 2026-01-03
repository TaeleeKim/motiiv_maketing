// 검색 필터 정의

export type SearchFilter = 
  | 'all' 
  | 'reddit' 
  | 'quora' 
  | 'linkedin' 
  | 'engineer_forum' 
  | 'medium' 
  | 'velog' 
  | 'tistory' 
  | 'naver' 
  | 'brunch' 
  | 'daum';

export const SEARCH_FILTERS = {
  // 모든 사이트
  all: [],

  // Reddit
  reddit: [
    'reddit.com',
  ],

  // Quora
  quora: [
    'quora.com',
  ],

  // LinkedIn 그룹
  linkedin: [
    'linkedin.com',
  ],

  // 엔지니어 전문 포럼
  engineer_forum: [
    'eng-tips.com', // Eng-Tips 포럼
    'engineering.com', // 엔지니어링 포럼
    'engineerboards.com', // 엔지니어 보드
  ],

  // Medium
  medium: [
    'medium.com',
  ],

  // Velog
  velog: [
    'velog.io',
  ],

  // Tistory
  tistory: [
    'tistory.com',
  ],

  // Naver (블로그 + 카페)
  naver: [
    'blog.naver.com',
    'cafe.naver.com',
  ],

  // Brunch
  brunch: [
    'brunch.co.kr',
  ],

  // Daum
  daum: [
    'cafe.daum.net',
  ],
};

/**
 * 검색 필터에 따라 site: 연산자 생성
 */
export function buildSiteFilter(filter: SearchFilter = 'reddit'): string {
  const sites = SEARCH_FILTERS[filter];
  
  if (!sites || sites.length === 0) {
    return ''; // 필터 없음
  }

  // (site:reddit.com OR site:quora.com OR ...)
  return `(${sites.map(site => `site:${site}`).join(' OR ')})`;
}

/**
 * 검색 쿼리 생성
 */
export function buildSearchQuery(
  keywords: string[],
  filter: SearchFilter = 'reddit'
): string {
  // 키워드가 없으면 빈 문자열 반환
  if (!keywords || keywords.length === 0) {
    return '';
  }

  // 최대 5개 키워드까지 사용 (사용자 입력 키워드 포함)
  const limitedKeywords = keywords.slice(0, 5);
  
  // 키워드를 공백으로 연결 (간단한 형식)
  const baseQuery = limitedKeywords.join(' ');
  
  const siteFilter = buildSiteFilter(filter);
  
  if (siteFilter) {
    // site: 필터와 키워드를 공백으로 연결
    return `${siteFilter} ${baseQuery}`;
  }
  
  return baseQuery;
}

