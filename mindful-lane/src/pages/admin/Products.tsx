import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, X, Filter } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

interface ApiProduct {
  _id: string; title: string; category: string; price: number;
  discountPrice?: number; stock: number; isFeatured: boolean;
  isTrending: boolean; badge?: string; status?: string;
  images: { url: string }[];
}

const AdminProducts = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search, category],
    queryFn: () =>
      api.get<{ success: boolean; data: ApiProduct[]; pagination: { total: number } }>(
        `/products?limit=50&showAll=true${search ? `&search=${encodeURIComponent(search)}` : ""}${category !== "All" ? `&category=${encodeURIComponent(category)}` : ""}`
      ),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-list"],
    queryFn: () => api.get<{ success: boolean; data: string[] }>("/products/categories"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteId(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to delete product");
    },
  });

  const products = data?.data || [];
  const categories = ["All", ...(categoriesData?.data || [])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-[2px]">PRODUCTS</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.pagination?.total || 0} total products</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-medium tracking-[1px] uppercase hover:bg-accent transition-colors no-underline"
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder="Search products..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 pl-9 pr-4 bg-background border border-border text-sm outline-none focus:border-foreground transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="py-2.5 px-3 bg-background border border-border text-sm outline-none focus:border-foreground text-foreground cursor-pointer">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-[1px] text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-secondary animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-secondary overflow-hidden shrink-0">
                          {p.images?.[0]?.url && (
                            <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                        <div>
                          <p className="font-normal text-sm line-clamp-1">{p.title}</p>
                          {p.badge && <span className="text-xs text-accent">{p.badge}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs uppercase tracking-[0.5px]">{p.category}</td>
                    <td className="px-5 py-3">
                      <div>
                        <span>{(p.discountPrice || p.price).toLocaleString("fr-DZ")} DA</span>
                        {p.discountPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-2">{p.price.toLocaleString("fr-DZ")}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-600" : "text-green-600"}`}>
                        {p.stock === 0 ? "Out of stock" : `${p.stock} units`}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {/* Publication status */}
                        <span className={`text-xs px-2 py-0.5 font-medium ${
                          p.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                          p.status === 'archived' ? 'bg-secondary text-muted-foreground' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {p.status === 'draft' ? 'Draft' : p.status === 'archived' ? 'Archived' : 'Active'}
                        </span>
                        {p.isFeatured && <span className="text-xs bg-secondary px-2 py-0.5 text-muted-foreground">Featured</span>}
                        {p.isTrending && <span className="text-xs bg-secondary px-2 py-0.5 text-muted-foreground">Trending</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/products/${p._id}/edit`}
                          className="p-1.5 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil size={14} />
                        </Link>
                        <button onClick={() => setDeleteId(p._id)}
                          className="p-1.5 hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600 bg-transparent border-none cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border p-8 max-w-sm w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-normal tracking-[1px] uppercase">Delete Product</h3>
              <button onClick={() => setDeleteId(null)} className="text-muted-foreground bg-transparent border-none cursor-pointer"><X size={18} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this product? This action cannot be undone and will also remove all associated reviews.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-border text-sm uppercase tracking-[1px] hover:border-foreground transition-colors bg-transparent cursor-pointer">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm uppercase tracking-[1px] border-none cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
