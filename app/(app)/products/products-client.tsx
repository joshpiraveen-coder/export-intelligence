"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package, Plus, Search, Filter, Download, Upload,
  MoreHorizontal, ExternalLink, Edit, Trash2, CheckCircle, AlertTriangle,
} from "lucide-react";
import { cn, truncate, formatDate } from "@/lib/utils";

interface ProductsClientProps {
  products: any[];
  total: number;
  page: number;
  pageSize: number;
  categories: any[];
}

export function ProductsClient({
  products,
  total,
  page,
  pageSize,
  categories,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) params.set("q", searchQuery);
    else params.delete("q");
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total} products in your catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            <Upload size={14} />
            Import CSV
          </button>
          <Link href="/products/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
              <Plus size={16} />
              Add Product
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products, SKU, barcode…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Search
            </button>
          </form>
          <select
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) params.set("category", e.target.value);
              else params.delete("category");
              params.set("page", "1");
              router.push(`/products?${params.toString()}`);
            }}
            defaultValue={searchParams.get("category") || ""}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No products found</p>
            <p className="text-xs mt-1">
              {searchQuery ? "Try a different search term" : "Add your first product to get started"}
            </p>
            {!searchQuery && (
              <Link href="/products/new">
                <button className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">
                  Add Product
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    HS Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Origin
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Attributes
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Added
                  </th>
                  <th className="text-right px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    variants={itemVariants}
                    className="hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/products/${product.id}`}>
                            <p className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate max-w-[180px]">
                              {product.name}
                            </p>
                          </Link>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {product.sku}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs bg-secondary border border-border px-2 py-1 rounded-full text-muted-foreground">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {product.hsCode ? (
                        <span className="text-xs font-mono text-foreground">{product.hsCode}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {product.countryOfOrigin || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {product.isHalal && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-medium">
                            Halal
                          </span>
                        )}
                        {product.isOrganic && (
                          <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-medium">
                            Organic
                          </span>
                        )}
                        {product.isVegan && (
                          <span className="text-[10px] bg-lime-500/15 text-lime-400 border border-lime-500/30 px-1.5 py-0.5 rounded-full font-medium">
                            Vegan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(product.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link href={`/products/${product.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                            <ExternalLink size={14} />
                          </button>
                        </Link>
                        <Link href={`/products/${product.id}/edit`}>
                          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                            <Edit size={14} />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                (p) => (
                  <Link
                    key={p}
                    href={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(p) })}`}
                  >
                    <button
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
                        p === page
                          ? "bg-primary text-white"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
