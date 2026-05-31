import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, ArrowLeft, Minus, Plus, Check, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ApiProduct {
  _id: string; title: string; slug: string; description: string;
  price: number; discountPrice?: number; category: string;
  sizes: string[]; colors: string[]; stock: number;
  images: { url: string; alt?: string }[];
  badge?: string;
  ratings: { average: number; count: number };
  variants?: {
    color: string;
    sizes: { size: string; stock: number }[];
  }[];
}

interface Review { _id: string; userName: string; rating: number; comment: string; createdAt: string; }

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map((s) => (
      <button key={s} type="button"
        onClick={() => onChange?.(s)}
        className={`bg-transparent border-none cursor-pointer p-0 transition-colors ${s <= value ? "text-accent" : "text-muted-foreground"} ${onChange ? "hover:text-accent" : "cursor-default"}`}>
        <Star size={16} fill={s <= value ? "currentColor" : "none"} />
      </button>
    ))}
  </div>
);

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch product
  const { data: productData, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<{ success: boolean; data: ApiProduct }>(`/products/slug/${slug}`),
    enabled: !!slug,
  });

  // Fetch reviews
  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", productData?.data?._id],
    queryFn: () => api.get<{ success: boolean; data: Review[] }>(`/products/${productData!.data._id}/reviews`),
    enabled: !!productData?.data?._id,
  });

  // Fetch related products
  const { data: relatedData } = useQuery({
    queryKey: ["related", productData?.data?.category, productData?.data?._id],
    queryFn: () => api.get<{ success: boolean; data: ApiProduct[] }>(`/products?category=${productData!.data.category}&limit=3`),
    enabled: !!productData?.data?.category,
    select: (d) => ({ ...d, data: d.data.filter((p) => p._id !== productData?.data._id).slice(0, 3) }),
  });

  if (isLoading) {
    return (
      <main className="pt-20 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-5 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-[3/4]" />
            <div className="space-y-4 py-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const product = productData?.data;
  if (!product) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-light tracking-[2px] mb-4">PRODUCT NOT FOUND</h1>
          <Link to="/shop" className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors no-underline">
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const wishlisted = isInWishlist(product._id);
  const cartProduct = {
    id: product._id, title: product.title,
    price: product.discountPrice || product.price,
    image: product.images?.[0]?.url || "",
    badge: product.badge, description: product.description, category: product.category,
  };
  const reviews = reviewsData?.data || [];
  const related = relatedData?.data || [];
  const needsSize = !["Glasses", "Hats", "One Size"].includes(product.category);

  // Calculate variant-specific stock
  let availableStock = product.stock;
  if (product.variants && product.variants.length > 0) {
    if (selectedColor && selectedSize) {
      const variant = product.variants.find(v => v.color.toLowerCase() === selectedColor.toLowerCase());
      const sizeObj = variant?.sizes.find(s => s.size.toLowerCase() === selectedSize.toLowerCase());
      availableStock = sizeObj ? sizeObj.stock : 0;
    } else if (selectedColor) {
      const variant = product.variants.find(v => v.color.toLowerCase() === selectedColor.toLowerCase());
      availableStock = variant ? variant.sizes.reduce((sum, s) => sum + s.stock, 0) : 0;
    } else if (selectedSize) {
      availableStock = product.variants.reduce((sum, v) => {
        const sizeObj = v.sizes.find(s => s.size.toLowerCase() === selectedSize.toLowerCase());
        return sum + (sizeObj ? sizeObj.stock : 0);
      }, 0);
    }
  }

  const handleAddToCart = () => {
    if (needsSize && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (quantity > availableStock) {
      toast.error("Requested quantity exceeds available stock");
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem(cartProduct, selectedSize, selectedColor);
    }
    setAddedToCart(true);
    toast.success(`${product.title} × ${quantity} added to cart`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleWishlist = () => {
    if (wishlisted) { removeFromWishlist(product._id); toast.success("Removed from wishlist"); }
    else { addToWishlist(cartProduct); toast.success("Added to wishlist"); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("Please log in to leave a review"); return; }
    if (!reviewForm.comment.trim()) { toast.error("Please write a comment"); return; }
    setIsSubmittingReview(true);
    try {
      await api.post(`/products/${product._id}/reviews`, reviewForm);
      toast.success("Review submitted!");
      setReviewForm({ rating: 5, comment: "" });
      refetchReviews();
    } catch {
      toast.error("Failed to submit review. You may have already reviewed this product.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <main className="pt-20 min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-5 py-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Link to="/shop" className="hover:text-foreground no-underline text-muted-foreground">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.title}</span>
        </div>
      </div>

      {/* Product */}
      <section className="max-w-[1400px] mx-auto px-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative bg-secondary overflow-hidden aspect-[3/4] mb-3">
              <img
                src={product.images?.[activeImage]?.url || `https://placehold.co/800x1067/f0f0f0/333333?text=${encodeURIComponent(product.title)}`}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/800x1067/f0f0f0/333333?text=${encodeURIComponent(product.title)}`; }}
              />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 text-xs tracking-[1px] uppercase">{product.badge}</span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-20 h-24 border-2 overflow-hidden transition-colors ${i === activeImage ? "border-foreground" : "border-transparent"}`}>
                    <img src={img.url} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col justify-center">
            <p className="text-xs text-muted-foreground uppercase tracking-[2px] mb-2">{product.category}</p>
            <h1 className="text-3xl md:text-4xl font-light tracking-[2px] mb-3">{product.title}</h1>

            {/* Rating */}
            {product.ratings.count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating value={Math.round(product.ratings.average)} />
                <span className="text-xs text-muted-foreground">({product.ratings.count} review{product.ratings.count !== 1 ? "s" : ""})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <p className="text-2xl">{(product.discountPrice || product.price).toLocaleString("fr-DZ")} DA</p>
              {product.discountPrice && (
                <p className="text-muted-foreground line-through text-lg">{product.price.toLocaleString("fr-DZ")} DA</p>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>

            {/* Color selector */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[1px] mb-3">Color: <span className="text-muted-foreground">{selectedColor || "Select"}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color) => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-xs border transition-colors cursor-pointer ${selectedColor === color ? "bg-foreground text-background border-foreground" : "bg-transparent text-foreground border-border hover:border-foreground"}`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {product.sizes?.length > 0 && product.sizes[0] !== "One Size" && (
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[1px] mb-3">Size: <span className="text-muted-foreground">{selectedSize || "Select"}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => {
                    let isOutOfStock = false;
                    if (selectedColor && product.variants) {
                      const variant = product.variants.find(v => v.color.toLowerCase() === selectedColor.toLowerCase());
                      const sizeObj = variant?.sizes.find(s => s.size.toLowerCase() === size.toLowerCase());
                      isOutOfStock = !sizeObj || sizeObj.stock === 0;
                    }
                    return (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 text-sm border transition-colors cursor-pointer ${
                          selectedSize === size
                            ? "bg-foreground text-background border-foreground"
                            : isOutOfStock
                            ? "border-border text-muted-foreground line-through opacity-50"
                            : "bg-transparent text-foreground border-border hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[1px] mb-3">Quantity</p>
              <div className="flex items-center gap-1 w-fit border border-border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-secondary transition-colors"><Minus size={14} /></button>
                <span className="w-10 text-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-secondary transition-colors"><Plus size={14} /></button>
              </div>
              {availableStock <= 5 && availableStock > 0 && (
                <p className="text-xs text-amber-600 mt-2">Only {availableStock} left in stock</p>
              )}
              {availableStock === 0 && <p className="text-xs text-destructive mt-2">Out of stock</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={availableStock === 0}
                className={`flex-1 py-4 text-sm font-medium tracking-[1px] uppercase border-none cursor-pointer transition-colors duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${addedToCart ? "bg-green-600 text-white" : "bg-foreground text-background hover:bg-accent"}`}>
                {addedToCart ? <><Check size={16} /> Added!</> : <><ShoppingBag size={16} /> Add to Cart</>}
              </button>
              <button onClick={handleToggleWishlist}
                className={`w-14 h-14 flex items-center justify-center border cursor-pointer transition-colors ${wishlisted ? "bg-accent/10 border-accent text-accent" : "bg-transparent border-border text-foreground hover:border-foreground"}`}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
                <Heart size={18} className={wishlisted ? "fill-accent text-accent" : ""} />
              </button>
            </div>

            {/* order via whatsapp */}
            <div className="mt-4">
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "213550123456"}?text=${encodeURIComponent(
                  `Bonjour! Je souhaite commander le produit "${product.title}" (prix: ${(product.discountPrice || product.price).toLocaleString("fr-DZ")} DA). Veuillez me contacter pour confirmer les détails de livraison.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 text-sm font-medium tracking-[1px] uppercase border-none cursor-pointer transition-all duration-300 inline-flex items-center justify-center gap-2 text-white bg-[#25D366] hover:bg-[#1ebd59] no-underline shadow-md hover:shadow-lg rounded-none"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.33 4.982L2 22l5.209-1.365a9.994 9.994 0 0 0 4.8 1.233h.005c5.507 0 9.99-4.478 9.99-9.985a9.984 9.984 0 0 0-9.99-9.983zm0 18.294h-.003a8.275 8.275 0 0 1-4.218-1.155l-.303-.18-3.13.82.836-3.05-.198-.313a8.278 8.278 0 0 1-1.268-4.46c.001-4.57 3.72-8.286 8.286-8.286a8.26 8.26 0 0 1 5.856 2.428 8.26 8.26 0 0 1 2.426 5.86c-.001 4.572-3.72 8.287-8.286 8.287zm4.542-6.208c-.249-.125-1.472-.727-1.7-.81-.228-.083-.393-.125-.558.125-.165.25-.638.81-.782.975-.145.165-.29.185-.539.06a6.79 6.79 0 0 1-2.002-1.234 7.483 7.483 0 0 1-1.385-1.724c-.145-.25-.015-.385.11-.51.113-.113.25-.29.375-.436.125-.145.166-.25.25-.416.083-.167.042-.313-.02-.438-.063-.125-.558-1.344-.763-1.84-.2-.48-.42-.416-.558-.422-.145-.007-.31-.007-.475-.007a.913.913 0 0 0-.663.31c-.228.25-.87.85-.87 2.075 0 1.225.89 2.413.99 2.553.1.14 1.753 2.678 4.248 3.755.593.257 1.058.41 1.418.524.596.19 1.138.163 1.567.099.478-.073 1.472-.602 1.679-1.185.207-.583.207-1.082.145-1.185-.062-.104-.228-.166-.477-.29z"/>
                </svg>
                <span>Commander via WhatsApp</span>
              </a>
            </div>

            <div className="mt-8 border-t border-border pt-6 space-y-3 text-sm text-muted-foreground">
              <p>✓ Free shipping on orders over 10,000 DA</p>
              <p>✓ Cash on delivery across all 58 wilayas</p>
              <p>✓ 7-day return policy</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <section className="max-w-[900px] mx-auto px-5 py-16 border-t border-border">
        <h2 className="text-2xl font-light tracking-[2px] mb-12">REVIEWS {reviews.length > 0 && `(${reviews.length})`}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Review list */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product.</p>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="border-b border-border pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{r.userName}</p>
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-GB")}</span>
                  </div>
                  <StarRating value={r.rating} />
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Review form */}
          <div>
            <h3 className="text-base font-normal tracking-[1px] mb-6">WRITE A REVIEW</h3>
            {!isAuthenticated ? (
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-foreground hover:text-accent no-underline">Sign in</Link> to leave a review.
              </p>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-2">Your Rating</label>
                  <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[1px] text-muted-foreground mb-2">Your Review</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full py-3 px-4 bg-background border border-border text-foreground text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground resize-none"
                  />
                </div>
                <button type="submit" disabled={isSubmittingReview}
                  className="px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors border-none cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
                  {isSubmittingReview ? <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-16 px-5 max-w-[1400px] mx-auto">
          <h2 className="text-2xl font-light tracking-[2px] text-center mb-12">YOU MAY ALSO LIKE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {related.map((p, i) => (
              <ProductCard key={p._id} product={{ id: p._id, title: p.title, price: p.discountPrice || p.price, image: p.images?.[0]?.url || "", badge: p.badge, category: p.category }} index={i} slug={p.slug} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetail;
