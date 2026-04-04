import type { LocalTransactionRecord } from "../../db/database";
import { useMemo } from "react";

interface Props {
  transactions: LocalTransactionRecord[];
  customerName: string;
}

export function DebtHistoryTimeline({ transactions, customerName }: Props) {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const processedTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a: LocalTransactionRecord, b: LocalTransactionRecord) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    let balance = 0;
    const withBalance = sorted.map((tx: LocalTransactionRecord) => {
      let change = 0;
      if (tx.transaction_type === "KASBON_FULL") {
        change = tx.debt_created;
      } else if (tx.transaction_type === "SEBAGIAN") {
        change = -tx.paid_amount;
      } else if (tx.transaction_type === "LUNAS") {
        change = -tx.paid_amount;
      }

      balance += change;

      return {
        ...tx,
        balance,
        change,
        isPayment: change < 0,
      };
    });

    return withBalance.reverse();
  }, [transactions]);

  if (!processedTransactions.length) {
    return (
      <div className="text-slate-400 p-4 text-center">
        Belum ada histori kasbon untuk {customerName}.
      </div>
    );
  }

  return (
    <div className="relative pl-6 ml-4 border-l-2 border-slate-700 space-y-6">
      {processedTransactions.map((tx) => {
        return (
          <div key={tx.id} className="relative">
            <div
              className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                tx.isPayment ? "bg-green-500" : "bg-red-500"
              }`}
            />

            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-white">
                    {tx.transaction_type === "KASBON_FULL"
                      ? "Kasbon"
                      : tx.transaction_type === "SEBAGIAN"
                        ? "Cicilan"
                        : "Pelunasan"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(tx.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`font-semibold ${tx.isPayment ? "text-green-400" : "text-red-400"}`}
                  >
                    {tx.isPayment ? "" : "+"}
                    {formatRupiah(Math.abs(tx.change))}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Sisa: {formatRupiah(Math.max(0, tx.balance))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
