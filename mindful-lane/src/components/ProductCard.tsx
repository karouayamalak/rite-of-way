import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";
import { useCart, type Product } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  index?: number;
  slug?: string; // API products have a slug; static products use id
}

const ProductCard = ({ product, index = 0, slug }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  const productUrl = `/product/${slug || product.id}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.title} added to cart`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(product.id);
      toast.success(`${product.title} removed from wishlist`);
    } else {
      addToWishlist(product);
      toast.success(`${product.title} added to wishlist`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative cursor-pointer"
      onClick={() => navigate(productUrl)}
    >
      <div className="h-[400px] overflow-hidden bg-secondary relative">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/800x1067/f0f0f0/333333?text=${encodeURIComponent(product.title)}`;
          }}
        />
        {product.badge && (
          <span className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 text-xs tracking-[1px] uppercase">
            {product.badge}
          </span>
        )}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer hover:bg-background transition-colors z-10"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} className={wishlisted ? "fill-accent text-accent" : "text-foreground"} />
        </button>
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
      </div>
      <div className="py-5 text-center">
        <h3 className="text-base font-normal tracking-[1px] mb-2">{product.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{product.price.toLocaleString("fr-DZ")} DA</p>
        <button
          onClick={handleAddToCart}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-xs font-medium tracking-[1px] uppercase border-none cursor-pointer hover:bg-accent transition-colors duration-300"
        >
          <ShoppingBag size={14} />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
