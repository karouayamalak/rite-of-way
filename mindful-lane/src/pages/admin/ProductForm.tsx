import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, Plus, Loader } from "lucide-react";
import { api, API_URL, ApiError } from "@/lib/api";
import { toast } from "sonner";

const SIZES_CLOTHING = ["XS", "S", "M", "L", "XL", "XXL"];
const SIZES_SHOES = ["39", "40", "41", "42", "43", "44", "45"];
const CATEGORIES = ["Hoodies", "T-Shirts", "Sweatshirts", "Pants", "Hats", "Glasses", "Shoes", "Jackets", "Accessories"];

interface ProductImage { url: string; publicId: string; alt?: string; }

interface ProductFormData {
  title: string; description: string; price: string; discountPrice: string;
  brand: string; category: string; sizes: string[]; colors: string[];
  stock: string; badge: string; isFeatured: boolean; isTrending: boolean; isNew: boolean;
  images: ProductImage[];
}

const EMPTY_FORM: ProductFormData = {
  title: "", description: "", price: "", discountPrice: "", brand: "",
  category: "", sizes: [], colors: [], stock: "0", badge: "",
  isFeatured: false, isTrending: false, isNew: false, images: [],
};

const AdminProductForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [colorInput, setColorInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Load existing product if editing
  const { data: productData } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => api.get<{ success: boolean; data: ProductFormData & { _id: string } }>(`/products/${id}`),
    enabled: isEditing,
  });

  useEffect(() => {
    if (productData?.data) {
      const p = productData.data as ProductFormData & { _id: string; price: number; discountPrice?: number; stock: number };
      setForm({
        title: (p as unknown as { title: string }).title || "",
        description: (p as unknown as { description: string }).description || "",
        price: String((p as unknown as { price: number }).price || ""),
        discountPrice: String((p as unknown as { discountPrice?: number }).discountPrice || ""),
        brand: (p as unknown as { brand?: string }).brand || "",
        category: (p as unknown as { category: string }).category || "",
        sizes: (p as unknown as { sizes: string[] }).sizes || [],
        colors: (p as unknown as { colors: string[] }).colors || [],
        stock: String((p as unknown as { stock: number }).stock || 0),
        badge: (p as unknown as { badge?: string }).badge || "",
        isFeatured: (p as unknown as { isFeatured: boolean }).isFeatured || false,
        isTrending: (p as unknown as { isTrending: boolean }).isTrending || false,
        isNew: (p as unknown as { isNew: boolean }).isNew || false,
        images: (p as unknown as { images: ProductImage[] }).images || [],
      });
    }
  }, [productData]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEditing ? api.put(`/products/${id}`, data) : api.post("/products", data),
    onSuccess: () => {
      toast.success(isEditing ? "Product updated!" : "Product created!");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/products");
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to save product");
    },
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const token = localStorage.getItem("row_token");
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));
      const res = await fetch(`${API_URL}/api/upload/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const newImages: ProductImage[] = data.data.map((img: { url: string; publicId: string }) => ({
        url: img.url, publicId: img.publicId, alt: form.title,
      }));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
      toast.success(`${newImages.length} image${newImages.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      toast.error("Image upload failed. Make sure Cloudinary is configured.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
    }));
  };

  const addColor = () => {
    const c = colorInput.trim();
    if (c && !form.colors.includes(c)) {
      setForm((prev) => ({ ...prev, colors: [...prev.colors, c] }));
    }
    setColorInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.price || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    const payload = {
      title: form.title, description: form.description,
      price: Number(form.price),
      ...(form.discountPrice ? { discountPrice: Number(form.discountPrice) } : {}),
      brand: form.brand, category: form.category,
      sizes: form.sizes, colors: form.colors,
      stock: Number(form.stock),
      badge: form.badge || undefined,
      isFeatured: form.isFeatured, isTrending: form.isTrending, isNew: form.isNew,
      images: form.images,
    };
    saveMutation.mutate(payload);
  };

  const inputClass = "w-full py-2.5 px-3 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground";
  const labelClass = "block text-xs uppercase tracking-[1px] text-muted-foreground mb-2";
  const checkboxClass = "w-4 h-4 accent-foreground cursor-pointer";

  return (
    <div className="max-w-[900px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/admin/products")} className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-[2px]">{isEditing ? "EDIT PRODUCT" : "ADD PRODUCT"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{isEditing ? "Update product details" : "Create a new product"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="border border-border p-6 space-y-4">
          <h2 className="text-sm uppercase tracking-[1px] mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Product title" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Product description..." rows={4} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Brand name" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="border border-border p-6">
          <h2 className="text-sm uppercase tracking-[1px] mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Price (DA) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 12500" min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sale Price (DA)</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                placeholder="Optional" min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock *</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Badge Label</label>
              <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="e.g. New, Limited, Best Seller" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="border border-border p-6 space-y-6">
          <h2 className="text-sm uppercase tracking-[1px]">Sizes & Colors</h2>

          {/* Sizes */}
          <div>
            <label className={labelClass}>Sizes</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[...SIZES_CLOTHING, ...SIZES_SHOES, "One Size"].map((size) => (
                <button type="button" key={size} onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 text-xs border transition-colors cursor-pointer ${form.sizes.includes(size) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className={labelClass}>Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.colors.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-sm">
                  {c}
                  <button type="button" onClick={() => setForm({ ...form, colors: form.colors.filter((col) => col !== c) })}
                    className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                placeholder="Add color (e.g. Black)" className={`${inputClass} flex-1`} />
              <button type="button" onClick={addColor}
                className="px-4 py-2 bg-foreground text-background text-xs uppercase tracking-[1px] border-none cursor-pointer hover:bg-accent transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="border border-border p-6">
          <h2 className="text-sm uppercase tracking-[1px] mb-4">Product Images</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {form.images.map((img, i) => (
              <div key={i} className="relative aspect-[3/4] bg-secondary overflow-hidden group">
                <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 w-7 h-7 bg-background/80 flex items-center justify-center text-foreground border-none cursor-pointer hover:bg-background transition-colors opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
                {i === 0 && <span className="absolute bottom-2 left-2 text-[10px] bg-foreground text-background px-2 py-0.5 uppercase tracking-[0.5px]">Main</span>}
              </div>
            ))}

            {/* Upload zone */}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className="aspect-[3/4] border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent disabled:opacity-50">
              {isUploading ? <Loader size={20} className="animate-spin" /> : <><Upload size={20} /><span className="text-xs uppercase tracking-[1px]">Upload</span></>}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)} />
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — Max 10MB each. First image is the main product image.</p>
        </div>

        {/* Status flags */}
        <div className="border border-border p-6">
          <h2 className="text-sm uppercase tracking-[1px] mb-4">Product Status</h2>
          <div className="flex flex-wrap gap-6">
            {[
              { key: "isFeatured", label: "Featured (shown on homepage)" },
              { key: "isTrending", label: "Trending" },
              { key: "isNew", label: "New Arrival" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className={checkboxClass} />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate("/admin/products")}
            className="px-8 py-3 border border-border text-sm uppercase tracking-[1px] hover:border-foreground transition-colors bg-transparent cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={saveMutation.isPending}
            className="px-8 py-3 bg-foreground text-background text-sm uppercase tracking-[1px] border-none cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 inline-flex items-center gap-2">
            {saveMutation.isPending ? <><Loader size={14} className="animate-spin" /> Saving...</> : isEditing ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
