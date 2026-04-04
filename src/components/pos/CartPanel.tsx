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
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white">Nota Pesanan</h2>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-slate-300">
          {cart.reduce((sum, item) => sum + item.cart_quantity, 0)} Items
        </span>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto pr-2">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <svg
              className="mb-4 h-16 w-16 opacity-50"
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
            <p className="text-lg">Keranjang masih kosong</p>
            <p className="text-sm">Pilih produk dari katalog di sebelah kiri</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-3"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="font-medium text-white">{item.name}</div>
                  <button
                    onClick={() => onRemoveFromCart(item.id)}
                    className="text-slate-500 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-sm text-green-400">
                    {formatRupiah(item.selling_price)}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-1">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.cart_quantity - 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded bg-slate-700 text-white hover:bg-slate-600"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium text-white">
                      {item.cart_quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.cart_quantity + 1)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded bg-slate-700 text-white hover:bg-slate-600"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-2 border-t border-slate-800 pt-2 text-right text-sm font-bold text-white">
                  {formatRupiah(item.selling_price * item.cart_quantity)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals & Actions */}
      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-slate-400">Total Tagihan</span>
          <span className="text-2xl font-bold text-white">
            {formatRupiah(total)}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onLunas}
            disabled={cart.length === 0}
            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            LUNAS (CASH)
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setShowKasbonModal(true)}
              disabled={cart.length === 0}
              className="flex-1 rounded-xl bg-red-600 py-4 text-lg font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              KASBON FULL
            </button>
            <button
              onClick={() => setShowBayarModal(true)}
              disabled={cart.length === 0}
              className="flex-1 rounded-xl bg-yellow-600 py-4 text-lg font-bold text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
            >
              BAYAR / CICIL
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
