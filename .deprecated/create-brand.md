# Create Brand Code

```
  // Form states for brand creation
  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found");
        setLoading(false);
        return;
      }

      // Fetch brands where user_id matches and website and logo are not empty
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", user.id)
        .not("website", "is", null)
        .not("logo_url", "is", null);

      if (error) {
        console.error("Error fetching brands:", error);
        setLoading(false);
        return;
      }

      setBrands(data || []);

      // Set the first brand as selected if available
      if (data && data.length > 0) {
        setSelectedBrand(data[0]);
      } else {
        // Show brand creation modal if no valid brands exist
        setShowBrandModal(true);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
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
        .from("brands")
        .insert([
          {
            id: brandId,
            name: brandName,
            logo_url: logoData,
            website: brandWebsite,
            industry: brandIndustry,
            user_id: user.id,
          },
        ])
        .select();

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

      // Close modal and refresh brands
      setShowBrandModal(false);
      fetchBrands();

      // Trigger brand analysis
      await analyzeBrand(brandId);

      setSubmitting(false);
    } catch (error) {
      console.error("Error:", error);
      setSubmitting(false);
    }
  };

  const analyzeBrand = async (brandId: string) => {
    try {
      setIsAnalyzing(true);
      // Call the analysis API
      const response = await fetch(
        process.env.NEXT_PUBLIC_ANALYZE_BRAND as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionKey}`,
          },
          body: JSON.stringify({
            brandId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brand analysis failed:", errorData);
        setIsAnalyzing(false);
        return;
      }

      const data = await response.json();
      if (data) {
        window.location.reload();
      }
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing brand:", error);
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!brand) return;
    
    console.log("Selected Monitoring Frequency:", monitoringFrequency);

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_ANALYZE_BRAND as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionKey}`,
          },
          body: JSON.stringify({ brandId: brand.id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brand analysis failed:", errorData);
        setIsAnalyzing(false);
        return;
      }

      // Refetch brand data to get updated metrics
      await refetch();
    } catch (error) {
      console.error("Error analyzing brand:", error);
    } finally {
      setIsAnalyzing(false);
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
```