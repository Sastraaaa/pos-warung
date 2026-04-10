import type { Product } from "../../types";

interface RestockListProps {
  products: Product[];
  onOrderWA: (products: Product[]) => void;
}

export function RestockList({ products, onOrderWA }: RestockListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateMessage = (items: Product[]) => {
    let message = "Halo, saya mau order:\n";
    let totalEstimation = 0;

    items.forEach((item, idx) => {
      const stockNeeded = 10 - item.current_stock;
      message += `${idx + 1}. ${item.name} - ${stockNeeded > 0 ? stockNeeded : 1} pcs\n`;
      totalEstimation +=
        item.capital_price * (stockNeeded > 0 ? stockNeeded : 1);
    });

    message += `Total estimasi: ${formatCurrency(totalEstimation)}`;
    return message;
  };

  const handleCopy = async (items: Product[]) => {
    try {
      const message = generateMessage(items);
      await navigator.clipboard.writeText(message);
      alert("Tersalin ke clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left border-collapse border border-slate-700/50">
        <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[10px] font-bold">
          <tr>
            <th className="px-4 py-3 border-b border-slate-700/50">Nama Produk</th>
            <th className="px-4 py-3 border-b border-slate-700/50">Kategori</th>
            <th className="px-4 py-3 border-b border-slate-700/50 text-center">
              Stok Tersisa
            </th>
            <th className="px-4 py-3 border-b border-slate-700/50 text-right">
              Harga Modal
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50 text-slate-400">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-4 py-3 text-slate-200 font-semibold tracking-wide">
                {product.name}
              </td>
              <td className="px-4 py-3 text-xs font-medium">{product.category}</td>
              <td className="px-4 py-3 text-center text-red-400 font-bold tabular-nums">
                {product.current_stock}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-300">
                {formatCurrency(product.capital_price)}
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-10 text-center text-slate-500 font-medium bg-slate-900/20"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Stok produk masih aman, bos!</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {products.length > 0 && (
        <div className="mt-4 flex justify-end gap-3 border-t border-slate-700/50 pt-4">
          <button
            onClick={() => handleCopy(products)}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm font-bold shadow-sm"
          >
            Copy
          </button>
          <button
            onClick={() => onOrderWA(products)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            Order via WA
          </button>
        </div>
      )}
    </div>
  );
}
