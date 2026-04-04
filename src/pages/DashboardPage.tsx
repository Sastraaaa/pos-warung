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
    <div className="flex flex-col gap-6 w-full">
      {/* Header & Date Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Layar Bos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Ringkasan harian dan performa toko
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="dashboard-date"
            className="text-sm font-medium text-slate-300"
          >
            Tanggal:
          </label>
          <input
            id="dashboard-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simple Bar Chart */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col">
          <h2 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-2">
            Grafik Omzet 7 Hari Terakhir
          </h2>
          <div className="flex-1 min-h-[160px] flex items-end">
            <SimpleBarChart data={last7Days} />
          </div>
        </div>

        {/* Restock List */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col">
          <h2 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-4 text-red-400 flex items-center gap-2">
            <span>⚠️</span> Daftar Kulakan (Stok Menipis)
          </h2>
          <div className="flex-1 overflow-auto max-h-[300px]">
            <RestockList products={restockProducts} onOrderWA={handleWAOrder} />
          </div>
        </div>
      </div>

      {/* Outstanding Debts (Kasbon) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <h2 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
          <span>📒</span> Daftar Kasbon Aktif
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse border border-slate-700">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="px-4 py-3 border-b border-slate-700">
                  Nama Pelanggan
                </th>
                <th className="px-4 py-3 border-b border-slate-700">No. WA</th>
                <th className="px-4 py-3 border-b border-slate-700">
                  Terakhir Update
                </th>
                <th className="px-4 py-3 border-b border-slate-700 text-right">
                  Total Hutang
                </th>
                <th className="px-4 py-3 border-b border-slate-700 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-400">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-white font-medium">
                    {customer.name}
                  </td>
                  <td className="px-4 py-3">{customer.phone || "-"}</td>
                  <td className="px-4 py-3">
                    {new Date(customer.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-bold">
                    {formatCurrency(customer.total_outstanding_debt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleWAKasbon(customer)}
                      disabled={!customer.phone}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors text-xs font-medium inline-flex items-center gap-1"
                    >
                      Tagih via WA
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500 italic"
                  >
                    Tidak ada pelanggan dengan kasbon aktif.
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
