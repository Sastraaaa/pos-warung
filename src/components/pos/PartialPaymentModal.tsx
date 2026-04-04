import { useState } from "react";
import { CustomerSelector } from "./CustomerSelector";

interface Props {
  total: number;
  onConfirm: (customerId: string, paidAmount: number) => void;
  onClose: () => void;
}

export function PartialPaymentModal({ total, onConfirm, onClose }: Props) {
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Amount, 2: Select Customer

  const amount = parseInt(paidAmount || "0", 10);
  const diff = amount - total;
  const isSufficient = amount >= total;
  const isPartial = amount > 0 && amount < total;
  const sisaBayar = isPartial ? total - amount : 0;
  const kembalian = isSufficient ? diff : 0;

  const handleNext = () => {
    if (isSufficient) {
      // If sufficient, it's basically LUNAS with a customer or without.
      // But BAYAR flow always asks for customer. We can skip to customer selection.
      setStep(2);
    } else if (isPartial) {
      setStep(2);
    }
  };

  if (step === 2) {
    return (
      <CustomerSelector
        onSelect={(customerId) => onConfirm(customerId, amount)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Pembayaran Sebagian (Cicil)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-6 rounded-xl bg-slate-950 p-4 text-center">
          <p className="text-sm text-slate-400">Total Tagihan</p>
          <p className="text-3xl font-bold text-white">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(total)}
          </p>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-400">
            Jumlah Dibayar (Rp)
          </label>
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-2xl font-semibold text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
            placeholder="0"
            autoFocus
          />
        </div>

        <div className="mb-6 space-y-2 rounded-xl bg-slate-800/50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Status</span>
            <span
              className={`font-medium ${isSufficient ? "text-green-400" : "text-yellow-400"}`}
            >
              {isSufficient ? "Lunas / Lebih" : "Belum Lunas"}
            </span>
          </div>
          {isPartial && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Sisa Hutang (Kasbon)</span>
              <span className="font-bold text-red-400">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(sisaBayar)}
              </span>
            </div>
          )}
          {isSufficient && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Kembalian</span>
              <span className="font-bold text-green-400">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(kembalian)}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-800 py-3 font-medium text-white hover:bg-slate-700"
          >
            Batal
          </button>
          <button
            onClick={handleNext}
            disabled={amount <= 0}
            className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Pilih Pelanggan
          </button>
        </div>
      </div>
    </div>
  );
}
