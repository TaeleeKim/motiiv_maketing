'use client';

import { useState } from 'react';

interface UrlInputProps {
  onSubmit: (urls: string[], options: { targetAudience: string; language: string; searchFilter: string[]; userKeywords: string[] }) => void;
  loading: boolean;
}

type FilterOption = 'reddit' | 'quora' | 'linkedin' | 'engineer_forum' | 'medium' | 'velog' | 'tistory' | 'naver' | 'brunch' | 'daum';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'quora', label: 'Quora' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'engineer_forum', label: '엔지니어 전문 포럼' },
  { value: 'medium', label: 'Medium' },
  { value: 'velog', label: 'Velog' },
  { value: 'tistory', label: 'Tistory' },
  { value: 'naver', label: 'Naver (블로그 + 카페)' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'daum', label: 'Daum' },
];

export default function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [urlText, setUrlText] = useState('https://motiiv.ai/en/article/view/311');
  const [targetAudience, setTargetAudience] = useState('구조/토목 엔지니어');
  const [language, setLanguage] = useState('both');
  const [searchFilters, setSearchFilters] = useState<FilterOption[]>(['reddit', 'quora', 'linkedin', 'engineer_forum', 'medium']);
  const [userKeywords, setUserKeywords] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const urls = urlText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0 && url.startsWith('http'));

    if (urls.length === 0) {
      alert('유효한 URL을 입력해주세요.');
      return;
    }

    if (searchFilters.length === 0) {
      alert('최소 하나의 검색 대상을 선택해주세요.');
      return;
    }

    const keywords = userKeywords
      .split('\n')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);

    onSubmit(urls, { targetAudience, language, searchFilter: searchFilters, userKeywords: keywords });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">URL 입력</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            분석할 URL (한 줄에 하나씩)
          </label>
          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            className="w-full h-32 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/article1&#10;https://example.com/article2"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            타겟 독자
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            키워드 언어
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="both">한국어 + 영어</option>
            <option value="ko">한국어만</option>
            <option value="en">영어만</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            추가 검색 키워드 (선택사항, 한 줄에 하나씩)
          </label>
          <textarea
            value={userKeywords}
            onChange={(e) => setUserKeywords(e.target.value)}
            className="w-full h-24 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="steel structure&#10;welding analysis&#10;structural engineering"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            입력한 키워드는 AI가 추출한 키워드와 함께 검색에 사용됩니다.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            검색 대상 (여러 개 선택 가능, 각 필터당 5개 결과)
          </label>
          <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
            {FILTER_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center mb-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={searchFilters.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSearchFilters([...searchFilters, option.value]);
                    } else {
                      setSearchFilters(searchFilters.filter((f) => f !== option.value));
                    }
                  }}
                  disabled={loading}
                  className="mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm sm:text-base text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {searchFilters.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              선택됨: {searchFilters.length}개 (예상 결과: {searchFilters.length * 5}개)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 text-base sm:text-lg font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation"
        >
          {loading ? '처리 중...' : '분석 시작'}
        </button>
      </form>
    </div>
  );
}

