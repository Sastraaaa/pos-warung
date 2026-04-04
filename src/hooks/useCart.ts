import { useState, useMemo } from "react";
import type { Product, CartItem } from "../types";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cart_quantity: item.cart_quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, cart_quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, cart_quantity: quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.selling_price * item.cart_quantity,
      0,
    );
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.cart_quantity, 0);
  }, [items]);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  };
}
