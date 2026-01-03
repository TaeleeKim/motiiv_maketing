'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllUtmRecords, deleteUtmRecord, clearAllUtmRecords, getUtmStats } from '@/lib/utm-storage';
import { UtmRecord } from '@/types';

export default function Dashboard() {
  const [records, setRecords] = useState<UtmRecord[]>([]);
  const [stats, setStats] = useState(getUtmStats());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const allRecords = getAllUtmRecords();
    setRecords(allRecords);
    setStats(getUtmStats());
  };

  const handleDelete = (id: string) => {
    if (confirm('이 UTM 레코드를 삭제하시겠습니까?')) {
      deleteUtmRecord(id);
      loadRecords();
    }
  };

  const handleClearAll = () => {
    if (confirm('모든 UTM 레코드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      clearAllUtmRecords();
      loadRecords();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRecords = records.filter(record => {
    if (filterSource !== 'all' && record.source !== filterSource) return false;
    if (filterCampaign !== 'all' && record.campaign !== filterCampaign) return false;
    return true;
  });

  const uniqueSources = Array.from(new Set(records.map(r => r.source))).sort();
  const uniqueCampaigns = Array.from(new Set(records.map(r => r.campaign))).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                UTM 관리 대시보드
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                생성된 UTM 링크를 관리하고 통계를 확인하세요
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                홈으로
              </Link>
              {records.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  전체 삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">전체 UTM</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">최근 7일</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.recentCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">소스 수</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{uniqueSources.length}</p>
          </div>
        </div>

        {/* 필터 */}
        {records.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">필터</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소스 (Source)
                </label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>
                      {source} ({stats.bySource[source] || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  캠페인 (Campaign)
                </label>
                <select
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  {uniqueCampaigns.map(campaign => (
                    <option key={campaign} value={campaign}>
                      {campaign} ({stats.byCampaign[campaign] || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* UTM 목록 */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">
              {records.length === 0
                ? '생성된 UTM이 없습니다. 홈에서 URL을 분석하여 UTM을 생성하세요.'
                : '필터 조건에 맞는 UTM이 없습니다.'}
            </p>
            {records.length === 0 && (
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                URL 분석하기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
                      {record.title || '제목 없음'}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        Source: {record.source}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        Medium: {record.medium}
                      </span>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        Campaign: {record.campaign}
                      </span>
                      {record.filter && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                          {record.filter}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 break-all">
                      원본 URL: {record.originalUrl}
                    </p>
                    <p className="text-xs text-gray-400">
                      생성일: {new Date(record.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors min-h-[44px] touch-manipulation"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UTM 추적 URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={record.trackingUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-md break-all"
                    />
                    <button
                      onClick={() => copyToClipboard(record.trackingUrl, record.id)}
                      className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors min-h-[44px] touch-manipulation whitespace-nowrap"
                    >
                      {copiedId === record.id ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 구글 애널리틱스 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            구글 애널리틱스 연동 안내
          </h3>
          <div className="text-sm sm:text-base text-blue-800 space-y-2">
            <p>
              구글 애널리틱스는 UTM 파라미터를 자동으로 추적합니다. 별도의 설정 없이도 GA 대시보드에서 성과를 확인할 수 있습니다.
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Google Analytics 4 (GA4)에서 "보고서" → "획득" → "캠페인" 메뉴로 이동</li>
              <li>UTM 파라미터별로 트래픽, 전환율 등을 확인할 수 있습니다</li>
              <li>utm_source, utm_medium, utm_campaign별로 필터링하여 분석 가능</li>
              <li>실시간 보고서에서 현재 활성 UTM 추적 가능</li>
            </ol>
            <p className="mt-3 font-medium">
              참고: 구글 애널리틱스는 UTM 파라미터를 자동으로 인식하므로 별도의 API 연동이 필요하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

