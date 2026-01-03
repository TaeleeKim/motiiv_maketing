import axios from 'axios';
import { buildSearchQuery, SearchFilter } from './search-filters';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  filter: SearchFilter;
}

/**
 * 키워드 정제: 괄호, 특수문자 제거 및 단순화
 */
function cleanKeywords(keywords: string[]): string[] {
  return keywords
    .map(keyword => {
      // 괄호와 그 안의 내용 제거 (예: "Weld Analysis (용접 해석)" -> "Weld Analysis")
      let cleaned = keyword.replace(/\([^)]*\)/g, '').trim();
      
      // 연속된 공백 제거
      cleaned = cleaned.replace(/\s+/g, ' ');
      
      // 특수문자 제거 (하이픈, 언더스코어는 유지)
      cleaned = cleaned.replace(/[^\w\s가-힣-]/g, ' ').trim();
      
      return cleaned;
    })
    .filter(k => k.length > 0 && k.length < 50) // 너무 짧거나 긴 키워드 제거
    .slice(0, 5); // 최대 5개까지 사용
}

export async function searchRelatedPages(
  keywords: string[],
  language: 'ko' | 'en' | 'both' = 'both',
  filters: SearchFilter[] = ['reddit'],
  userKeywords: string[] = []
): Promise<SearchResult[]> {
  const serperApiKey = process.env.SERPER_API_KEY;
  
  if (!serperApiKey) {
    throw new Error('SERPER_API_KEY가 설정되지 않았습니다.');
  }

  // 키워드 정제
  const cleanedKeywords = cleanKeywords(keywords);
  
  // 사용자 입력 키워드 정제 (공백 제거, 빈 문자열 필터링)
  const cleanedUserKeywords = userKeywords
    .map(k => k.trim())
    .filter(k => k.length > 0 && k.length < 50);
  
  // 사용자 입력 키워드를 우선적으로 포함하고, 정제된 키워드와 결합
  // 최대 5개까지 사용 (사용자 입력 키워드 우선)
  const allKeywords = [
    ...cleanedUserKeywords.slice(0, 3), // 사용자 입력 키워드 최대 3개
    ...cleanedKeywords.slice(0, 5), // 정제된 키워드 최대 5개
  ].filter((k, index, self) => self.indexOf(k) === index); // 중복 제거
  
  console.log(`[Search] 원본 키워드:`, keywords);
  console.log(`[Search] 정제된 키워드:`, cleanedKeywords);
  console.log(`[Search] 사용자 입력 키워드:`, userKeywords);
  console.log(`[Search] 최종 검색 키워드:`, allKeywords);

  if (allKeywords.length === 0) {
    console.warn('[Search] 검색할 키워드가 없습니다.');
    return [];
  }

  // 'all' 필터가 포함되어 있으면 필터 없이 검색
  if (filters.includes('all')) {
    filters = ['all'];
  }

  // 언어별 검색 설정
  const searchConfig = {
    ko: { gl: 'kr', hl: 'ko' },
    en: { gl: 'us', hl: 'en' },
    both: { gl: 'kr', hl: 'ko' }, // 기본은 한국
  };

  const config = searchConfig[language];
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // 각 필터별로 검색 수행
  for (const filter of filters) {
    try {
      // 정제된 키워드와 사용자 입력 키워드로 검색 쿼리 생성
      const query = buildSearchQuery(allKeywords, filter);
      
      console.log(`[Search] 필터: ${filter}, 검색 쿼리:`, query);

      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: query,
          num: 20, // PDF 필터링을 위해 더 많이 가져옴
          gl: config.gl,
          hl: config.hl,
        },
        {
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Serper API 응답 상세 로깅
      console.log(`[Search] 필터 ${filter} API 응답:`, {
        status: response.status,
        hasOrganic: !!response.data?.organic,
        organicCount: response.data?.organic?.length || 0,
        error: response.data?.error,
        message: response.data?.message,
      });

      const filterResults: SearchResult[] = [];
      
      if (response.data?.organic && Array.isArray(response.data.organic)) {
        for (const item of response.data.organic) {
          const url = item.link || '';
          
          // 중복 URL 제거
          if (seenUrls.has(url)) {
            continue;
          }
          
          // PDF 파일 제외 (URL 및 제목 확인)
          if (
            url.toLowerCase().endsWith('.pdf') ||
            url.toLowerCase().includes('.pdf?') ||
            url.toLowerCase().includes('/pdf/') ||
            item.title?.toLowerCase().includes('[pdf]') ||
            item.title?.toLowerCase().includes('(pdf)') ||
            item.title?.toLowerCase().includes('논문')
          ) {
            console.log('[Search] PDF 제외:', url);
            continue;
          }

          filterResults.push({
            title: item.title,
            url: url,
            snippet: item.snippet || '',
            source: extractDomain(url),
            filter: filter,
          });

          seenUrls.add(url);

          // 각 필터당 5개까지만
          if (filterResults.length >= 5) break;
        }
      }

      console.log(`[Search] 필터 ${filter} 검색 완료 - ${filterResults.length}개 결과`);
      allResults.push(...filterResults);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`필터 ${filter} 검색 오류:`, {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          query: buildSearchQuery(cleanedKeywords, filter),
        });
      } else {
        console.error(`필터 ${filter} 검색 오류:`, error);
      }
      // 개별 필터 오류는 무시하고 계속 진행
    }
  }

  console.log(`[Search] 전체 검색 완료 (언어: ${language}, 필터: ${filters.join(', ')}) - 총 ${allResults.length}개 결과`);

  return allResults;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

export function generateTrackingUrl(
  originalUrl: string,
  source: string,
  campaign: string = 'community_outreach'
): string {
  const url = new URL(originalUrl);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', 'comment');
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}

