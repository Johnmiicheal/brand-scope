/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
'use client';

import { useAuth } from '@/hooks/useAuth';
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  user_id: string;
  location: string;
  language: string;
  created_at: string;
}

export interface BrandMetrics {
  id: string;
  brand_id: string;
  visibility_score: number;
  positive_sentiment: number;
  negative_sentiment: number;
  neutral_sentiment: number;
  detection_rate: number;
  brand_mentions: number;
  brand_citations: string[];
  consumer_perception: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  analyzed_at: string;
}

export interface Competitor {
  id: string;
  user_id: string;
  brand_id: string;
  name: string;
  website: string | null;
  industry: string;
  ranking_diff: number;
  created_at: string;
}

export interface Keyword {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  user_id: string;
  keyword: string;
  search_volume: number;
  difficulty: number;
  opportunity_score: number;
  created_at: string;
}

export interface BrandDataContextType {
  brand: Brand | null;
  metrics: BrandMetrics | null;
  competitors: Competitor[];
  keywords: Keyword[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BrandDataContext = createContext<BrandDataContextType | undefined>(undefined);

export function BrandDataProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [metrics, setMetrics] = useState<BrandMetrics | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchBrandData = useCallback(async (userId: string) => {
    if (!userId) {
        console.warn("fetchBrandData called without userId");
        setIsLoading(false);
        return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BRAND_DATA}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session}`
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch brand data');
      }

      const { data } = await response.json();
      
      setBrand(data.brand);
      setMetrics(data.metrics);
      setCompetitors(data.competitors);
      setKeywords(data.keywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brand data');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (user?.id) {
      fetchBrandData(user.id);
    }
  }, [user?.id, fetchBrandData]);

  const refetch = useCallback(() => {
    return user?.id ? fetchBrandData(user.id) : Promise.resolve();
  }, [user?.id, fetchBrandData]);

  const value = useMemo(() => ({
    brand,
    metrics,
    competitors,
    keywords,
    isLoading,
    error,
    refetch,
  }), [
    brand,
    metrics,
    competitors,
    keywords,
    isLoading,
    error,
    refetch
  ]);

  return (
    <BrandDataContext.Provider value={value}>
      {children}
    </BrandDataContext.Provider>
  );
}

export function useBrandData() {
  const context = useContext(BrandDataContext);
  if (context === undefined) {
    throw new Error('useBrandData must be used within a BrandDataProvider');
  }
  return context;
} 