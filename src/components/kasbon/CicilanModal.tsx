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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Bayar Cicilan</h2>
          <p className="text-slate-400 text-sm mb-6">
            Pelanggan:{" "}
            <span className="text-white font-medium">{customer.name}</span>
            <br />
            Total Hutang:{" "}
            <span className="text-red-400 font-bold">
              {formatRupiah(customer.total_outstanding_debt)}
            </span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Jumlah Cicilan
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
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
                className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
