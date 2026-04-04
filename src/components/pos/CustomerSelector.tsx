import { useState, useEffect } from "react";
import type { Customer } from "../../types";
import { db } from "../../db/database";

interface Props {
  onSelect: (customerId: string) => void;
  onClose: () => void;
}

export function CustomerSelector({ onSelect, onClose }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // @ts-ignore - Assuming db.customers exists
      const data = await db.customers.toArray();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateCustomer = async () => {
    if (!newName.trim()) return;
    try {
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: newName,
        phone: newPhone,
        total_outstanding_debt: 0,
        created_at: new Date().toISOString(),
      };
      // @ts-ignore
      await db.customers.add(newCustomer);
      onSelect(newCustomer.id);
      onClose();
    } catch (err) {
      console.error("Failed to create customer", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Pilih Pelanggan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {!isCreatingNew ? (
          <>
            <input
              type="text"
              placeholder="Cari pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-slate-500 focus:outline-none"
            />
            <div className="mb-4 max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className="w-full border-b border-slate-800 p-3 text-left hover:bg-slate-800 last:border-0"
                  >
                    <div className="font-medium text-white">{c.name}</div>
                    {c.phone && (
                      <div className="text-sm text-slate-400">{c.phone}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500">
                  Tidak ada pelanggan ditemukan.
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full rounded-xl bg-slate-800 py-3 font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              + Tambah Pelanggan Baru
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                placeholder="Masukkan nama..."
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-400">
                Nomor Telepon (Opsional)
              </label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                placeholder="08..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsCreatingNew(false)}
                className="flex-1 rounded-xl bg-slate-800 py-3 font-medium text-white hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={!newName.trim()}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Simpan & Pilih
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
