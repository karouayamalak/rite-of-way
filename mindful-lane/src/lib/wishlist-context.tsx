import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product } from "./cart-context";

interface WishlistContextType {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.find((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isInWishlist = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  return (
    <WishlistContext.Provider
      value={{ items, addItem, removeItem, isInWishlist, totalItems: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
