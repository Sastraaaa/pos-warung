import { useState, useEffect, useMemo } from "react";
import type { Product } from "../../types";
import { db } from "../../db/database";
import { PRODUCTS_UPDATED_EVENT } from "../../lib/appEvents";

interface Props {
  onAddToCart: (product: Product) => void;
}

export function ProductCatalog({ onAddToCart }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleProductsUpdated = () => {
      void loadProducts();
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    };
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await db.getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats)].filter(Boolean);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lowerQuery));
    }

    return [...result].sort(
      (a, b) => (b.checkout_count || 0) - (a.checkout_count || 0),
    );
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl bg-[var(--color-surface-panel)] p-5 border border-[var(--color-surface-border)] shadow-sm">
      {/* Top Bar: Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium sm:w-48"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-slate-400 font-medium">
            Memuat data produk...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500 gap-2">
            <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium text-slate-400">Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 pb-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                disabled={product.current_stock <= 0}
                className={`group relative flex h-36 flex-col justify-between overflow-hidden rounded-xl border bg-slate-900/40 p-4 text-left transition-all duration-200 ${
                  product.current_stock <= 0
                    ? "cursor-not-allowed border-slate-800 opacity-60 grayscale-[50%]"
                    : product.low_stock_flag
                      ? "border-red-500/30 hover:border-red-500/80 hover:bg-slate-800 shadow-sm hover:shadow-red-500/10"
                      : "border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 shadow-sm hover:shadow-blue-500/10"
                }`}
              >
                {product.low_stock_flag && product.current_stock > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/20">
                    Sisa {product.current_stock}
                  </span>
                )}
                {product.current_stock <= 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700">
                    Habis
                  </span>
                )}
                <div className="mb-2 w-full pr-14">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400/80 uppercase mb-1">
                    {product.category}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-100 group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-auto w-full flex items-end justify-between">
                  <div className="text-base font-bold text-emerald-400">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(product.selling_price)}
                  </div>
                  {!product.low_stock_flag && product.current_stock > 0 && (
                    <div className="text-xs font-medium text-slate-500/80">
                      Stok {product.current_stock}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
