import { useState, useEffect, useMemo } from "react";
import { db } from "../db/database";
import type { CustomerRecord, LocalTransactionRecord } from "../db/database";
import { CustomerCard } from "../components/kasbon/CustomerCard";
import { DebtHistoryTimeline } from "../components/kasbon/DebtHistoryTimeline";
import { CicilanModal } from "../components/kasbon/CicilanModal";

export function KasbonPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);
  const [transactions, setTransactions] = useState<LocalTransactionRecord[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCicilanModal, setShowCicilanModal] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerTransactions(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      const allCustomers = await db.getAllCustomers();
      const debtors = allCustomers.filter(
        (c: CustomerRecord) => c.total_outstanding_debt > 0,
      );
      debtors.sort(
        (a: CustomerRecord, b: CustomerRecord) =>
          b.total_outstanding_debt - a.total_outstanding_debt,
      );
      setCustomers(debtors);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  const loadCustomerTransactions = async (customerId: string) => {
    try {
      // Fetch transactions where customer_id matches
      const allTxs = await db.transactions
        .where("customer_id")
        .equals(customerId)
        .toArray();
      setTransactions(allTxs);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c: CustomerRecord) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [customers, searchQuery]);

  const totalDebt = useMemo(() => {
    return customers.reduce(
      (sum: number, c: CustomerRecord) => sum + c.total_outstanding_debt,
      0,
    );
  }, [customers]);

  const handleTagihWA = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(waUrl, "_blank");
  };

  const handleCicilan = async (amount: number) => {
    if (!selectedCustomer) return;

    try {
      const newDebt = selectedCustomer.total_outstanding_debt - amount;

      const newTx: Omit<LocalTransactionRecord, "id"> = {
        transaction_type: newDebt <= 0 ? "LUNAS" : "SEBAGIAN",
        customer_id: selectedCustomer.id,
        total_amount: 0,
        paid_amount: amount,
        debt_created: 0,
        created_at: new Date().toISOString(),
        is_synced: false,
        remote_id: crypto.randomUUID(),
      };

      await db.transactions.add(newTx as any);
      await db.customers.update(selectedCustomer.id, {
        total_outstanding_debt: Math.max(0, newDebt),
      });

      setShowCicilanModal(false);
      loadCustomers();

      const updatedCustomer = await db.getCustomer(selectedCustomer.id);
      if (updatedCustomer) {
        setSelectedCustomer(updatedCustomer);
      }
    } catch (err) {
      console.error("Failed to process cicilan", err);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (selectedCustomer) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
          >
            &larr; Kembali
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {selectedCustomer.name}
              </h1>
              <p className="text-slate-400 mt-1">
                {selectedCustomer.phone || "No WA belum ada"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
                onClick={() => {
                  /* optional edit handler */
                }}
              >
                Edit
              </button>
              {selectedCustomer.phone && (
                <button
                  onClick={() => {
                    const msg = `Halo ${selectedCustomer.name}, ini tagihan dari POS Warung.\nTotal hutang: ${formatRupiah(selectedCustomer.total_outstanding_debt)}\nMohon segera dilunasi. Terima kasih.`;
                    handleTagihWA(selectedCustomer.phone!, msg);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Tagih via WA
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 font-medium">Sisa Hutang</p>
              <p className="text-4xl font-bold text-red-400 tracking-tight mt-1">
                {formatRupiah(selectedCustomer.total_outstanding_debt)}
              </p>
            </div>
            <button
              onClick={() => setShowCicilanModal(true)}
              disabled={selectedCustomer.total_outstanding_debt <= 0}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20"
            >
              Bayar Cicilan
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Histori Kasbon</h2>
          <DebtHistoryTimeline
            transactions={transactions}
            customerName={selectedCustomer.name}
          />
        </div>

        {showCicilanModal && (
          <CicilanModal
            customer={selectedCustomer}
            onClose={() => setShowCicilanModal(false)}
            onConfirm={handleCicilan}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Buku Kasbon
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola hutang pelanggan POS Warung
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
          <p className="text-slate-400 font-medium text-sm uppercase tracking-wider">
            Total Kasbon Aktif
          </p>
          <p className="text-3xl font-bold text-red-400 mt-2">
            {formatRupiah(totalDebt)}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
          <p className="text-slate-400 font-medium text-sm uppercase tracking-wider">
            Pelanggan Berhutang
          </p>
          <p className="text-3xl font-bold text-white mt-2">
            {customers.length} Orang
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Cari nama pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              {searchQuery
                ? "Tidak ada pelanggan yang cocok"
                : "Belum ada data kasbon aktif"}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={() => setSelectedCustomer(customer)}
                onTagihWA={handleTagihWA}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
