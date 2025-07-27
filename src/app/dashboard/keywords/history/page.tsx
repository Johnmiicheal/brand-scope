"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  BarChart3, 
  Loader2,
  Trash2,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type KeywordAnalysis = {
  id: string;
  created_at: string;
  keyword_input: string;
  business_brief: string;
  website: string;
  total_keywords: number;
  keywords_data?: Array<{
    conversational_keyword: string;
    intent: string;
    google_seed_keyword: string;
    category: string;
    search_volume: number;
    competition_index: number;
    low_cpc: string;
    trend_6m: string;
    relevance_score: number;
  }>;
  top_keywords?: Array<unknown>;
  stats?: Record<string, unknown>;
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function KeywordHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<KeywordAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/keywords/history?user_id=${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load keyword analyses');
        } else {
          setAnalyses(data.history || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnalysisTitle = (analysis: KeywordAnalysis) => {
    return analysis.keyword_input || 
           analysis.business_brief?.slice(0, 50) + '...' || 
           'Keyword Analysis';
  };

  const handleCreateNew = () => {
    router.push('/dashboard/keywords');
  };

  const handleViewAnalysis = (analysisId: string) => {
    router.push(`/dashboard/keywords/history/${analysisId}`);
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!user?.id) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/keywords/history/${analysisId}?user_id=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete analysis');
      }

      // Remove from local state
      setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      setDeleteId(null);
      
      toast.success("Analysis Deleted");
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err instanceof Error ? err.message : "Failed to delete analysis");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-muted-foreground">Loading keyword analyses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col gap-6 p-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div className="flex flex-col gap-2" variants={slideUp}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Keyword Research History</h1>
              <p className="text-muted-foreground">
                View and manage your keyword analysis results
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew} className="bg-blue-500 hover:bg-blue-600 rounded-full">
            <Plus className="w-4 h-4" />
            New Analysis
          </Button>
        </div>
      </motion.div>

      {analyses.length === 0 ? (
        <motion.div variants={slideUp}>
          <Card className="text-center py-12">
            <CardContent>
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No keyword analyses yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your first keyword research to discover opportunities for your business.
              </p>
              <Button onClick={handleCreateNew} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Analysis
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={slideUp}>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analysis</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow 
                    key={analysis.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewAnalysis(analysis.id)}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium line-clamp-1">
                          {getAnalysisTitle(analysis)}
                        </div>
                        {analysis.business_brief && (
                          <div className="text-sm text-muted-foreground line-clamp-1 max-w-[400px] overflow-hidden text-ellipsis">
                                {analysis.business_brief}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {analysis.website ? (
                          <span className="truncate max-w-[200px]">{analysis.website}</span>
                        ) : (
                          <span className="text-muted-foreground/60">Not specified</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
                        <span>{analysis.total_keywords || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(analysis.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalysis(analysis.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(analysis.id);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Keyword Analysis</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this keyword analysis? This action cannot be undone and will permanently remove all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (deleteId) {
                                    handleDeleteAnalysis(deleteId);
                                  }
                                }}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete Analysis'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

        </motion.div>
      )}
    </motion.div>
  );
} 