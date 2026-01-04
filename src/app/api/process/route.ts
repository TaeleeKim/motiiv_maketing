import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
// OpenAI 대신 Gemini 사용 (무료)
import { analyzeContent } from '@/lib/gemini';
// OpenAI를 사용하려면: import { analyzeContent } from '@/lib/openai';
import { searchRelatedPages, generateTrackingUrl } from '@/lib/search';
import { AnalysisResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인 (Vercel 배포 시 필수)
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;
    
    console.log('[API] 환경 변수 확인:', {
      hasGeminiKey: !!geminiKey,
      hasSerperKey: !!serperKey,
      isVercel: !!process.env.VERCEL,
    });
    
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 환경 변수를 설정해주세요.' },
        { status: 500 }
      );
    }
    
    if (!serperKey) {
      return NextResponse.json(
        { error: 'SERPER_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 환경 변수를 설정해주세요.' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { urls, targetAudience, language, searchFilter = ['reddit'], userKeywords = [] } = body;
    
    console.log('[API] 요청 받음:', {
      urlCount: urls?.length || 0,
      targetAudience,
      language,
      filterCount: Array.isArray(searchFilter) ? searchFilter.length : 1,
    });
    
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
        console.log(`[API] URL 처리 시작: ${url}`);
        
        // 1. URL 크롤링 (SEO 정보 포함)
        console.log(`[API] 1단계: URL 크롤링 시작`);
        const { title, content, seoInfo } = await scrapeUrl(url);
        console.log(`[API] 1단계 완료: 제목="${title}", 콘텐츠 길이=${content.length}`);

        // 2. LLM 분석 (SEO 정보 활용)
        console.log(`[API] 2단계: LLM 분석 시작`);
        const analysis = await analyzeContent({
          title,
          content,
          targetAudience,
          language,
          seoInfo,
        });
        console.log(`[API] 2단계 완료: 키워드 수=${analysis.keywords.length}`);

        // 3. 관련 페이지 검색 (언어 및 필터 설정 전달, 사용자 입력 키워드 포함)
        console.log(`[API] 3단계: 관련 페이지 검색 시작`);
        const relatedPages = await searchRelatedPages(analysis.keywords, language, filters, keywords);
        console.log(`[API] 3단계 완료: 검색 결과 수=${relatedPages.length}`);

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
        
        console.log(`[API] URL 처리 완료: ${url}`);
      } catch (error) {
        console.error(`[API] URL 처리 실패 (${url}):`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        // 에러 타입별로 구분
        let errorType = '알 수 없는 오류';
        if (errorMessage.includes('크롤링')) {
          errorType = '크롤링 오류';
        } else if (errorMessage.includes('API') || errorMessage.includes('Gemini') || errorMessage.includes('OpenAI')) {
          errorType = 'AI 분석 오류';
        } else if (errorMessage.includes('검색') || errorMessage.includes('Serper')) {
          errorType = '검색 오류';
        }
        
        console.error(`[API] 에러 상세:`, {
          url,
          errorType,
          message: errorMessage,
          stack: errorStack,
        });
        
        results.push({
          url,
          title: 'Error',
          summary: `처리 중 오류 발생 (${errorType}): ${errorMessage}`,
          keywords: [],
          relatedPages: [],
        });
      }
    }

    console.log('[API] 전체 처리 완료:', {
      totalResults: results.length,
      successCount: results.filter(r => r.title !== 'Error').length,
      errorCount: results.filter(r => r.title === 'Error').length,
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] 전체 요청 처리 오류:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // 에러 타입별 상세 정보
    let errorDetails = errorMessage;
    if (errorMessage.includes('GOOGLE_GEMINI_API_KEY')) {
      errorDetails = 'Gemini API 키가 설정되지 않았습니다. Vercel 대시보드에서 GOOGLE_GEMINI_API_KEY를 설정해주세요.';
    } else if (errorMessage.includes('SERPER_API_KEY')) {
      errorDetails = 'Serper API 키가 설정되지 않았습니다. Vercel 대시보드에서 SERPER_API_KEY를 설정해주세요.';
    } else if (errorMessage.includes('크롤링') || errorMessage.includes('Puppeteer')) {
      errorDetails = `크롤링 오류: ${errorMessage}. Vercel 로그를 확인해주세요.`;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      errorDetails = '요청 시간 초과. Vercel 무료 플랜은 10초 제한이 있습니다. Pro 플랜으로 업그레이드하거나 요청을 단순화해주세요.';
    }
    
    console.error('[API] 에러 상세 정보:', {
      message: errorMessage,
      stack: errorStack,
      details: errorDetails,
      isVercel: !!process.env.VERCEL,
    });
    
    return NextResponse.json(
      { 
        error: '요청 처리 중 오류가 발생했습니다.',
        details: errorDetails,
        originalError: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

