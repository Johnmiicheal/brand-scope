/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, parseISO } from "date-fns";
import { FilterX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

type FilterOptions = {
  frequency: "all" | "daily" | "weekly";
  mode: "all" | "DeepFocus" | "Voyager" | "Explorer";
  status: "all" | "active" | "paused"; // Add other statuses if needed
};

export type ScheduledQuery = {
  id: string;
  query: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any | null; // Adjust based on how you store results
  last_analysis_at: string | null;
  next_analysis_at: string | null;
  user_id: string;
  frequency: "daily" | "weekly";
  mode: "DeepFocus" | "Voyager" | "Explorer" | null;
  mode_id: string | null;
  status: "active" | "paused" | "error"; // Ensure DB has this column
};

export function ScheduledQueriesList() {
  const { user } = useAuth();
  const router = useRouter();
  const [queries, setQueries] = useState<ScheduledQuery[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    frequency: "all",
    mode: "all",
    status: "all", // Default to 'active' if you prefer
  });

  // Fetch queries
  useEffect(() => {
    const fetchQueries = async () => {
      if (!user?.id) {
        setLoading(false);
        setQueries(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from("scheduled_queries")
          .select("*")
          .eq("user_id", user.id)
          .order("last_analysis_at", { ascending: false, nullsFirst: true }); // Sort by last analyzed (newest first)

        if (dbError) throw dbError;

        setQueries(data || []);
      } catch (err: any) {
        console.error("Error fetching scheduled queries:", err);
        setError("Failed to load scheduled queries.");
        setQueries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, [user?.id]);

  // Filtering logic
  const filteredQueries = useMemo(() => {
    return queries?.filter((query) => {
      const frequencyMatch =
        filters.frequency === "all" || query.frequency === filters.frequency;
      const modeMatch = filters.mode === "all" || query.mode === filters.mode;
      const statusMatch =
        filters.status === "all" || query.status === filters.status; // Assumes 'status' column exists
      return frequencyMatch && modeMatch && statusMatch;
    });
  }, [queries, filters]);

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

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex justify-end flex-wrap items-center gap-4 mb-10">
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
          value={filters.mode}
          onValueChange={(value) => handleFilterChange("mode", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="DeepFocus">DeepFocus</SelectItem>
            <SelectItem value="Voyager">Voyager</SelectItem>
            <SelectItem value="Explorer">Explorer</SelectItem>
            {/* Add more modes if needed */}
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

      {/* Data Display Section */}
      <div>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && filteredQueries?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {queries?.length === 0
              ? "You haven't scheduled any queries for monitoring yet."
              : "No scheduled queries match the current filters."}
          </p>
        )}
        {!loading && !error && filteredQueries?.length! > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
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
                    onClick={() => handleRowClick(query?.mode_id!)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium truncate max-w-xs">
                      {query.query}
                    </TableCell>
                    <TableCell>
                      {query.mode ? (
                        <Badge variant="outline">{query.mode}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                      {formatDateDistance(query.last_analysis_at)}
                    </TableCell>
                    <TableCell>
                      {formatDateDistance(query.next_analysis_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Query Actions"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM8.625 12.5C8.625 13.1213 8.12132 13.625 7.5 13.625C6.87868 13.625 6.375 13.1213 6.375 12.5C6.375 11.8787 6.87868 11.375 7.5 11.375C8.12132 11.375 8.625 11.8787 8.625 12.5Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
