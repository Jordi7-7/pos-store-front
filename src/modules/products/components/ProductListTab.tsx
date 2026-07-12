import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../services/products.service';
import { ProductEditDrawer } from './ProductEditDrawer';

interface ProductListTabProps {
  products: Product[];
  isLoading: boolean;
  categories: any[];
  uploadedImages: any[];
  selectedBranchId: string;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  page: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export const ProductListTab: React.FC<ProductListTabProps> = ({ 
  products, 
  isLoading,
  categories,
  uploadedImages,
  selectedBranchId,
  meta,
  page,
  onPageChange,
  search,
  onSearchChange
}) => {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  
  // Edit Drawer States
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<any | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Search input local state for debounced or input experience
  const [searchInput, setSearchInput] = useState(search);

  const toggleExpand = (productId: string) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  const handleOpenEditDrawer = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setSelectedProductToEdit(product);
    setIsEditDrawerOpen(true);
  };

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setSelectedProductToEdit(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput.trim());
    onPageChange(1); // Reset to page 1 on new search
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
    onPageChange(1);
  };

  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm space-y-4 relative">
      
      {/* Header and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-card pb-4 mb-2">
        <div>
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide">Productos Registrados ({meta.total})</h4>
          <p className="text-xs text-neutral">Consulta, despliega existencias o edita tus productos.</p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o SKU..." 
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-8 text-xs text-secondary focus:outline-none focus:border-primary transition-all placeholder-neutral"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-2 text-xs text-neutral hover:text-secondary font-bold"
              >
                ×
              </button>
            )}
          </div>
          <button 
            type="submit"
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            Buscar
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="bg-bg-card border border-border-card rounded-2xl p-8 text-center text-neutral text-xs flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Buscando productos en catálogo...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-bg-card border border-border-card rounded-2xl p-8 text-center text-neutral text-xs flex flex-col items-center justify-center gap-3">
          <Package className="w-10 h-10 opacity-30 text-neutral" />
          <span>No se encontraron productos en esta página.</span>
          {search && (
            <button
              onClick={handleClearSearch}
              className="text-xs text-primary hover:underline font-bold mt-1"
            >
              Limpiar filtros de búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const hasMultipleVariants = product.variants.length > 1;
            const totalStock = product.variants.reduce((sum, v) => sum + (v.stocks?.reduce((sSum, s) => sSum + s.quantity, 0) || 0), 0);

            return (
              <div 
                key={product.id} 
                className={`border border-border-card rounded-xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'border-primary/40 bg-bg-dark/10' : 'bg-bg-dark/5 hover:border-border-card/80'
                }`}
              >
                {/* Product Header Row */}
                <div 
                  onClick={() => toggleExpand(product.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-bg-card border border-border-card flex items-center justify-center overflow-hidden shrink-0">
                      {(product as any).images && (product as any).images.length > 0 ? (
                        <img src={(product as any).images[0].url} className="w-full h-full object-cover" alt={product.name} />
                      ) : (
                        <Package className="w-5 h-5 text-neutral" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-secondary truncate">{product.name}</h5>
                      <p className="text-[10px] text-neutral truncate max-w-md mt-0.5">{product.description || 'Sin descripción'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-[11px] text-secondary">
                    <div className="text-right">
                      <span className="text-neutral block text-[9px] uppercase tracking-wider">Variantes</span>
                      <span className="font-semibold">{product.variants.length}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral block text-[9px] uppercase tracking-wider">Stock Total</span>
                      <span className={`font-bold ${totalStock > 0 ? 'text-secondary' : 'text-rose-500'}`}>{totalStock} pzs</span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral block text-[9px] uppercase tracking-wider">Precio Rango</span>
                      <span className="font-bold text-primary">
                        {hasMultipleVariants 
                          ? `$${Math.min(...product.variants.map(v => v.salePrice)).toFixed(2)} - $${Math.max(...product.variants.map(v => v.salePrice)).toFixed(2)}`
                          : `$${(product.variants[0]?.salePrice || 0).toFixed(2)}`
                        }
                      </span>
                    </div>
                    
                    {/* Actions column */}
                    <div className="flex items-center gap-3 pl-2">
                      <button
                        onClick={(e) => handleOpenEditDrawer(e, product)}
                        className="p-1.5 hover:bg-primary/10 text-neutral hover:text-primary rounded-lg transition-colors"
                        title="Editar Ficha de Producto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="text-neutral">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Variants Details */}
                {isExpanded && (
                  <div className="border-t border-border-card/50 bg-bg-card/40 p-4 space-y-3 animate-slide-down">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] text-left">
                        <thead>
                          <tr className="text-neutral border-b border-border-card/50">
                            <th className="pb-2 font-semibold">SKU</th>
                            <th className="pb-2 font-semibold">Código de Barras</th>
                            <th className="pb-2 font-semibold">Precios</th>
                            <th className="pb-2 font-semibold">Atributos / Variación</th>
                            <th className="pb-2 font-semibold text-right">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card/30">
                          {product.variants.map((v, idx) => {
                            const varStock = v.stocks?.find(s => s.branchId === selectedBranchId)?.quantity || 0;
                            return (
                              <tr key={idx} className="text-secondary hover:bg-bg-dark/10">
                                <td className="py-2.5 font-mono">{v.sku}</td>
                                <td className="py-2.5 font-mono">{v.barcode || 'N/A'}</td>
                                <td className="py-2.5">
                                  <span className="block text-neutral text-[9px]">Compra: ${v.purchasePrice.toFixed(2)}</span>
                                  <span className="block text-primary font-bold">Venta: ${v.salePrice.toFixed(2)}</span>
                                </td>
                                <td className="py-2.5 text-neutral font-medium">
                                  {v.attributeValues && v.attributeValues.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {v.attributeValues.map((av: any, aIdx: number) => (
                                        <span key={aIdx} className="px-1.5 py-0.5 bg-bg-dark border border-border-card rounded text-[9px] text-secondary">
                                          {av.attribute?.name || 'Attr'}: {av.value || av.attributeValueId}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="italic text-neutral/70">Estándar (Sin atributos)</span>
                                  )}
                                </td>
                                <td className="py-2.5 font-bold text-right">
                                  <span className={varStock > 0 ? 'text-secondary' : 'text-rose-500'}>
                                    {varStock} pzs
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer Controls */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border-card pt-4 mt-2">
          <span className="text-[11px] text-neutral">
            Mostrando página <span className="font-bold text-secondary">{page}</span> de <span className="font-bold text-secondary">{meta.totalPages}</span> ({meta.total} productos en total)
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 bg-bg-dark border border-border-card hover:bg-bg-dark/80 text-secondary disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
              disabled={page === meta.totalPages}
              className="p-2 bg-bg-dark border border-border-card hover:bg-bg-dark/80 text-secondary disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Product Edit Drawer */}
      <ProductEditDrawer
        product={selectedProductToEdit}
        isOpen={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        categories={categories}
        uploadedImages={uploadedImages}
        selectedBranchId={selectedBranchId}
      />
    </div>
  );
};
