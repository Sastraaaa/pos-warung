import { useState, useEffect, useMemo } from "react";
import { db } from "../db/database";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { SimpleBarChart } from "../components/dashboard/SimpleBarChart";
import { RestockList } from "../components/dashboard/RestockList";
import type { Product, Customer, Transaction, TransactionItem } from "../types";

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>(
    [],
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [restockProducts, setRestockProducts] = useState<Product[]>([]);
  const [last7Days, setLast7Days] = useState<
    { label: string; value: number }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dateStr = selectedDate;

        // Fetch Daily Transactions
        const dailyTx = (await db.transactions
          .where("created_at")
          .startsWith(dateStr)
          .toArray()) as unknown as Transaction[];

        setTransactions(dailyTx);

        // Fetch Transaction Items for profit calc
        const txIds = dailyTx.map((tx: Transaction) => tx.id);
        const items = (await db.transaction_items
          .where("transaction_id")
          .anyOf(txIds)
          .toArray()) as unknown as TransactionItem[];

        setTransactionItems(items);

        // Fetch Customers with outstanding debt
        const debtors = (await db.customers
          .where("total_outstanding_debt")
          .above(0)
          .toArray()) as unknown as Customer[];

        // Sort debtors by debt descending
        debtors.sort(
          (a: Customer, b: Customer) =>
            b.total_outstanding_debt - a.total_outstanding_debt,
        );
        setCustomers(debtors);

        // Fetch Restock Products
        const lowStock = (await db.products
          .filter((p: any) => p.low_stock_flag === true || p.current_stock <= 5)
          .toArray()) as unknown as Product[];

        setRestockProducts(lowStock);

        // Fetch Last 7 Days Revenue
        const today = new Date();
        const past7DaysData = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split("T")[0];

          const dayTx = (await db.transactions
            .where("created_at")
            .startsWith(dayStr)
            .toArray()) as unknown as Transaction[];

          const dayRevenue = dayTx
            .filter(
              (tx: Transaction) =>
                tx.transaction_type === "LUNAS" ||
                tx.transaction_type === "SEBAGIAN",
            )
            .reduce((sum: number, tx: Transaction) => sum + tx.paid_amount, 0);

          past7DaysData.push({
            label: d.toLocaleDateString("id-ID", { weekday: "short" }),
            value: dayRevenue,
          });
        }
        setLast7Days(past7DaysData);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchData();
  }, [selectedDate]);

  const summaryData = useMemo(() => {
    const lunasTx = transactions.filter(
      (t) =>
        t.transaction_type === "LUNAS" || t.transaction_type === "SEBAGIAN",
    );

    const omzet = lunasTx.reduce((sum, tx) => sum + tx.paid_amount, 0);
    const kasbonBaru = transactions.reduce(
      (sum, tx) => sum + tx.debt_created,
      0,
    );
    const totalPiutang = customers.reduce(
      (sum, c) => sum + c.total_outstanding_debt,
      0,
    );

    // Profit = Sum of (selling_price - capital_price) * quantity for today's tx items
    const profit = transactionItems.reduce((sum, item) => {
      return (
        sum +
        (item.historical_selling_price - item.historical_capital_price) *
          item.quantity
      );
    }, 0);

    return {
      totalTx: transactions.length,
      omzet,
      profit,
      kasbonBaru,
      totalPiutang,
    };
  }, [transactions, transactionItems, customers]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleWAOrder = (items: Product[]) => {
    let message = "Halo, saya mau order:\n";
    let totalEstimation = 0;

    items.forEach((item, idx) => {
      const stockNeeded = 10 - item.current_stock;
      message += `${idx + 1}. ${item.name} - ${stockNeeded > 0 ? stockNeeded : 1} pcs\n`;
      totalEstimation +=
        item.capital_price * (stockNeeded > 0 ? stockNeeded : 1);
    });

    message += `Total estimasi: ${formatCurrency(totalEstimation)}`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleWAKasbon = (customer: Customer) => {
    const amount = formatCurrency(customer.total_outstanding_debt);
    const message = `Halo ${customer.name}, ini tagihan dari POS Warung.\nTotal hutang: Rp ${amount}\nMohon segera dilunasi. Terima kasih.`;

    // Clean phone number
    let phone = customer.phone || "";
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Layar Bos</h1>
          <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wide">
            Ringkasan harian dan performa toko
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          <label
            htmlFor="dashboard-date"
            className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2"
          >
            Tanggal:
          </label>
          <input
            id="dashboard-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Ringkasan Keuangan Harian
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            title="Total Transaksi"
            value={summaryData.totalTx.toString()}
            icon={<span className="text-xl">🧾</span>}
          />
          <SummaryCard
            title="Omzet Hari Ini"
            value={formatCurrency(summaryData.omzet)}
            icon={<span className="text-xl">💰</span>}
            trend="up"
          />
          <SummaryCard
            title="Profit Hari Ini"
            value={formatCurrency(summaryData.profit)}
            icon={<span className="text-xl">📈</span>}
            trend="up"
          />
          <SummaryCard
            title="Kasbon Baru"
            value={formatCurrency(summaryData.kasbonBaru)}
            icon={<span className="text-xl">📝</span>}
            trend={summaryData.kasbonBaru > 0 ? "down" : undefined}
          />
          <SummaryCard
            title="Total Piutang"
            value={formatCurrency(summaryData.totalPiutang)}
            icon={<span className="text-xl">🏦</span>}
          />
        </div>
      </div>

      {/* Charts & Restock Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Simple Bar Chart */}
        <div className="bg-[var(--color-surface-panel)] border border-[var(--color-surface-border)] rounded-2xl p-6 shadow-sm flex flex-col group hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-6">
            <h2 className="text-base font-bold text-white tracking-wide">
              Grafik Omzet 7 Hari Terakhir
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">Tren Mingguan</span>
          </div>
          <div className="flex-1 min-h-[220px] flex items-end">
            <SimpleBarChart data={last7Days} />
          </div>
        </div>

        {/* Restock List */}
        <div className="bg-[var(--color-surface-panel)] border border-[var(--color-surface-border)] rounded-2xl p-6 shadow-sm flex flex-col group hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
            <h2 className="text-base font-bold text-red-400 flex items-center gap-2 tracking-wide">
              <span className="text-lg">⚠️</span> Daftar Kulakan (Stok Menipis)
            </h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/30">
              {restockProducts.length}
            </span>
          </div>
          <div className="flex-1 overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <RestockList products={restockProducts} onOrderWA={handleWAOrder} />
          </div>
        </div>
      </div>

      {/* Outstanding Debts (Kasbon) */}
      <div className="bg-[var(--color-surface-panel)] border border-[var(--color-surface-border)] rounded-2xl p-6 shadow-sm group hover:border-slate-600 transition-all">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-wide">
            <span className="text-lg">📒</span> Daftar Kasbon Aktif
          </h2>
          <span className="rounded-full bg-slate-900/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-800">
            {customers.length} Pelanggan
          </span>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-4 border-b border-slate-700/50 rounded-tl-xl">
                  Nama Pelanggan
                </th>
                <th className="px-4 py-4 border-b border-slate-700/50">No. WA</th>
                <th className="px-4 py-4 border-b border-slate-700/50">
                  Terakhir Update
                </th>
                <th className="px-4 py-4 border-b border-slate-700/50 text-right">
                  Total Piutang
                </th>
                <th className="px-4 py-4 border-b border-slate-700/50 text-center rounded-tr-xl">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-400 bg-slate-900/20">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-4 text-slate-200 font-bold tracking-wide">
                    {customer.name}
                  </td>
                  <td className="px-4 py-4 font-medium">{customer.phone || "-"}</td>
                  <td className="px-4 py-4 text-xs font-medium">
                    {new Date(customer.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4 text-right text-red-400 font-black tabular-nums tracking-tight">
                    {formatCurrency(customer.total_outstanding_debt)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleWAKasbon(customer)}
                      disabled={!customer.phone}
                      className="px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-sm disabled:shadow-none"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.888-.653-1.488-1.46-1.661-1.759-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Tagih
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Tidak ada pelanggan dengan piutang aktif. Aman bos!</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
