/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { EllipsisVertical, FilterX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

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
  queries,
  onSelectQuery,
}: {
  queries: ScheduledQuery[];
  onSelectQuery?: (query: ScheduledQuery) => void;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterOptions>({
    frequency: "all",
    mode: "all",
    status: "all", // Default to 'active' if you prefer
  });


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
        {filteredQueries?.length! > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
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
                          <DropdownMenuItem className="text-amber-500 hover:!bg-amber-500/10 hover:!text-amber-500">
                            Deactivate Prompt
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive hover:!bg-destructive/10 hover:!text-destructive">
                            Delete Prompt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
