import { useState, useMemo } from "react";
import type { CustomerRecord } from "../../db/database";

interface Props {
  customer: CustomerRecord;
  onTagihWA: (phone: string, message: string) => void;
  onClick: () => void;
}

export function CustomerCard({ customer, onTagihWA, onClick }: Props) {
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  const formattedDebt = useMemo(() => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(customer.total_outstanding_debt);
  }, [customer.total_outstanding_debt]);

  const handleWA = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customer.phone) {
      const message = `Halo ${customer.name}, ini tagihan dari POS Warung.\nTotal hutang: ${formattedDebt}\nMohon segera dilunasi. Terima kasih.`;
      onTagihWA(customer.phone, message);
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-5 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:bg-slate-800 hover:border-slate-600 hover:shadow-md cursor-pointer transition-all duration-200 group"
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{customer.name}</h3>
        <p className="text-xs font-medium text-slate-400">
          {customer.phone ? customer.phone : "No. WA belum tersedia"}
        </p>
        <p className="font-bold tracking-wide text-red-400 mt-1">{formattedDebt}</p>
      </div>

      <div onClick={(e) => e.stopPropagation()} className="pl-4">
        {customer.phone ? (
          <button
            onClick={handleWA}
            className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow-emerald-500/20"
          >
            Tagih WA
          </button>
        ) : isAddingPhone ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="08..."
              className="px-3 py-2 bg-slate-950/50 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-32 sm:w-40 transition-all"
            />
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
              Simpan
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingPhone(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all"
          >
            + No. WA
          </button>
        )}
      </div>
    </div>
  );
}
