import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
// OpenAI 대신 Gemini 사용 (무료)
import { analyzeContent } from '@/lib/gemini';
// OpenAI를 사용하려면: import { analyzeContent } from '@/lib/openai';
import { searchRelatedPages, generateTrackingUrl } from '@/lib/search';
import { AnalysisResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, targetAudience, language, searchFilter = ['reddit'], userKeywords = [] } = body;
    
    // searchFilter가 배열이 아닌 경우 배열로 변환 (하위 호환성)
    const filters = Array.isArray(searchFilter) ? searchFilter : [searchFilter];
    
    // userKeywords가 배열이 아닌 경우 배열로 변환 (하위 호환성)
    const keywords = Array.isArray(userKeywords) ? userKeywords : [];

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URL 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    const results: AnalysisResult[] = [];

    // 각 URL을 순차적으로 처리
    for (const url of urls) {
      try {
        // 1. URL 크롤링 (SEO 정보 포함)
        const { title, content, seoInfo } = await scrapeUrl(url);

        // 2. LLM 분석 (SEO 정보 활용)
        const analysis = await analyzeContent({
          title,
          content,
          targetAudience,
          language,
          seoInfo,
        });

        // 3. 관련 페이지 검색 (언어 및 필터 설정 전달, 사용자 입력 키워드 포함)
        const relatedPages = await searchRelatedPages(analysis.keywords, language, filters, keywords);

        // 4. UTM 파라미터 추가
        const pagesWithTracking = relatedPages.map(page => ({
          ...page,
          trackingUrl: generateTrackingUrl(
            url,
            page.source,
            'keyword_' + analysis.keywords[0].replace(/\s+/g, '_')
          ),
        }));

        results.push({
          url,
          title,
          summary: analysis.summary,
          keywords: analysis.keywords,
          relatedPages: pagesWithTracking,
          commentDrafts: analysis.commentDrafts,
        });
      } catch (error) {
        console.error(`URL 처리 실패 (${url}):`, error);
        results.push({
          url,
          title: 'Error',
          summary: `처리 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`,
          keywords: [],
          relatedPages: [],
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

