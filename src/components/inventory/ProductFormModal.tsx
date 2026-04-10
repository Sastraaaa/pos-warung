import React, { useState } from "react";

export interface ProductFormData {
  name: string;
  category: string;
  capital_price: number;
  selling_price: number;
  current_stock: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  catatan?: string;
}

interface ProductFormModalProps {
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
}

export function ProductFormModal({ onClose, onSave }: ProductFormModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "",
    capital_price: 0,
    selling_price: 0,
    current_stock: 0,
    barcode: "",
    sku: "",
    supplier: "",
    catatan: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const isValid =
    formData.name.trim() !== "" &&
    formData.category.trim() !== "" &&
    formData.capital_price >= 0 &&
    formData.selling_price >= 0 &&
    formData.current_stock >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save product", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Tambah Produk</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wajib */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">
                Informasi Wajib
              </h3>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Nama Produk <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Contoh: Indomie Goreng"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Kategori <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Contoh: Makanan"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Harga Modal <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="capital_price"
                  value={formData.capital_price}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Harga Jual <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Stok Awal <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="current_stock"
                  value={formData.current_stock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Opsional */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">
                Informasi Opsional
              </h3>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Scan atau ketik barcode"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Contoh: IND-GRG-01"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Nama supplier"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">
                  Catatan
                </label>
                <textarea
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Catatan tambahan produk..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
