'use client';

import { AnalysisResult } from '@/types';
import { useState } from 'react';

const FILTER_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  quora: 'Quora',
  linkedin: 'LinkedIn',
  engineer_forum: '엔지니어 포럼',
  medium: 'Medium',
  velog: 'Velog',
  tistory: 'Tistory',
  naver: 'Naver',
  brunch: 'Brunch',
  daum: 'Daum',
  all: '전체',
};

const getFilterColorClasses = (filter: string): string => {
  const colorMap: Record<string, string> = {
    reddit: 'bg-red-100 text-red-700',
    quora: 'bg-blue-100 text-blue-700',
    linkedin: 'bg-purple-100 text-purple-700',
    engineer_forum: 'bg-green-100 text-green-700',
    medium: 'bg-orange-100 text-orange-700',
    velog: 'bg-yellow-100 text-yellow-700',
    tistory: 'bg-orange-100 text-orange-700',
    naver: 'bg-green-200 text-green-800',
    brunch: 'bg-amber-100 text-amber-700',
    daum: 'bg-indigo-100 text-indigo-700',
    all: 'bg-purple-100 text-purple-700',
  };
  
  return colorMap[filter] || 'bg-gray-100 text-gray-700';
};

interface ResultCardProps {
  result: AnalysisResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
      {/* 헤더 */}
      <div className="border-b pb-4 mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 break-words">{result.title}</h3>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm text-blue-600 hover:underline break-all"
        >
          {result.url}
        </a>
      </div>

      {/* 요약 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">요약</h4>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{result.summary}</p>
      </div>

      {/* 키워드 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">추출된 키워드</h4>
        <div className="flex flex-wrap gap-2">
          {result.keywords.map((keyword, idx) => (
            <span
              key={idx}
              className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm break-words"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 댓글 초안 */}
      {result.commentDrafts && result.commentDrafts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">댓글 초안</h4>
          <div className="space-y-3">
            {result.commentDrafts.map((draft, idx) => {
              const languageLabel = 
                draft.language === 'ko' ? '한국어 버전' :
                draft.language === 'en' ? '영어 버전' :
                '한국어/영어 혼합 버전';
              
              return (
                <div key={idx} className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-xs font-semibold text-gray-600">{languageLabel}</h5>
                    <button
                      onClick={() => copyToClipboard(draft.text, `comment-${idx}`)}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1 min-h-[32px] touch-manipulation"
                    >
                      {copiedUrl === `comment-${idx}` ? '복사됨!' : '복사'}
                    </button>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">{draft.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 관련 페이지 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          추천 댓글 대상 페이지 ({result.relatedPages.length}개)
        </h4>
        <div className="space-y-3">
          {result.relatedPages.map((page, idx) => (
            <div key={idx} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex-1 break-words"
                >
                  {page.title}
                </a>
                <div className="flex items-center gap-2 flex-wrap">
                  {page.filter && (
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getFilterColorClasses(page.filter)}`}>
                      {FILTER_LABELS[page.filter] || page.filter}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{page.source}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">{page.snippet}</p>
              {page.trackingUrl && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={page.trackingUrl}
                    readOnly
                    className="text-xs bg-gray-50 px-2 py-2 rounded border border-gray-200 flex-1 overflow-x-auto break-all"
                  />
                  <button
                    onClick={() => copyToClipboard(page.trackingUrl || '', `tracking-${idx}`)}
                    className="text-xs sm:text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 min-h-[44px] touch-manipulation whitespace-nowrap"
                  >
                    {copiedUrl === `tracking-${idx}` ? '복사됨!' : 'UTM 복사'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

