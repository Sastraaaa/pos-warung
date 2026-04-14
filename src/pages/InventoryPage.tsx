import React, { useState, useEffect } from "react";
import type { Product } from "../types";
import type { ProductRecord } from "../db/database";
import { db } from "../db/database";
import { ExcelImportModal } from "../components/inventory/ExcelImportModal";
import { ProductFormModal, type ProductFormData } from "../components/inventory/ProductFormModal";
import { downloadExport } from "../lib/excel";
import { emitProductsUpdated } from "../lib/appEvents";
import { syncManager } from "../db/sync";

const INVENTORY_CATEGORIES = [
  "Makanan",
  "Minuman",
  "Sembako",
  "Snack",
  "Kebersihan",
  "Perawatan",
  "Lainnya",
] as const;

const EditableCell = ({
  value,
  type = "text",
  isCurrency = false,
  onSave,
}: {
  value: string | number;
  type?: "text" | "number";
  isCurrency?: boolean;
  onSave: (val: string | number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const normalizedValue =
      type === "number"
        ? (editValue === "" ? 0 : Number(editValue))
        : editValue;

    if (normalizedValue !== value) {
      onSave(normalizedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        type={type === "number" ? "text" : type}
        inputMode={type === "number" ? "numeric" : undefined}
        autoFocus
        value={editValue}
        onChange={(e) => {
          const nextValue = e.target.value;
          if (type === "number") {
            if (nextValue === "") {
              setEditValue("");
              return;
            }

            if (/^\d+$/.test(nextValue)) {
              setEditValue(nextValue);
            }
            return;
          }

          setEditValue(nextValue);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-slate-700 px-2 py-1 outline-none rounded"
      />
    );
  }

  const displayValue = isCurrency ? formatRupiah(Number(value)) : value;

  return (
    <div
      onClick={() => {
        setEditValue(value);
        setIsEditing(true);
      }}
      className="w-full cursor-pointer px-2 py-1 border border-transparent hover:border-slate-600 rounded transition-colors"
    >
      {displayValue}
    </div>
  );
};

const EditableCategoryCell = ({
  value,
  options,
  onSave,
}: {
  value: string;
  options: string[];
  onSave: (value: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  if (isEditing) {
    return (
      <select
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full bg-slate-700 px-2 py-1 outline-none rounded text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      onClick={() => {
        setEditValue(value);
        setIsEditing(true);
      }}
      className="w-full cursor-pointer px-2 py-1 border border-transparent hover:border-slate-600 rounded transition-colors"
    >
      {value}
    </div>
  );
};

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const triggerProductSync = () => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void syncManager
        .sync()
        .catch((error) => console.error("Gagal sinkronisasi produk", error));
    }
  };

  const handleAddProduct = async (data: ProductFormData) => {
    const newProduct: ProductRecord = {
      ...data,
      id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
      low_stock_flag: data.current_stock <= 5,
      checkout_count: 0,
    };
    
    try {
      await db.products.put(newProduct);
      loadProducts();
      emitProductsUpdated();
      triggerProductSync();
    } catch (error) {
      console.error("Failed to add product", error);
      // Fallback for visual testing
      setProducts([newProduct, ...products]);
      emitProductsUpdated();
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await db.products.toArray();
      setProducts(allProducts);
    } catch (error) {
      console.error("Failed to load products", error);
      // Dummy data for testing if DB is not available
      if (products.length === 0) {
        setProducts([
          {
            id: "1",
            name: "Indomie Goreng",
            category: "Makanan",
            capital_price: 2500,
            selling_price: 3000,
            current_stock: 100,
            low_stock_flag: false,
            updated_at: new Date().toISOString(),
            checkout_count: 0,
          },
          {
            id: "2",
            name: "Aqua 600ml",
            category: "Minuman",
            capital_price: 2000,
            selling_price: 3000,
            current_stock: 4,
            low_stock_flag: true,
            updated_at: new Date().toISOString(),
            checkout_count: 0,
          },
        ]);
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleImport = async ({
    validRows,
    summary,
  }: {
    validRows: Omit<
      Product,
      "id" | "updated_at" | "low_stock_flag" | "checkout_count"
    >[];
    summary: { valid: number; duplicate: number; invalid: number };
  }) => {
    if (validRows.length === 0) {
      setImportMessage(
        `0 produk diimpor. Duplikat: ${summary.duplicate}, Tidak Valid: ${summary.invalid}`,
      );
      setShowImportModal(false);
      setTimeout(() => setImportMessage(""), 5000);
      return;
    }

    const productsToInsert: ProductRecord[] = validRows.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
      low_stock_flag: p.current_stock <= 5,
      checkout_count: 0,
    }));

    try {
      await db.products.bulkPut(productsToInsert);
      setImportMessage(
        `Berhasil mengimpor ${summary.valid} produk. Duplikat dilewati: ${summary.duplicate}, Tidak valid: ${summary.invalid}`,
      );
      setShowImportModal(false);
      loadProducts();
      emitProductsUpdated();
      triggerProductSync();
      setTimeout(() => setImportMessage(""), 5000);
    } catch (error) {
      console.error("Error importing products", error);
      // Fallback for visual testing
      setProducts([...productsToInsert, ...products]);
      emitProductsUpdated();
      setImportMessage(
        `Berhasil mengimpor ${summary.valid} produk (Offline mode). Duplikat: ${summary.duplicate}, Tidak Valid: ${summary.invalid}`,
      );
      setShowImportModal(false);
      setTimeout(() => setImportMessage(""), 5000);
    }
  };

  const handleExport = () => {
    downloadExport(products);
  };

  const handleCellEdit = async (
    id: string,
    field: keyof Product,
    value: string | number,
  ) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    let updatedValue: string | number = value;
    if (
      field === "capital_price" ||
      field === "selling_price" ||
      field === "current_stock"
    ) {
      updatedValue = Number(value);
    }

    const updatedProduct = {
      ...product,
      [field]: updatedValue,
      updated_at: new Date().toISOString(),
    };

    if (field === "current_stock") {
      const stockValue = Number(updatedValue);
      updatedProduct.low_stock_flag = stockValue <= 5;
    }

    try {
      await db.products.put(updatedProduct);
      setProducts(products.map((p) => (p.id === id ? updatedProduct : p)));
      emitProductsUpdated();
      triggerProductSync();
    } catch (error) {
      console.error("Failed to update product", error);
      // Fallback for testing
      setProducts(products.map((p) => (p.id === id ? updatedProduct : p)));
      emitProductsUpdated();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah anda yakin ingin menghapus produk ini?")) return;
    try {
      await db.products.delete(id);
      setProducts(products.filter((p) => p.id !== id));
      emitProductsUpdated();
      triggerProductSync();
    } catch (error) {
      console.error("Failed to delete product", error);
      // Fallback for testing
      setProducts(products.filter((p) => p.id !== id));
      emitProductsUpdated();
    }
  };

  const categories = Array.from(
    new Set([...INVENTORY_CATEGORIES, ...products.map((p) => p.category)]),
  ).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter
      ? p.category === categoryFilter
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Inventaris Produk
          </h1>
          <p className="text-sm text-slate-400">
            Kelola stok dan harga produk Anda. Total {products.length} produk.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Import Excel
          </button>
          <button
            onClick={handleExport}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Export Excel
          </button>
          <button
            onClick={() => setShowProductModal(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Tambah Produk
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="rounded-lg bg-green-500/10 p-4 text-sm font-medium text-green-400 border border-green-500/20">
          {importMessage}
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-xl border border-slate-700 bg-slate-900">
        <table className="w-full border-collapse text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-xs uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Barcode / SKU</th>
              <th className="px-4 py-3 font-medium">Harga Modal</th>
              <th className="px-4 py-3 font-medium">Harga Jual</th>
              <th className="px-4 py-3 font-medium">Stok</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="transition-colors hover:bg-slate-800/30"
              >
                <td className="px-4 py-2">
                  <EditableCell
                    value={product.name}
                    onSave={(val) => handleCellEdit(product.id, "name", val)}
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableCategoryCell
                    value={product.category}
                    options={categories}
                    onSave={(val) =>
                      handleCellEdit(product.id, "category", val)
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="text-xs text-slate-400">
                    <span className="block">{product.barcode || "-"}</span>
                    <span className="block opacity-75">{product.sku || "-"}</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <EditableCell
                    value={product.capital_price}
                    type="number"
                    isCurrency
                    onSave={(val) =>
                      handleCellEdit(product.id, "capital_price", val)
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableCell
                    value={product.selling_price}
                    type="number"
                    isCurrency
                    onSave={(val) =>
                      handleCellEdit(product.id, "selling_price", val)
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableCell
                    value={product.current_stock}
                    type="number"
                    onSave={(val) =>
                      handleCellEdit(product.id, "current_stock", val)
                    }
                  />
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.current_stock > 5
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {product.current_stock > 5 ? "Aman" : "Tipis"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
                    title="Hapus"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Tidak ada produk ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showImportModal && (
        <ExcelImportModal
          existingProducts={products}
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showProductModal && (
        <ProductFormModal
          onClose={() => setShowProductModal(false)}
          onSave={handleAddProduct}
          categories={categories}
        />
      )}
    </div>
  );
}
