import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

const Cart = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-5"
        >
          <ShoppingBag size={64} strokeWidth={1} className="mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-light tracking-[2px] mb-4">YOUR CART IS EMPTY</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors duration-300 no-underline"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen">
      <section className="bg-secondary py-16 px-5 text-center">
        <h1 className="text-4xl font-light tracking-[3px] mb-2">YOUR CART</h1>
        <p className="text-muted-foreground">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
      </section>

      <section className="py-16 px-5 max-w-[900px] mx-auto">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={`${item.id}-${item.color || ''}-${item.size || ''}`}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex gap-6 py-8 border-b border-border"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-24 h-24 md:w-32 md:h-32 object-cover bg-secondary"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base tracking-[1px] mb-1">{item.title}</h3>
                    {(item.color || item.size) && (
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1 uppercase tracking-[0.5px]">
                        {item.color && `Color: ${item.color}`}
                        {item.color && item.size && " | "}
                        {item.size && `Size: ${item.size}`}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {item.price.toLocaleString("fr-DZ")} DA
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, item.size, item.color)}
                    className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                    aria-label="Remove item"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                    className="w-8 h-8 flex items-center justify-center border border-border bg-transparent hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                    className="w-8 h-8 flex items-center justify-center border border-border bg-transparent hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="ml-auto text-base font-normal">
                    {(item.price * item.quantity).toLocaleString("fr-DZ")} DA
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Summary */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex justify-between items-center mb-8">
            <span className="text-lg tracking-[1px]">SUBTOTAL</span>
            <span className="text-lg">{totalPrice.toLocaleString("fr-DZ")} DA</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Shipping and taxes calculated at checkout.
          </p>
          <Link
            to="/checkout"
            className="block w-full py-4 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors duration-300 text-center no-underline"
          >
            Proceed to Checkout
          </Link>
          <Link
            to="/shop"
            className="block mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Cart;
