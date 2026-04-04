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
      className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 cursor-pointer transition-colors"
    >
      <div>
        <h3 className="font-semibold text-white">{customer.name}</h3>
        <p className="text-sm text-slate-400">
          {customer.phone ? customer.phone : "No WA belum ada"}
        </p>
        <p className="font-bold text-red-400 mt-1">{formattedDebt}</p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        {customer.phone ? (
          <button
            onClick={handleWA}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tagih via WA
          </button>
        ) : isAddingPhone ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="08..."
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-green-500 w-32"
            />
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
              Simpan
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingPhone(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tambah No. WA
          </button>
        )}
      </div>
    </div>
  );
}
