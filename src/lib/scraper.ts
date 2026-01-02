import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeUrlWithPuppeteer } from './puppeteer-scraper';

export interface SEOInfo {
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogKeywords?: string;
}

// React/Vue 등 SPA 감지
function isSPAUrl(url: string): boolean {
  // MOTIIV 도메인은 React 사용
  if (url.includes('motiiv.ai') || url.includes('motiiv.com')) {
    return true;
  }
  // 다른 SPA 패턴 추가 가능
  return false;
}

function extractSEOInfo($: cheerio.CheerioAPI): SEOInfo {
  const seoInfo: SEOInfo = {};

  // meta description
  const metaDescription = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content');
  if (metaDescription) {
    seoInfo.description = metaDescription.trim();
  }

  // meta keywords
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  if (metaKeywords) {
    seoInfo.keywords = metaKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }

  // Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (ogTitle) {
    seoInfo.ogTitle = ogTitle.trim();
  }

  const ogDescription = $('meta[property="og:description"]').attr('content');
  if (ogDescription) {
    seoInfo.ogDescription = ogDescription.trim();
  }

  const ogKeywords = $('meta[property="og:keywords"]').attr('content');
  if (ogKeywords) {
    seoInfo.ogKeywords = ogKeywords.trim();
  }

  return seoInfo;
}

export async function scrapeUrl(url: string): Promise<{ title: string; content: string; seoInfo: SEOInfo }> {
  // SPA인 경우 Puppeteer 사용
  if (isSPAUrl(url)) {
    console.log('[Scraper] SPA 감지, Puppeteer 사용:', url);
    const result = await scrapeUrlWithPuppeteer(url);
    return { ...result, seoInfo: {} }; // Puppeteer는 나중에 SEO 추출 추가
  }
  
  // 일반 페이지는 기존 방식 사용
  console.log('[Scraper] 일반 크롤링 사용:', url);
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // SEO 정보 추출
    const seoInfo = extractSEOInfo($);
    console.log('[Scraper] SEO 정보 추출:', {
      description: seoInfo.description?.substring(0, 50),
      keywords: seoInfo.keywords?.length || 0,
      ogTitle: seoInfo.ogTitle?.substring(0, 50),
    });

    // 불필요한 요소 제거 (더 많은 요소 제거)
    $(
      'script, style, nav, footer, header, iframe, noscript, ' +
      'aside, .sidebar, .advertisement, .ad, .ads, ' +
      '.cookie-banner, .social-share, .related-posts, ' +
      '.comments, #comments, .comment-section, ' +
      'button, .button, .btn, form, ' +
      '.menu, .navigation, .breadcrumb'
    ).remove();

    // 제목 추출
    const title = $('title').text() || $('h1').first().text() || 'No title';

    // 본문 추출 (여러 선택자 시도)
    let content = '';
    
    // 일반적인 아티클 선택자
    const articleSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.content',
      '.post-body',
      '.article-body',
    ];

    for (const selector of articleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // 선택자로 찾지 못한 경우 body 전체
    if (!content) {
      content = $('body').text();
    }

    // 공백 및 불필요한 문자 정리
    content = content
      // 연속된 공백을 하나로
      .replace(/\s+/g, ' ')
      // 연속된 줄바꿈을 하나로
      .replace(/\n+/g, '\n')
      // 특수문자 정리
      .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?;:\-()]/g, '')
      // 앞뒤 공백 제거
      .trim();

    // 내용이 너무 짧으면 에러
    if (content.length < 50) {
      throw new Error('추출된 내용이 너무 짧습니다. 페이지 구조를 확인하세요.');
    }

    // 최대 5,000자로 제한 (토큰 절약)
    content = content.substring(0, 5000);

    console.log(`[Scraper] 추출 완료 - 제목: ${title.substring(0, 50)}, 길이: ${content.length}자`);

    return { title, content, seoInfo };
  } catch (error) {
    throw new Error(`URL 크롤링 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

