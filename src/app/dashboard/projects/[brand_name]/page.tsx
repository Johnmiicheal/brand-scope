/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  Eye,
  Activity
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs";
import { ScheduledQueriesList, ScheduledQuery } from "@/components/library/scheduled-queries-list";
import { MonitoredSummary } from "@/components/dashboard/monitored-summary";

interface Brand {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  language: string | null;
  location: string | null;
  created_at: string;
}

interface AnalysisSession {
  id: string;
  user_id: string;
  mode: string;
  query_count: number;
  total_rankings: number;
  rankings_data: any;
  top_entities: any;
  stats: any;
  analyzed_at: string;
  created_at: string;
  query: string | null;
  attached_brand_id: string[];
}

export default function BrandProjectPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const brandName = decodeURIComponent(params.brand_name as string);
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [monitoredSessions, setMonitoredSessions] = useState<[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && brandName) {
      fetchBrandAndSessions();
    }
  }, [user?.id, brandName]);

  const fetchBrandAndSessions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // First, fetch the brand
      const { data: brandData, error: brandError } = await supabase
        .from("brand_project")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", brandName)
        .single();

      if (brandError || !brandData) {
        setError("Brand not found");
        return;
      }

      setBrand(brandData as unknown as Brand);

      // Then, fetch analysis sessions that have this brand attached
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("ai_ranking_sessions")
        .select("*")
        .eq("user_id", user.id)
        .contains("attached_brand_id", [brandData.id])
        .order("analyzed_at", { ascending: false });

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
        setError("Failed to load analysis sessions");
        return;
      }

      setSessions((sessionsData as unknown as AnalysisSession[]) || []);

      // Then, fetch monitored sessions that have this brand attached
      const { data: monitoredSessionsData, error: monitoredSessionsError } = await supabase
        .from("scheduled_queries")
        .select("*")
        .eq("user_id", user.id)
        .contains("attached_brand_id", [brandData.id]);

      if (monitoredSessionsError) {
        console.error("Error fetching monitored sessions:", monitoredSessionsError);
        setError("Failed to load monitored sessions");
        return;
      }

      setMonitoredSessions((monitoredSessionsData as unknown as []) || []);

    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load brand data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "voyager":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "explorer":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="h-full text-white flex flex-col items-center justify-center">
      <div className="px-4 sm:px-5 py-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Brand not found"}</p>
            <div className="space-x-2">
              <Button onClick={fetchBrandAndSessions} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push("/dashboard/projects")} variant="default">
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/projects")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      {/* Brand Info */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={brand.name}
              className="w-16 h-16 object-contain rounded-lg border"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {brand.industry && (
                <Badge variant="secondary">{brand.industry}</Badge>
              )}
              {brand.location && (
                <Badge variant="outline">{brand.location}</Badge>
              )}
            </div>
          </div>
        </div>

        {brand.website && (
          <p className="text-muted-foreground">
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              {brand.website}
            </a>
          </p>
        )}
      </div>

      {/* Analysis Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Analysis Sessions</h2>
            <p className="text-muted-foreground mt-1">
              {sessions.length + monitoredSessions.length} {sessions.length + monitoredSessions.length === 1 ? "session" : "sessions"} found
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/dashboard/search?attached_brand_id=${brand.id}`}>New Analysis</Link>
          </Button>
        </div>

        {sessions.length + monitoredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analysis Sessions Yet</h3>
            <p className="text-muted-foreground mb-6">
              This brand hasn&apos;t been used in any analysis sessions yet.
            </p>
            <Button asChild>
              <Link href="/dashboard/search">Start First Analysis</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="monitored">
            <TabsList className="bg-zinc-800/50 border-zinc-700 gap-4">
              <TabsTrigger value="monitored" className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Monitored Queries ({monitoredSessions.length})</TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:!bg-blue-600 data-[state=active]:!text-white">Search Analysis ({sessions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="analysis">
            <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getModeColor(session.mode)} flex items-center gap-1`}
                        >
                          {session.mode}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.analyzed_at)}
                        </Badge>
                      </div>
                      {session.query && (
                        <CardTitle className="text-lg font-medium">
                          {session.query}
                        </CardTitle>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.query_count}
                      </div>
                      <div className="text-sm text-muted-foreground">Queries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.total_rankings}
                      </div>
                      <div className="text-sm text-muted-foreground">Rankings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.top_entities ? Object.keys(session.top_entities).length : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Entities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.stats?.avg_score}%
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Score</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Session ID: {session.id.slice(0, 8)}...
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/search/analysis?mode_id=${session.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </TabsContent>
            <TabsContent value="monitored">
              <MonitoredSummary queries={monitoredSessions as unknown as ScheduledQuery[]} />
              <ScheduledQueriesList queries={monitoredSessions as unknown as ScheduledQuery[]} />
            </TabsContent>
          </Tabs>
         
        )}
      </div>
    </div>
  );
} 