import React, { useState } from 'react';
import { useProducts, useCreateProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { Eye, Tag, Barcode, Check } from 'lucide-react';

interface ProductsViewProps {
  selectedBranchId: string;
  uploadedImages: any[];
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  selectedBranchId,
  uploadedImages
}) => {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { categories, createCategory, isCreating: isCreatingCategory } = useCategories();
  const { createProduct } = useCreateProduct();

  const [productViewState, setProductViewState] = useState<'list' | 'create'>('list');

  // Product Creation Fields
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [productSuccess, setProductSuccess] = useState('');

  // Dynamic Variants Constructor
  const [variantsList, setVariantsList] = useState<{
    sku: string;
    barcode: string;
    purchasePrice: number;
    salePrice: number;
    size: string;
    color: string;
  }[]>([]);
  
  // Single Variant Form Inputs
  const [varSku, setVarSku] = useState('');
  const [varBarcode, setVarBarcode] = useState('');
  const [varPurchasePrice, setVarPurchasePrice] = useState('10.00');
  const [varSalePrice, setVarSalePrice] = useState('19.99');
  const [varSize, setVarSize] = useState('M');
  const [varColor, setVarColor] = useState('Negro');

  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySuccessMessage, setCategorySuccessMessage] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      setCategorySuccessMessage('¡Categoría creada con éxito!');
      setTimeout(() => setCategorySuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!varSku || !varBarcode) return;
    setVariantsList([...variantsList, {
      sku: varSku,
      barcode: varBarcode,
      purchasePrice: parseFloat(varPurchasePrice),
      salePrice: parseFloat(varSalePrice),
      size: varSize,
      color: varColor
    }]);
    setVarSku('');
    setVarBarcode('');
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || variantsList.length === 0) {
      alert('Por favor agrega el nombre del producto y al menos una variante.');
      return;
    }
    try {
      const cat = prodCategory || (categories[0] && categories[0].id) || undefined;
      
      const payloadVariants = variantsList.map(v => ({
        sku: v.sku,
        barcode: v.barcode,
        purchasePrice: v.purchasePrice,
        salePrice: v.salePrice,
        attributeValues: [],
        stocks: selectedBranchId ? [{
          branchId: selectedBranchId,
          quantity: 50
        }] : []
      }));

      await createProduct({
        name: prodName,
        description: prodDesc,
        categoryId: cat,
        imageIds: selectedImages,
        variants: payloadVariants
      });

      setProductSuccess('¡Producto creado con éxito en el backend!');
      setProdName('');
      setProdDesc('');
      setVariantsList([]);
      setSelectedImages([]);
      setTimeout(() => {
        setProductSuccess('');
        setProductViewState('list');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Error al registrar el producto.');
    }
  };

  const handleToggleImageSelection = (imageId: string) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Product Header / View Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-secondary">Catálogo General de Productos</h3>
        <button 
          onClick={() => setProductViewState(productViewState === 'list' ? 'create' : 'list')}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <Eye className="w-4 h-4" />
          <span>{productViewState === 'list' ? 'Registrar Producto' : 'Ver Productos'}</span>
        </button>
      </div>

      {productViewState === 'list' ? (
        /* PRODUCT LIST VIEW */
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          {isLoadingProducts ? (
            <div className="text-center py-10 text-xs text-neutral">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-xs text-neutral">
              No hay productos registrados. Haz clic en "Registrar Producto" para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-neutral border-b border-border-card">
                    <th className="pb-3 font-semibold">Nombre</th>
                    <th className="pb-3 font-semibold">Descripción</th>
                    <th className="pb-3 font-semibold">Código SKU</th>
                    <th className="pb-3 font-semibold">Cód. Barra</th>
                    <th className="pb-3 font-semibold">Precio Venta</th>
                    <th className="pb-3 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card/50">
                  {products.map((prod) => (
                    <tr key={prod.id} className="text-secondary hover:bg-bg-dark/20">
                      <td className="py-3 font-bold">{prod.name}</td>
                      <td className="py-3 text-neutral max-w-xs truncate">{prod.description}</td>
                      <td className="py-3 font-mono">{prod.variants[0]?.sku || 'N/A'}</td>
                      <td className="py-3 font-mono">{prod.variants[0]?.barcode || 'N/A'}</td>
                      <td className="py-3 font-semibold text-primary">
                        ${prod.variants[0]?.salePrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 font-bold">{prod.variants[0]?.stocks?.[0]?.quantity || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* PRODUCT CREATION FORM VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* General Product Fields */}
            <form onSubmit={handleCreateProductSubmit} className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Información General</h4>
              
              {productSuccess && (
                <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {productSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] text-neutral mb-1">Nombre del Producto *</label>
                  <input 
                    type="text" 
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ej: Camiseta de Algodón Aura" 
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-neutral mb-1">Descripción</label>
                  <textarea 
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Detalles del producto..." 
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary h-20 resize-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-neutral mb-1">Categoría</label>
                  <select 
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                  >
                    <option value="">Seleccione una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Associated Images Selection */}
              {uploadedImages.length > 0 && (
                <div className="pt-2">
                  <label className="block text-[11px] text-neutral mb-2">Asociar Imágenes de la Galería ({selectedImages.length} seleccionadas)</label>
                  <div className="flex gap-2.5 overflow-x-auto pb-1.5">
                    {uploadedImages.map((img) => {
                      const isSelected = selectedImages.includes(img.id);
                      return (
                        <div 
                          key={img.id}
                          onClick={() => handleToggleImageSelection(img.id)}
                          className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden cursor-pointer flex-shrink-0 transition-all ${
                            isSelected ? 'border-primary scale-95 shadow-md shadow-primary/20' : 'border-border-card opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} className="w-full h-full object-cover" alt="subido" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white font-bold" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Display added variants */}
              {variantsList.length > 0 && (
                <div className="border border-border-card rounded-xl p-4 bg-bg-dark space-y-2">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Variantes Configuradas ({variantsList.length})</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {variantsList.map((v, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-bg-card p-2 rounded-lg border border-border-card text-secondary">
                        <div className="space-y-0.5">
                          <span className="font-bold block">SKU: {v.sku} | Barras: {v.barcode}</span>
                          <span className="text-neutral">Atributos: Talla {v.size} / Color {v.color}</span>
                          <span className="text-neutral block">Compra: ${v.purchasePrice} | Venta: ${v.salePrice}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-rose-600 hover:text-rose-500 font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-colors">
                Guardar Producto en el Sistema
              </button>
            </form>

            {/* Dynamic Variant Creator form */}
            <form onSubmit={handleAddVariant} className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Constructor de Variaciones</h4>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Código SKU *</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral" />
                    <input 
                      type="text" 
                      required
                      value={varSku}
                      onChange={(e) => setVarSku(e.target.value)}
                      placeholder="AUR-CAM-M-N" 
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Código de Barras *</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral" />
                    <input 
                      type="text" 
                      required
                      value={varBarcode}
                      onChange={(e) => setVarBarcode(e.target.value)}
                      placeholder="78610029302" 
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Precio Compra ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={varPurchasePrice}
                    onChange={(e) => setVarPurchasePrice(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Precio Venta ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={varSalePrice}
                    onChange={(e) => setVarSalePrice(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Talla</label>
                  <select 
                    value={varSize} 
                    onChange={(e) => setVarSize(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
                  >
                    <option>S</option>
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Color</label>
                  <select 
                    value={varColor} 
                    onChange={(e) => setVarColor(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
                  >
                    <option>Negro</option>
                    <option>Blanco</option>
                    <option>Azul</option>
                    <option>Rojo</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-secondary hover:bg-secondary/80 text-white text-xs font-bold rounded-xl transition-colors">
                Agregar Variante a la Lista
              </button>
            </form>
          </div>

          {/* Quick Guide card */}
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 flex flex-col justify-between shadow-sm h-fit space-y-4">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Guía del Catálogo</h4>
            <p className="text-xs text-neutral">Carga tus imágenes en la pestaña de **Multimedia / Galería** primero, luego aparecerán en este formulario para asociarlas al producto.</p>
          </div>
        </div>
      )}

      {/* Gestión de Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Crear Categoría (POST /products/categories)</h4>
          {categorySuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {categorySuccessMessage}
            </div>
          )}
          <form onSubmit={handleCreateCategory} className="flex gap-3">
            <input 
              type="text" 
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría (ej: Zapatos)" 
              className="flex-1 bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary"
            />
            <button 
              type="submit" 
              disabled={isCreatingCategory}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isCreatingCategory ? 'Creando...' : 'Crear Categoría'}
            </button>
          </form>
        </div>
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Categorías Activas</h4>
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <span key={cat.id} className="px-3 py-1 bg-bg-dark border border-border-card rounded-lg text-xs text-secondary font-medium">
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductsView;
