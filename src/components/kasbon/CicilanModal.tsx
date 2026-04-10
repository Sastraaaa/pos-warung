import { useState } from "react";
import type { CustomerRecord } from "../../db/database";

interface Props {
  customer: CustomerRecord;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export function CicilanModal({ customer, onConfirm, onClose }: Props) {
  const [amount, setAmount] = useState<string>("");

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ""));
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      onConfirm(parsedAmount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[var(--color-surface-panel)] border border-[var(--color-surface-border)] rounded-2xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">Pembayaran Kasbon</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Pelanggan:{" "}
            <span className="text-slate-200 font-bold">{customer.name}</span>
            <br />
            Total Piutang:{" "}
            <span className="text-red-400 font-black tracking-wide">
              {formatRupiah(customer.total_outstanding_debt)}
            </span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Nominal Pembayaran
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  Rp
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white font-bold text-lg tracking-wide focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-600"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700/50 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 px-4 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-all font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={
                  !amount ||
                  parseInt(amount) <= 0 ||
                  parseInt(amount) > customer.total_outstanding_debt
                }
                className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Proses
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
