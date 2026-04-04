import { useState, useEffect, useMemo } from "react";
import type { Product } from "../../types";
import { db } from "../../db/database";

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

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      // @ts-ignore
      const data = await (db.getAllProducts
        ? db.getAllProducts()
        : db.products.toArray());
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

    return result.sort(
      (a, b) => (b.checkout_count || 0) - (a.checkout_count || 0),
    );
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Top Bar: Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Memuat produk...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <p className="text-lg">Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                disabled={product.current_stock <= 0}
                className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-slate-800 p-4 text-left transition-all ${
                  product.current_stock <= 0
                    ? "cursor-not-allowed border-slate-700 opacity-50"
                    : product.low_stock_flag
                      ? "border-red-500/50 animate-pulse hover:border-red-500"
                      : "border-slate-700 hover:border-slate-500 hover:bg-slate-750"
                }`}
              >
                {product.low_stock_flag && product.current_stock > 0 && (
                  <span className="absolute right-2 top-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-bold text-red-400">
                    Sisa {product.current_stock}
                  </span>
                )}
                {product.current_stock <= 0 && (
                  <span className="absolute right-2 top-2 rounded bg-slate-700 px-1.5 py-0.5 text-xs font-bold text-slate-400">
                    Habis
                  </span>
                )}
                <div className="mb-2">
                  <div className="text-xs text-slate-400">
                    {product.category}
                  </div>
                  <h3 className="line-clamp-2 font-medium text-white">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-auto">
                  <div className="text-lg font-bold text-green-400">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(product.selling_price)}
                  </div>
                  {!product.low_stock_flag && product.current_stock > 0 && (
                    <div className="text-xs text-slate-500">
                      Stok: {product.current_stock}
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
