"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Building2, Calendar, ExternalLink, Globe, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CreateBrandModal } from "@/components/dashboard/create-brand-modal";
import { toast } from "sonner";


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

export default function ProjectsPage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [confirmText, setConfirmText] = useState("");
  useEffect(() => {
    if (user?.id) {
      fetchBrands();
    }
  }, [user?.id]);

  const fetchBrands = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("brand_project")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching brands:", error);
        setError("Failed to load brands");
        return;
      }

      setBrands((data as unknown as Brand[]) || []);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete || confirmText !== brandToDelete.name) {
      return;
    }

    try {
      const { error } = await supabase
        .from("brand_project")
        .delete()
        .eq("id", brandToDelete.id)
        .eq("user_id", user?.id || "");

      if (error) {
        console.error("Error deleting brand:", error);
        setError("Failed to delete brand project");
        return;
      }

      // Remove the brand from the local state
      setBrands(brands.filter(brand => brand.id !== brandToDelete.id));
      toast.success("Brand project deleted successfully");
      
      // Reset the dialog state
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      setConfirmText("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete brand project");
      setError("Failed to delete brand project");
    }
  };

  const openDeleteDialog = (brand: Brand) => {
    setBrandToDelete(brand);
    setConfirmText("");
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return(
        <div className="h-full text-white flex flex-col items-center justify-center">
        <div className="px-4 sm:px-5 py-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchBrands} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Brand Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view analysis for all your brand projects
          </p>
        </div>
        <Button onClick={() => setShowBrandModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full">Create Brand</Button>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Brand Projects Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first brand project to start analyzing your brand&apos;s performance
          </p>
          <Button onClick={() => setShowBrandModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full">Create Brand</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {brand.logo_url ? (
                      <Image
                        src={brand.logo_url}
                        alt={brand.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain rounded-lg border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      {brand.industry && (
                        <Badge variant="secondary" className="mt-1">
                          {brand.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {brand.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary truncate flex-1"
                      >
                        {brand.website.replace(/^https?:\/\//, "")}
                      </a>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                  
                  {brand.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{brand.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(brand.created_at)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-500">
                    <Link href={`/dashboard/projects/${encodeURIComponent(brand.name)}`}>
                      View Analysis
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    onClick={() => openDeleteDialog(brand)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <CreateBrandModal showBrandModal={showBrandModal} setShowBrandModal={setShowBrandModal} />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the brand project 
              <strong> &quot;{brandToDelete?.name}&quot;</strong> and all associated data.
              <br /><br />
              To confirm deletion, please type the brand name exactly: <strong>{brandToDelete?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Type the brand name to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setBrandToDelete(null);
                setConfirmText("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              disabled={confirmText !== brandToDelete?.name}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
