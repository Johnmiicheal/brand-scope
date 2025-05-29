'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { MoreHorizontal, Plus, Search, ScrollText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledQueriesList, ScheduledQuery } from '@/components/library/scheduled-queries-list';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";


interface SearchRecord {
  mode_id: string;
  mode: string;
  query: string;
  analyzed_at: string;
  reasoning: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [scheduledQueries, setScheduledQueries] = useState<ScheduledQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      const fetchSearches = async () => {
        setLoading(true);        
        const { data, error } = await supabase
          .from('ai_rankings')
          .select(`
            mode_id,
            mode,
            query,
            analyzed_at,
            reasoning
          `)
          .eq('user_id', user.id)
          .order('analyzed_at', { ascending: false }) as { data: SearchRecord[] | null; error: Error | null };

          const { data: scheduledData, error: scheduledError } = await supabase
          .from('scheduled_queries')
          .select(`*`)
          .eq('user_id', user.id)
          .order('last_analysis_at', { ascending: false })
          .limit(100) as { data: ScheduledQuery[] | null; error: Error | null };
        
        if (error) {
          console.error("Error fetching search history:", error);
        } else if (scheduledError) {
          console.error("Error fetching scheduled queries:", scheduledError);
        } else {
          setSearches(data || []);
          setScheduledQueries(scheduledData || []);
        }
        
        setLoading(false);
      };
      
      fetchSearches();
    }
  }, [router, user, isLoading]);
  
  // Group by query to get unique searches
  const uniqueSearches = searches.reduce((acc, search) => {
    // Check if we already have this mode_id in our accumulator
    const existingIndex = acc.findIndex(item => item.mode_id === search.mode_id);
    
    // If not found, add it to the accumulator
    if (existingIndex === -1) {
      acc.push(search);
    }
    
    return acc;
  }, [] as SearchRecord[]);
    
  // Filter searches based on search term
  const filteredSearches = searchTerm.trim() === '' 
    ? uniqueSearches 
    : uniqueSearches.filter(search => 
        search.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredSearches.length / itemsPerPage);
  const paginatedSearches = filteredSearches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Animation variants for individual items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 15
      }
    }
  };
  
  // Add delete thread function
  const deleteThread = async (modeId: string) => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('ai_rankings')
        .delete()
        .eq('mode_id', modeId)
        .eq('user_id', user.id);

      // Also delete related search results
      if (modeId) {
        const { error: searchResultsError } = await supabase
          .from('search_results')
          .delete()
          .eq('mode_id', modeId);

        if (searchResultsError) {
          console.error('Error deleting related search results:', searchResultsError);
          // Continue with deletion even if this fails
        }
      }

      if (error) throw error;

      // Update local state to remove the deleted thread
      setSearches(prevSearches => prevSearches.filter(search => search.mode_id !== modeId));
      toast({
        title: "Thread deleted",
        description: "The thread has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        title: "Error",
        description: "Failed to delete the thread. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading || loading) {
    return (
      <div className="h-full text-white flex flex-col items-center justify-center">
        <div className="px-4 sm:px-5 py-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full min-h-screen text-white">
      <div className="relative flex flex-col w-full max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-5 py-4 gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-medium">Library</h1>
          </div>
          {/* Search Bar */}
          <div className="w-full sm:w-64 md:w-72 lg:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search your threads..."
                className="bg-zinc-800/50 border-zinc-700 pl-10 rounded-full text-white w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full p-0 text-zinc-400"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="threads" className="w-full">
        <TabsList className="mb-6 gap-4 bg-background">
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="scheduled" >Scheduled Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="threads">
        <div className="px-4 sm:px-5 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 border-b">
            <div className="flex items-center gap-2">
                <ScrollText className="w-4 sm:w-5 h-4 sm:h-5 text-zinc-500" />
                <h2 className="text-lg sm:text-xl font-semibold truncate">
                {searchTerm ? `Search Results (${filteredSearches.length})` : 'Threads'}
                </h2>
            </div>
            <Button variant="ghost" size="icon" className="text-zinc-400 rounded-full hover:text-white" onClick={() => router.push('/dashboard/search')}>
              <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
          </div>
          
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredSearches.length === 0 ? (
              <div className="text-center py-8 sm:py-10">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {searchTerm ? `No results found for "${searchTerm}"` : 'No search history found'}
                </p>
              </div>
            ) : (
              paginatedSearches.map((search, index) => (
                <motion.div 
                  key={search.mode_id}
                  variants={itemVariants}
                  custom={index}
                >
                  <div className="border-b border-zinc-800 pb-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <Link 
                          href={`/dashboard/search/analysis?mode_id=${search.mode_id}`}
                          className="flex-1"
                        >
                          <div className="font-medium text-sm sm:text-base line-clamp-2">{search.query}</div>
                          <div className="text-zinc-400 text-xs sm:text-sm line-clamp-2">
                            {search.reasoning}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center mt-2">
                            <div className="flex items-center text-xs text-zinc-400 bg-gradient-to-b from-zinc-900/40 to-zinc-900 border border-accent px-2 sm:px-3 py-1 sm:py-2 rounded-full truncate max-w-[160px] sm:max-w-none">
                              <span className="truncate">{search.mode}</span>
                            </div>
                            <div className="text-xs text-zinc-500">
                              {format(new Date(search.analyzed_at), "MMM d, yyyy")}
                            </div>
                          </div>
                        </Link>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Thread
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this thread and remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteThread(search.mode_id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
          
          {/* Pagination Controls */}
          {filteredSearches.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 border-zinc-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-zinc-400">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 border-zinc-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        </TabsContent>

        <TabsContent value="scheduled">
          {/* Embed the Scheduled Queries List component */}
          <ScheduledQueriesList queries={scheduledQueries} />
        </TabsContent>

      </Tabs>

        
      </div>
    </div>
  );
} 