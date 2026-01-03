import { UtmRecord } from '@/types';

const STORAGE_KEY = 'motiiv_utm_records';
const MAX_RECORDS = 1000;

export function saveUtmRecord(record: Omit<UtmRecord, 'id' | 'createdAt'>): UtmRecord {
  const utmRecord: UtmRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const records = getAllUtmRecords();
  records.unshift(utmRecord);
  
  const limitedRecords = records.slice(0, MAX_RECORDS);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedRecords));
  }
  
  return utmRecord;
}

export function getAllUtmRecords(): UtmRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as UtmRecord[];
  } catch {
    return [];
  }
}

export function deleteUtmRecord(id: string): boolean {
  const records = getAllUtmRecords();
  const filtered = records.filter(r => r.id !== id);
  
  if (filtered.length === records.length) {
    return false;
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  
  return true;
}

export function clearAllUtmRecords(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getUtmStats(): {
  total: number;
  bySource: Record<string, number>;
  byCampaign: Record<string, number>;
  recentCount: number;
} {
  const records = getAllUtmRecords();
  const bySource: Record<string, number> = {};
  const byCampaign: Record<string, number> = {};
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  let recentCount = 0;
  
  records.forEach(record => {
    bySource[record.source] = (bySource[record.source] || 0) + 1;
    byCampaign[record.campaign] = (byCampaign[record.campaign] || 0) + 1;
    
    if (new Date(record.createdAt) > sevenDaysAgo) {
      recentCount++;
    }
  });
  
  return {
    total: records.length,
    bySource,
    byCampaign,
    recentCount,
  };
}

