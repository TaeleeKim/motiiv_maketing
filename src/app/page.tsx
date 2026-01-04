'use client';

import { useState } from 'react';
import Link from 'next/link';
import UrlInput from '@/components/UrlInput';
import ResultCard from '@/components/ResultCard';
import { AnalysisResult } from '@/types';
import { saveUtmRecord } from '@/lib/utm-storage';

export default function Home() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    urls: string[],
    options: { targetAudience: string; language: string; searchFilter: string[]; userKeywords: string[] }
  ) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls,
          targetAudience: options.targetAudience,
          language: options.language,
          searchFilter: options.searchFilter,
          userKeywords: options.userKeywords,
        }),
      });

      if (!response.ok) {
        // API route에서 반환한 에러 메시지 확인
        let errorMessage = 'API 요청 실패';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `API 요청 실패: ${errorData.error}`;
          } else {
            errorMessage = `API 요청 실패 (상태 코드: ${response.status})`;
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 상태 코드만 표시
          errorMessage = `API 요청 실패 (상태 코드: ${response.status})`;
        }
        console.error('[API] 요청 실패:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResults(data.results);
      
      if (typeof window !== 'undefined') {
        data.results.forEach((result: AnalysisResult) => {
          result.relatedPages.forEach((page) => {
            if (page.trackingUrl) {
              try {
                const url = new URL(page.trackingUrl);
                const source = url.searchParams.get('utm_source') || 'unknown';
                const medium = url.searchParams.get('utm_medium') || 'comment';
                const campaign = url.searchParams.get('utm_campaign') || 'unknown';
                
                saveUtmRecord({
                  originalUrl: page.url,
                  trackingUrl: page.trackingUrl,
                  source,
                  medium,
                  campaign,
                  title: page.title,
                  filter: page.filter,
                });
              } catch (error) {
                console.error('UTM 저장 실패:', error);
              }
            }
          });
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 헤더 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            MOTIIV Marketing Workbench
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            URL 분석 → 키워드 추출 → 관련 커뮤니티 추천
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm sm:text-base text-blue-600 hover:text-blue-800 underline"
            >
              UTM 대시보드
            </Link>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="mb-8">
          <UrlInput onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">URL을 분석하고 있습니다...</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 결과 */}
        {results.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              분석 결과
            </h2>
            {results.map((result, idx) => (
              <ResultCard key={idx} result={result} />
            ))}
          </div>
        )}

        {/* 안내 메시지 */}
        {!loading && results.length === 0 && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 text-center">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
              사용 방법
            </h3>
            <ol className="text-left text-sm sm:text-base text-blue-800 space-y-2 max-w-2xl mx-auto">
              <li>1. 분석할 URL을 입력하세요 (여러 개 가능)</li>
              <li>2. 타겟 독자와 언어 설정을 확인하세요</li>
              <li>3. 분석 시작 버튼을 클릭하세요</li>
              <li>4. 결과에서 추천 페이지와 댓글 초안을 확인하세요</li>
              <li>5. UTM 파라미터가 포함된 추적 링크를 사용하세요</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

