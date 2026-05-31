import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import Newsletter from "@/components/Newsletter";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { type Product } from "@/lib/cart-context";

interface ApiProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: { url: string; alt?: string }[];
  badge?: string;
  description?: string;
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
  isFeatured: boolean;
  isTrending: boolean;
}

interface ProductsResponse {
  success: boolean;
  data: ApiProduct[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// Map API product to cart Product type
const mapProduct = (p: ApiProduct): Product => ({
  id: p._id,
  title: p.title,
  price: p.discountPrice || p.price,
  image: p.images?.[0]?.url || `https://placehold.co/800x1067/f0f0f0/333333?text=${encodeURIComponent(p.title)}`,
  badge: p.badge,
  description: p.description,
  category: p.category,
});

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Best Rated" },
];

const ProductSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-[400px] w-full" />
    <Skeleton className="h-4 w-3/4 mx-auto" />
    <Skeleton className="h-4 w-1/2 mx-auto" />
    <Skeleton className="h-9 w-32 mx-auto" />
  </div>
);

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    clearTimeout((window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const [sortField, sortOrder] = sortBy.split("-");

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "12",
    sort: sortField,
    order: sortOrder,
    ...(activeCategory !== "All" && { category: activeCategory }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", activeCategory, debouncedSearch, sortBy, page],
    queryFn: () => api.get<ProductsResponse>(`/products?${queryParams}`),
    staleTime: 1000 * 60 * 2,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-list"],
    queryFn: () => api.get<{ success: boolean; data: string[] }>("/products/categories"),
    staleTime: 1000 * 60 * 10,
  });

  const categories = useMemo(
    () => ["All", ...(categoriesData?.data || [])],
    [categoriesData]
  );

  const products = data?.data || [];
  const pagination = data?.pagination;

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <main className="pt-20">
      <section className="bg-secondary py-20 px-5 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-light tracking-[3px] mb-4">SHOP</motion.h1>
        <p className="text-muted-foreground max-w-[500px] mx-auto mb-8">
          Browse our full collection of thoughtfully crafted pieces
        </p>

        {/* Search Bar */}
        <div className="max-w-[500px] mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full py-3 pl-12 pr-10 bg-background border border-border text-foreground text-sm tracking-[0.5px] outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setDebouncedSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </section>

      <section className="py-16 px-5 max-w-[1400px] mx-auto">
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => handleCategoryChange(cat)}
                className={`px-5 py-2 text-xs uppercase tracking-[1px] border transition-colors duration-300 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-foreground border-border hover:border-foreground"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Sort + count */}
          <div className="flex items-center gap-4 shrink-0">
            {pagination && (
              <span className="text-xs text-muted-foreground uppercase tracking-[1px]">
                {pagination.total} product{pagination.total !== 1 ? "s" : ""}
              </span>
            )}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="text-xs uppercase tracking-[1px] bg-background border border-border text-foreground py-2 px-3 outline-none focus:border-foreground cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${debouncedSearch}-${sortBy}-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFetching ? 0.6 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : products.length > 0 ? (
              products.map((p, i) => (
                <ProductCard key={p._id} product={mapProduct(p)} index={i} slug={p.slug} />
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-muted-foreground text-lg">No products found</p>
                <button
                  onClick={() => { setSearchQuery(""); setDebouncedSearch(""); setActiveCategory("All"); }}
                  className="mt-4 text-sm text-accent underline bg-transparent border-none cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 text-sm border transition-colors ${
                  p === page ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </section>

      <Newsletter />
    </main>
  );
};

export default Shop;
