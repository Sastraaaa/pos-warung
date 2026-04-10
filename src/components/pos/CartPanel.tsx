import { useState } from "react";
import type { CartItem } from "../../types";
import { CustomerSelector } from "./CustomerSelector";
import { PartialPaymentModal } from "./PartialPaymentModal";

interface Props {
  cart: CartItem[];
  total: number;
  onLunas: () => void;
  onKasbonFull: (customerId: string) => void;
  onBayar: (customerId: string, paidAmount: number) => void;
  onRemoveFromCart: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}

export function CartPanel({
  cart,
  total,
  onLunas,
  onKasbonFull,
  onBayar,
  onRemoveFromCart,
  onUpdateQuantity,
}: Props) {
  const [showKasbonModal, setShowKasbonModal] = useState(false);
  const [showBayarModal, setShowBayarModal] = useState(false);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleKasbonFullConfirm = (customerId: string) => {
    onKasbonFull(customerId);
    setShowKasbonModal(false);
  };

  const handleBayarConfirm = (customerId: string, paidAmount: number) => {
    onBayar(customerId, paidAmount);
    setShowBayarModal(false);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-panel)] p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between border-b border-slate-700/50 pb-5">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-bold tracking-tight text-white">Nota Pesanan</h2>
        </div>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-400 border border-blue-500/20 shadow-inner">
          {cart.reduce((sum, item) => sum + item.cart_quantity, 0)} Items
        </span>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500 gap-3">
            <div className="rounded-full bg-slate-900/50 p-4 border border-slate-800">
              <svg
                className="h-10 w-10 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-300">Keranjang masih kosong</p>
              <p className="text-sm text-slate-500 mt-1">Pilih produk dari katalog di sebelah kiri</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 transition-all hover:border-slate-600 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-100 leading-tight">{item.name}</div>
                  <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                    title="Hapus"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-sm font-medium text-slate-400">
                    {formatRupiah(item.selling_price)} <span className="text-xs text-slate-500">/ item</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/80 p-1 shadow-inner">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.cart_quantity - 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700/50 text-slate-300 transition-colors hover:bg-slate-600 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-white tabular-nums">
                      {item.cart_quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.cart_quantity + 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700/50 text-slate-300 transition-colors hover:bg-slate-600 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-700/50 pt-3 text-right text-base font-bold tracking-wide text-emerald-400">
                  {formatRupiah(item.selling_price * item.cart_quantity)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals & Actions */}
      <div className="mt-4 border-t border-slate-700/50 pt-5">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-900/50 p-4 border border-slate-800">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Tagihan</span>
          <span className="text-2xl font-black tracking-tight text-emerald-400">
            {formatRupiah(total)}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onLunas}
            disabled={cart.length === 0}
            className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-emerald-900/50 transition-all hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-50 disabled:shadow-none"
          >
            LUNAS (CASH)
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setShowKasbonModal(true)}
              disabled={cart.length === 0}
              className="flex-1 rounded-xl bg-red-600 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-900/50 transition-all hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/30 disabled:opacity-50 disabled:shadow-none"
            >
              KASBON FULL
            </button>
            <button
              onClick={() => setShowBayarModal(true)}
              disabled={cart.length === 0}
              className="flex-1 rounded-xl bg-amber-600 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-amber-900/50 transition-all hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/30 disabled:opacity-50 disabled:shadow-none"
            >
              BAYAR SEBAGIAN
            </button>
          </div>
        </div>
      </div>

      {showKasbonModal && (
        <CustomerSelector
          onSelect={handleKasbonFullConfirm}
          onClose={() => setShowKasbonModal(false)}
        />
      )}

      {showBayarModal && (
        <PartialPaymentModal
          total={total}
          onConfirm={handleBayarConfirm}
          onClose={() => setShowBayarModal(false)}
        />
      )}
    </div>
  );
}
