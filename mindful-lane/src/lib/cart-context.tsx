import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  badge?: string;
  description?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size?: string, color?: string) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'row_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as CartItem[];
      // Filter out legacy non-ObjectId cart items (e.g. from static mock products)
      return parsed.filter((item) => /^[0-9a-fA-F]{24}$/.test(item.id));
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const getKey = (id: string, size?: string, color?: string) => `${id}|${color || ''}|${size || ''}`;

  const addItem = useCallback((product: Product, size?: string, color?: string) => {
    setItems((prev) => {
      const key = getKey(product.id, size, color);
      const existing = prev.find((item) => getKey(item.id, item.size, item.color) === key);
      if (existing) {
        return prev.map((item) =>
          getKey(item.id, item.size, item.color) === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, size, color }];
    });
  }, []);

  const removeItem = useCallback((id: string, size?: string, color?: string) => {
    setItems((prev) => prev.filter((item) => getKey(item.id, item.size, item.color) !== getKey(id, size, color)));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => getKey(item.id, item.size, item.color) !== getKey(id, size, color)));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          getKey(item.id, item.size, item.color) === getKey(id, size, color) ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
