/* eslint-disable @typescript-eslint/no-unused-vars */
import { Brand } from "@/contexts/brand-data-context";
import { supabase } from "@/lib/supabase";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { CloudUpload } from "lucide-react";
import Image from "next/image";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { v4 as uuidv4 } from "uuid";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from "../ui/dialog";
import { countries } from "@/lib/countries";

interface AttachBrandModalProps {
  showBrandModal: boolean;
  setShowBrandModal: (show: boolean) => void;
  setAttachedBrand: (brand: Brand) => void;
  setLocation: (location: string) => void;
}

export const AttachBrandModal = ({
  showBrandModal,
  setShowBrandModal,
  setAttachedBrand,
  setLocation,
}: AttachBrandModalProps) => {
  const [sessionKey, setSessionKey] = useState("");

  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [brandLocation, setBrandLocation] = useState<string>("Global");
  const [brandLanguage, setBrandLanguage] = useState<string>("en");
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      setBrandName(selectedBrand.name);
      setBrandWebsite(selectedBrand.website || "");
      setBrandIndustry(selectedBrand.industry || "");
      setBrandLogoPreview(selectedBrand.logo_url || null);
      setBrandLocation(selectedBrand.location || "Global");
      setBrandLanguage(selectedBrand.language || "en");
    }
  }, [selectedBrand]);

  const fetchBrands = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSessionKey(session?.access_token || "");

      if (!user) {
        console.error("No authenticated user found");
        setLoading(false);
        return;
      }

      // Fetch brands where user_id matches and website and logo are not empty
      const { data, error } = await supabase
        .from("brand_project")
        .select("*")
        .eq("user_id", user.id)

      if (error) {
        console.error("Error fetching brands:", error);
        setLoading(false);
        return;
      }

      setBrands(data as unknown as Brand[]);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const handleAttachBrand = async () => {
    if(selectedBrand) {
      setAttachedBrand(selectedBrand as Brand);
      setLocation(selectedBrand.location as string || "Global");
      setShowBrandModal(false);
    } else {
      handleCreateBrand();
    }
  };

  const handleCreateBrand = async () => {
    if (!brandName || !brandWebsite || !brandIndustry) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create a brand");
        setSubmitting(false);
        return;
      }

      let logoData = null;

      // Convert file to base64 if provided
      if (brandLogo) {
        logoData = brandLogoPreview;
      }

      // Create brand record
      const brandId = uuidv4();
      const { data, error } = await supabase
        .from("brand_project")
        .insert([
          {
            id: brandId,
            name: brandName,
            logo_url: logoData,
            website: brandWebsite,
            industry: brandIndustry,
            user_id: user.id,
            location: brandLocation,
            language: brandLanguage,
          },
        ])
        .select();

      setLocation(brandLocation);

      if (error) {
        console.error("Error creating brand:", error);
        setSubmitting(false);
        return;
      }

      // Clear form
      setBrandName("");
      setBrandWebsite("");
      setBrandIndustry("");
      setBrandLogo(null);
      setBrandLogoPreview(null);
      setBrandLanguage("en");
      setBrandLocation("Global");
      setAttachedBrand(data[0] as unknown as Brand);
      setSubmitting(false);
      setShowBrandModal(false);
    } catch (error) {
      console.error("Error:", error);
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setBrandLogo(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const INDUSTRIES = [
    "Aerospace",
    "Agriculture",
    "Automotive",
    "Banking",
    "Beauty",
    "Biotechnology",
    "Construction",
    "Consulting",
    "E-commerce",
    "Education",
    "Energy",
    "Entertainment",
    "Fashion",
    "Finance",
    "Food & Beverage",
    "Gaming",
    "Government",
    "Healthcare",
    "Insurance",
    "Legal",
    "Logistics",
    "Manufacturing",
    "Marketing",
    "Media",
    "Mining",
    "Music",
    "Non-Profit",
    "Pharmaceuticals",
    "Publishing",
    "Real Estate",
    "Retail",
    "Security",
    "Sports",
    "Technology",
    "Telecommunications",
    "Transportation",
    "Travel",
    "Utilities",
    "Other",
  ];

  return (
    <Dialog open={showBrandModal} onOpenChange={setShowBrandModal}>
      <DialogOverlay />
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Attach Brand to Analysis</DialogTitle>
          <DialogDescription>
            Attach an existing brand to your analysis or create a new one. This will allow you to analyze the brand&apos;s performance and visibility across different AI search engines.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Brand Select */}
          {brands.length > 0 && (
          <div className="grid gap-2 w-full bg-blue-500/10 border border-blue-500/20 border-dashed p-4 rounded-md">
            <Label htmlFor="brand">Select your existing brand</Label>
            <Select
              value={selectedBrand?.id}
              onValueChange={(value) =>
                setSelectedBrand(
                  brands.find((brand) => brand.id === value) as Brand
                )
              }
            >
              <SelectTrigger className="bg-zinc-800 w-full">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}    
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={brandName}
              placeholder="Acme Corporation"
              onChange={(e) => setBrandName(e.target.value)}
              className="bg-zinc-800"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={brandWebsite}
              onChange={(e) => setBrandWebsite(e.target.value)}
              className="bg-zinc-800"
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="flex gap-2 w-full">
            <div className="grid gap-2 w-full">
              <Label htmlFor="industry">Industry</Label>
              <Select value={brandIndustry} onValueChange={setBrandIndustry}>
                <SelectTrigger className="bg-zinc-800 w-full">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:w-[300px]">
              <Label htmlFor="language" className="">
                Language
              </Label>
              <Select
                value={brandLanguage}
                onValueChange={(value) => setBrandLanguage(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 w-full">
            <Label htmlFor="country">Country</Label>
            <Select value={brandLocation} onValueChange={setBrandLocation}>
              <SelectTrigger className="bg-zinc-800 w-full">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Global">Global</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.label} value={country.label}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logo">Logo (optional)</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!brandLogoPreview ? (
                <div
                  onClick={openFileDialog}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleFileDrop}
                  className={`
                    h-32 w-full rounded-md border-2 border-dashed 
                    flex flex-col items-center justify-center p-4 
                    cursor-pointer transition-all duration-200
                    ${
                      isDragging
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center">
                    <CloudUpload className="w-5 h-5 text-zinc-400 mb-2" />
                    <div className="font-medium text-sm mb-1">
                      Click to upload
                    </div>
                    <div className="text-xs text-zinc-400">
                      or drag and drop your logo here
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-3">
                      PNG, JPG or SVG (max 5MB)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div className="w-28 h-28 p-3 rounded-md overflow-hidden bg-zinc-700 flex items-center justify-center mb-3">
                    <Image
                      src={brandLogoPreview}
                      alt="Preview"
                      width={50}
                      height={50}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFileDialog}
                    className="mt-2"
                  >
                    <CloudUpload className="w-4 h-4 mr-2" />
                    Change Logo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button
            onClick={handleAttachBrand}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Attaching..." : "Attach Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
