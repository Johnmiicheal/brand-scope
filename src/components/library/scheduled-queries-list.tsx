/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, parseISO } from "date-fns";
import { EllipsisVertical, FilterX, Search, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
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
} from "../ui/alert-dialog";
import { Input } from "@/components/ui/input";

type FilterOptions = {
  frequency: "all" | "daily" | "weekly";
  mode: "all" | "DeepFocus" | "Voyager" | "Explorer";
  status: "all" | "active" | "paused"; // Add other statuses if needed
};

export type ScheduledQuery = {
  id: string;
  query: string;
  results: any | null; // Adjust based on how you store results
  last_analysis_at: string | null;
  next_analysis_at: string | null;
  user_id: string;
  frequency: "daily" | "weekly";
  mode: "DeepFocus" | "Voyager" | "Explorer" | null;
  mode_id: string | null;
  status: "active" | "paused" | "error"; // Ensure DB has this column
};

export function ScheduledQueriesList({
  queries: initialQueries,
  onSelectQuery,
}: {
  queries: ScheduledQuery[];
  onSelectQuery?: (query: ScheduledQuery) => void;
}) {
  const router = useRouter();
  const [queries, setQueries] = useState<ScheduledQuery[]>(initialQueries);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    frequency: "all",
    mode: "all",
    status: "all",
  });

  // Update local queries when initialQueries changes
  useEffect(() => {
    setQueries(initialQueries);
  }, [initialQueries]);

  // Updated filtering logic to include search
  const filteredQueries = useMemo(() => {
    return queries?.filter((query) => {
      const searchMatch = searchTerm === "" || 
        query.query.toLowerCase().includes(searchTerm.toLowerCase());
      const frequencyMatch =
        filters.frequency === "all" || query.frequency === filters.frequency;
      const modeMatch = filters.mode === "all" || query.mode === filters.mode;
      const statusMatch =
        filters.status === "all" || query.status === filters.status;
      return searchMatch && frequencyMatch && modeMatch && statusMatch;
    });
  }, [queries, filters, searchTerm]);

  const handleFilterChange = (
    filterType: keyof FilterOptions,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const resetFilters = () => {
    setFilters({
      frequency: "all",
      mode: "all",
      status: "all",
    });
  };

  const hasActiveFilters =
    filters.frequency !== "all" ||
    filters.mode !== "all" ||
    filters.status !== "all";

  // Helper to format dates or show 'Never'
  const formatDateDistance = (dateString: string | null) => {
    if (!dateString)
      return <span className="text-muted-foreground italic">Never</span>;
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error("Error parsing date:", dateString, e);
      return <span className="text-red-500">Invalid Date</span>;
    }
  };

  // Function to handle row click
  const handleRowClick = (queryId: string) => {
    router.push(`/dashboard/search/monitoring?mode_id=${queryId}`);
  };
    

  // Animation variants for individual items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 15 } },
  };

  // Add functions to handle deactivate and delete
  const handleDeactivate = async (query: ScheduledQuery) => {
    try {
      setLoadingStates(prev => ({ ...prev, [query.id]: true }));
      const newStatus = query.status === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('scheduled_queries')
        .update({ status: newStatus })
        .eq('id', query.id);

      if (error) throw error;

      // Update local state immediately
      setQueries(currentQueries => 
        currentQueries.map(q => 
          q.id === query.id 
            ? { ...q, status: newStatus }
            : q
        )
      );
      
      toast({
        title: newStatus === 'paused' ? "Prompt Deactivated" : "Prompt Activated",
        description: newStatus === 'paused'
          ? "The prompt has been paused and will not be analyzed." 
          : "The prompt has been activated and will resume analysis.",
      });
    } catch (error) {
      console.error('Error updating prompt status:', error);
      toast({
        title: "Error",
        description: "Failed to update the prompt status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [query.id]: false }));
    }
  };

  const handleDelete = async (query: ScheduledQuery) => {
    try {
      setLoadingStates(prev => ({ ...prev, [query.id]: true }));
      const { error } = await supabase
        .from('scheduled_queries')
        .delete()
        .eq('id', query.id);
      // Also delete related search results
      if (query.mode_id) {
        const { error: searchResultsError } = await supabase
          .from('search_results')
          .delete()
          .eq('mode_id', query.mode_id);
        
        if (searchResultsError) {
          console.error('Error deleting related search results:', searchResultsError);
          // Continue with deletion even if this fails
        }
      }

      if (error) throw error;

      // Update local state immediately
      setQueries(currentQueries => 
        currentQueries.filter(q => q.id !== query.id)
      );
      
      toast({
        title: "Prompt Deleted",
        description: "The prompt has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: "Error",
        description: "Failed to delete the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [query.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={filters.frequency}
            onValueChange={(value) => handleFilterChange("frequency", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              {/* Add more statuses if needed */}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <FilterX className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Data Display Section */}
      <div>
        {filteredQueries?.length! > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-[#e2e2e2]/50 dark:border-accent">
                <TableHead>Query</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Last Analyzed</TableHead>
                <TableHead>Next Analysis</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredQueries?.map((query, index) => (
                  <motion.tr
                    key={query.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    custom={index}
                    className="hover:bg-muted/40"
                  >
                    <TableCell className="font-medium truncate max-w-xs">
                      {query.query}
                    </TableCell>
                    <TableCell className="capitalize">
                      {query.frequency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          query.status === "active"
                            ? "success"
                            : query.status === "paused"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {query.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {"Global"}
                    </TableCell>
                    <TableCell>
                      {formatDateDistance(query.last_analysis_at)}
                    </TableCell>
                    <TableCell>
                      {formatDateDistance(query.next_analysis_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Query Actions"
                          >
                            <EllipsisVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelectQuery?.(query)}>
                            View on Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRowClick(query?.mode_id!)}>
                            View on Page
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-amber-500 hover:!bg-amber-500/10 hover:!text-amber-500"
                            onClick={() => handleDeactivate(query)}
                            disabled={loadingStates[query.id]}
                          >
                            {loadingStates[query.id] ? (
                              <div className="flex items-center">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mr-2" />
                                {query.status === 'active' ? 'Deactivating...' : 'Activating...'}
                              </div>
                            ) : (
                              `${query.status === 'active' ? 'Deactivate' : 'Activate'} Prompt`
                            )}
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive hover:!bg-destructive/10 hover:!text-destructive"
                                onSelect={(e) => e.preventDefault()}
                                disabled={loadingStates[query.id]}
                              >
                                {loadingStates[query.id] ? (
                                  <div className="flex items-center">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent mr-2" />
                                    Deleting...
                                  </div>
                                ) : (
                                  'Delete Prompt'
                                )}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this prompt and all its analysis history.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(query)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No queries found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {queries.length === 0
                ? "You haven't created any scheduled queries yet."
                : "No queries match your current filters. Try adjusting your search or filters."}
            </p>
            {queries.length > 0 && hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-4"
              >
                <FilterX className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
