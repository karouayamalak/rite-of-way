import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

const Wishlist = () => {
  const { items, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleMoveToCart = (item: typeof items[0]) => {
    addToCart(item);
    removeItem(item.id);
    toast.success(`${item.title} moved to cart`);
  };

  if (items.length === 0) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-5"
        >
          <Heart size={64} strokeWidth={1} className="mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-light tracking-[2px] mb-4">YOUR WISHLIST IS EMPTY</h1>
          <p className="text-muted-foreground mb-8">
            Save items you love for later.
          </p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors duration-300 no-underline"
          >
            Browse Products
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen">
      <section className="bg-secondary py-16 px-5 text-center">
        <h1 className="text-4xl font-light tracking-[3px] mb-2">YOUR WISHLIST</h1>
        <p className="text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""} saved
        </p>
      </section>

      <section className="py-16 px-5 max-w-[1200px] mx-auto">
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <div className="h-[400px] overflow-hidden bg-secondary relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <button
                    onClick={() => {
                      removeItem(item.id);
                      toast.success(`${item.title} removed from wishlist`);
                    }}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer hover:bg-background transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="py-5 text-center">
                  <h3 className="text-base font-normal tracking-[1px] mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.price.toLocaleString("fr-DZ")} DA</p>
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background text-xs font-medium tracking-[1px] uppercase border-none cursor-pointer hover:bg-accent transition-colors duration-300"
                  >
                    <ShoppingBag size={14} />
                    Move to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </section>
    </main>
  );
};

export default Wishlist;
