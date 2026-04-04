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
      <table className="w-full text-sm text-left border-collapse border border-slate-700">
        <thead className="bg-slate-800 text-slate-300">
          <tr>
            <th className="px-4 py-3 border-b border-slate-700">Nama Produk</th>
            <th className="px-4 py-3 border-b border-slate-700">Kategori</th>
            <th className="px-4 py-3 border-b border-slate-700 text-center">
              Stok Tersisa
            </th>
            <th className="px-4 py-3 border-b border-slate-700 text-right">
              Harga Modal
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 text-slate-400">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-800/50">
              <td className="px-4 py-3 text-white font-medium">
                {product.name}
              </td>
              <td className="px-4 py-3">{product.category}</td>
              <td className="px-4 py-3 text-center text-red-400 font-bold">
                {product.current_stock}
              </td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(product.capital_price)}
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-slate-500 italic"
              >
                Tidak ada produk yang perlu restock.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {products.length > 0 && (
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={() => handleCopy(products)}
            className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
          >
            Copy ke Clipboard
          </button>
          <button
            onClick={() => onOrderWA(products)}
            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-medium flex items-center gap-2"
          >
            Order via WA
          </button>
        </div>
      )}
    </div>
  );
}
