import { useState } from "react";
import { useCart } from "../hooks/useCart";
import { ProductCatalog } from "../components/pos/ProductCatalog";
import { CartPanel } from "../components/pos/CartPanel";
import { db } from "../db/database";
import { syncManager } from "../db/sync";
import { emitProductsUpdated } from "../lib/appEvents";
import type { Transaction } from "../types";

export function PosPage() {
  const {
    items: cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
  } = useCart();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const triggerPostTransactionUpdates = () => {
    emitProductsUpdated();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void syncManager
        .sync()
        .catch((error) => console.error("Gagal sinkronisasi otomatis", error));
    }
  };

  const handleLunas = async () => {
    try {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        transaction_type: "LUNAS",
        customer_id: null,
        total_amount: total,
        paid_amount: total,
        debt_created: 0,
        created_at: new Date().toISOString(),
        is_synced: false,
      };

      await db.addTransaction(transaction, cart);

      clearCart();
      triggerPostTransactionUpdates();
      showToast("Transaksi LUNAS berhasil disimpan!");
    } catch (error) {
      console.error("Lunas transaction failed", error);
      showToast("Transaksi LUNAS gagal!");
    }
  };

  const handleKasbonFull = async (customerId: string) => {
    try {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        transaction_type: "KASBON_FULL",
        customer_id: customerId,
        total_amount: total,
        paid_amount: 0,
        debt_created: total,
        created_at: new Date().toISOString(),
        is_synced: false,
      };

      await db.addTransaction(transaction, cart);

      clearCart();
      triggerPostTransactionUpdates();
      showToast("Transaksi KASBON berhasil dicatat!");
    } catch (error) {
      console.error("Kasbon transaction failed", error);
      showToast("Transaksi KASBON gagal!");
    }
  };

  const handleBayar = async (customerId: string, paidAmount: number) => {
    try {
      const debtCreated = Math.max(0, total - paidAmount);
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        transaction_type: "SEBAGIAN",
        customer_id: customerId,
        total_amount: total,
        paid_amount: paidAmount,
        debt_created: debtCreated,
        created_at: new Date().toISOString(),
        is_synced: false,
      };

      await db.addTransaction(transaction, cart);

      clearCart();
      triggerPostTransactionUpdates();
      showToast("Transaksi BAYAR SEBAGIAN berhasil disimpan!");
    } catch (error) {
      console.error("Cicilan transaction failed", error);
      showToast("Transaksi BAYAR SEBAGIAN gagal!");
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-8rem)] flex-col gap-5 lg:grid lg:grid-cols-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold tracking-wide text-white shadow-lg shadow-emerald-500/20 border border-emerald-400">
          {toastMessage}
        </div>
      )}

      {/* Catalog Panel (Left/Top) */}
      <div className="flex h-full flex-col lg:col-span-2">
        <ProductCatalog onAddToCart={addToCart} />
      </div>

      {/* Cart Panel (Right/Bottom) */}
      <div className="h-full lg:col-span-1">
        <CartPanel
          cart={cart}
          total={total}
          onLunas={handleLunas}
          onKasbonFull={handleKasbonFull}
          onBayar={handleBayar}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateQuantity}
        />
      </div>
    </div>
  );
}
