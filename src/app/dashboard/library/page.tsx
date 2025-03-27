'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { MoreHorizontal, Plus, Search, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface SearchRecord {
  mode_id: string;
  mode: string;
  query: string;
  analyzed_at: string;
  entity_id: string;
  entity_name: string;
  llm_name: string;
  reasoning: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
            entity_id,
            entity_name,
            llm_name,
            reasoning
          `)
          .eq('user_id', user.id)
          .order('analyzed_at', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error("Error fetching search history:", error);
        } else {
          setSearches(data || []);
        }
        
        setLoading(false);
      };
      
      fetchSearches();
    }
  }, [router]);
  
  // Group by query to get unique searches
  const uniqueSearches = searches.length ? 
    Array.from(new Map(searches.map(s => [s.mode_id, s])).values()) : 
    [];
    
  // Filter searches based on search term
  const filteredSearches = searchTerm.trim() === '' 
    ? uniqueSearches 
    : uniqueSearches.filter(search => 
        search.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
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
  
  if (isLoading || loading) {
    return (
      <div className="h-full bg-gradient-to-b from-background to-zinc-900 text-white flex flex-col items-center justify-center">
        <div className="px-5 py-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-gradient-to-b from-background to-zinc-900 text-white">
      <div className="relative flex flex-col w-5xl mx-auto">
        <div className="flex justify-between items-center px-5 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium">Library</h1>
          </div>
          {/* Search Bar */}
        <div className="px-5 py-2 mb-2 w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search your threads..."
              className="bg-zinc-800/50 border-zinc-700 pl-10 rounded-full text-white"
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

        <div className="px-5 py-6 ">
          <div className="flex items-center justify-between mb-4 border-b">
            <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-zinc-500" />
                <h2 className="text-xl font-semibold">
                {searchTerm ? `Search Results (${filteredSearches.length})` : 'Threads'}
                </h2>
            </div>
            <Button variant="ghost" size="icon" className="text-zinc-400 rounded-full hover:text-white" onClick={() => router.push('/dashboard/search')}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredSearches.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {searchTerm ? `No results found for "${searchTerm}"` : 'No search history found'}
                </p>
              </div>
            ) : (
              filteredSearches.map((search, index) => (
                <motion.div 
                  key={search.mode_id}
                  variants={itemVariants}
                  custom={index}
                >
                  <Link 
                    href={`/dashboard/search/analysis?mode_id=${search.mode_id}`} 
                    className="block"
                  >
                    <div className="border-b border-zinc-800 pb-4">
                      <div className="flex flex-col gap-2">
                        <div className="font-medium">{search.query}</div>
                        <div className="text-zinc-400 text-sm line-clamp-2">
                          {search.reasoning}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex gap-2 items-center">
                              <div className="flex items-center text-xs text-zinc-400 bg-gradient-to-b from-zinc-900/40 to-zinc-900 border border-accent px-3 py-2 rounded-full ">
                                  {search.mode}
                              </div>
                              <div className="text-xs text-zinc-500">
                              {format(new Date(search.analyzed_at), "MMM d, yyyy")}
                              </div>

                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 