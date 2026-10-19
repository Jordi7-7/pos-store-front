import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Package, 
  Layers, 
  Save, 
  Loader2, 
  Sparkles, 
  Copy, 
  Plus, 
  Trash2, 
  ImageIcon 
} from 'lucide-react';
import { toast } from 'sonner';

import { useCategories } from '../hooks/useCategories';
import { useAttributes } from '../hooks/useAttributes';
import { useProductDetail, useProductMutations } from '../hooks';
import { MediaGallerySelectorModal } from './forms/MediaGallerySelectorModal';
import { ImageUploadModal } from './forms/ImageUploadModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Field, FieldLabel } from '@/components/ui/field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AttributeDTO as Attribute } from '../types';

interface ProductVariableEditModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  selectedBranchId?: string;
}

interface EditableVariantRow {
  id: string;
  sku: string;
  barcode: string;
  purchasePrice: number | string;
  salePrice: number | string;
  wholesalePrice: number | string | null;
  combinationText: string;
  images?: { id: string; url: string; description?: string }[];
  imageIds?: string[];
  hasChanged?: boolean;
}

export const ProductVariableEditModal: React.FC<ProductVariableEditModalProps> = ({
  productId,
  isOpen,
  onClose,
  categories,
  selectedBranchId,
}) => {
  const { product, isLoading: isLoadingProduct } = useProductDetail(productId || undefined, isOpen && Boolean(productId));
  const { 
    updateProduct, 
    isUpdatingProduct: isUpdatingParent, 
    updateVariant, 
    isUpdatingVariant, 
    createVariant, 
    isCreatingVariant: isCreatingNewVariant, 
    deleteVariant, 
    isDeletingVariant 
  } = useProductMutations();
  const { createCategory, isCreating: isCreatingCategory } = useCategories();
  const { attributes } = useAttributes();

  // Active sub-tab in edit modal
  const [activeTab, setActiveTab] = useState<'info' | 'variants'>('info');

  // Parent form state
  const { control, reset, getValues, watch } = useForm({
    defaultValues: {
      name: '',
      baseSku: '',
      description: '',
      categoryId: '',
    },
  });

  const baseSkuValue = watch('baseSku');

  // Images state
  const [selectedImages, setSelectedImages] = useState<{ id: string; url: string; description?: string }[]>([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeVariantForImage, setActiveVariantForImage] = useState<string | null>(null);

  // Inline Category creation
  const [isCreatingCategoryInline, setIsCreatingCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Variants local edit state
  const [editableVariants, setEditableVariants] = useState<EditableVariantRow[]>([]);
  const [bulkPurchasePrice, setBulkPurchasePrice] = useState<string>('');
  const [bulkSalePrice, setBulkSalePrice] = useState<string>('');
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState<string>('');

  // Add new variant dialog state
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantBarcode, setNewVariantBarcode] = useState('');
  const [newVariantPurchasePrice, setNewVariantPurchasePrice] = useState('0');
  const [newVariantSalePrice, setNewVariantSalePrice] = useState('0');
  const [newVariantWholesalePrice, setNewVariantWholesalePrice] = useState('');
  const [newVariantInitialStock, setNewVariantInitialStock] = useState('0');
  const [newVariantSelectedValues, setNewVariantSelectedValues] = useState<Record<string, string>>({}); // attrId -> valueId

  // Atributos activos asignados a este producto (extraídos de sus variantes)
  const productAttributes = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return attributes;

    // Recolectar los attributeIds que usa este producto
    const usedAttrIds = new Set<string>();
    product.variants.forEach((v: any) => {
      (v.attributeValues || []).forEach((av: any) => {
        if (av.attributeId) usedAttrIds.add(av.attributeId);
        else if (av.attribute?.id) usedAttrIds.add(av.attribute.id);
      });
    });

    if (usedAttrIds.size === 0) return attributes;

    // Filtrar del catálogo global solo los atributos que tiene este producto
    return attributes.filter((attr: Attribute) => usedAttrIds.has(attr.id));
  }, [product, attributes]);

  // Populate data when product arrives
  useEffect(() => {
    if (!product || !isOpen) return;

    reset({
      name: product.name || '',
      baseSku: (product as any).baseSku || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
    });

    const initialImages = (product.images && product.images.length > 0)
      ? product.images
      : [];
    setSelectedImages(initialImages.map((img: any) => ({ id: img.id, url: img.url || '', description: img.description })));

    if (product.variants && product.variants.length > 0) {
      setEditableVariants(
        product.variants.map((v: any) => {
          const combo = (v.attributeValues || [])
            .map((av: any) => `${av.attribute?.name || 'Atributo'}: ${av.value}`)
            .join(' · ');

          const varImages = (v.images || []).map((img: any) => ({
            id: img.id,
            url: img.url || '',
            description: img.description,
          }));

          return {
            id: v.id,
            sku: v.sku || '',
            barcode: v.barcode || '',
            purchasePrice: Number(v.purchasePrice) || 0,
            salePrice: Number(v.salePrice) || 0,
            wholesalePrice: v.wholesalePrice !== null && v.wholesalePrice !== undefined ? Number(v.wholesalePrice) : null,
            combinationText: combo || 'Variante',
            images: varImages,
            imageIds: varImages.map((img: any) => img.id),
            hasChanged: false,
          };
        })
      );
    } else {
      setEditableVariants([]);
    }
  }, [product, isOpen, reset]);

  // Update variant field
  const handleUpdateVariantField = (id: string, field: keyof EditableVariantRow, value: any) => {
    setEditableVariants((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value, hasChanged: true } : row))
    );
  };

  // Bulk apply
  const handleApplyBulk = () => {
    if (editableVariants.length === 0) return;
    setEditableVariants((prev) =>
      prev.map((v) => ({
        ...v,
        purchasePrice: bulkPurchasePrice !== '' ? Number(bulkPurchasePrice) : v.purchasePrice,
        salePrice: bulkSalePrice !== '' ? Number(bulkSalePrice) : v.salePrice,
        wholesalePrice: bulkWholesalePrice !== '' ? Number(bulkWholesalePrice) : v.wholesalePrice,
        hasChanged: true,
      }))
    );
    toast.success('Valores aplicados masivamente a las variantes en pantalla.');
  };

  // Delete variant
  const handleDeleteVariant = async (variantId: string, sku: string) => {
    if (editableVariants.length <= 1) {
      toast.warning('No puedes eliminar la última variante restante del producto.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar la variante "${sku}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteVariant(variantId);
      setEditableVariants((prev) => prev.filter((v) => v.id !== variantId));
      toast.success(`Variante "${sku}" eliminada con éxito.`);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la variante.');
    }
  };

  // Inline Category creation
  const handleCreateCategory = async (onChange: (id: string) => void) => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory(newCategoryName.trim());
      onChange(created.id);
      setNewCategoryName('');
      setIsCreatingCategoryInline(false);
      toast.success('¡Categoría creada e incorporada!');
    } catch (e: any) {
      toast.error(e.message || 'Error al crear la categoría.');
    }
  };

  // Save Parent Info
  const handleSaveParent = async () => {
    if (!productId) return;
    const values = getValues();
    if (!values.name.trim()) {
      toast.warning('El nombre del producto no puede estar vacío.');
      return;
    }

    try {
      await updateProduct({
        id: productId,
        input: {
          name: values.name.trim(),
          baseSku: values.baseSku?.trim() ? values.baseSku.trim().toUpperCase() : null,
          description: values.description.trim(),
          categoryId: values.categoryId || null,
          imageIds: selectedImages.map((img) => img.id),
        },
      });
      toast.success('¡Información del producto padre guardada con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el producto.');
    }
  };

  // Save Variant Rows
  const handleSaveVariants = async () => {
    const changedRows = editableVariants.filter((v) => v.hasChanged);
    if (changedRows.length === 0) {
      toast.info('No se han modificado variantes.');
      return;
    }

    // Check SKU duplicates
    const skuSet = new Set<string>();
    for (const row of editableVariants) {
      if (!row.sku.trim()) {
        toast.error('Todos los SKUs deben ser válidos y no estar vacíos.');
        return;
      }
      const upper = row.sku.trim().toUpperCase();
      if (skuSet.has(upper)) {
        toast.error(`El SKU "${row.sku}" está repetido entre las variantes.`);
        return;
      }
      skuSet.add(upper);
    }

    try {
      for (const row of changedRows) {
        await updateVariant({
          variantId: row.id,
          input: {
            sku: row.sku.trim(),
            barcode: row.barcode.trim() || undefined,
            purchasePrice: Number(row.purchasePrice) || 0,
            salePrice: Number(row.salePrice) || 0,
            wholesalePrice: row.wholesalePrice !== null && row.wholesalePrice !== undefined ? Number(row.wholesalePrice) : null,
            imageIds: row.images ? row.images.map((img) => img.id) : (row.imageIds || []),
          },
        });
      }

      setEditableVariants((prev) => prev.map((r) => ({ ...r, hasChanged: false })));
      toast.success(`¡Se actualizaron ${changedRows.length} variante(s) con éxito!`);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los cambios en las variantes.');
    }
  };

  // Open Add Variant dialog with pre-filled prices/sku
  const handleOpenAddVariant = () => {
    // Derive base SKU from first variant or product name
    const firstSku = editableVariants[0]?.sku || '';
    const basePrefix = firstSku.includes('-')
      ? firstSku.split('-').slice(0, -1).join('-') || firstSku.split('-')[0]
      : (product?.name?.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'VAR');

    // Find next sequential number
    const maxSerial = editableVariants.reduce((max, v) => {
      const parts = v.sku.split('-');
      const lastPart = Number(parts[parts.length - 1]);
      return !isNaN(lastPart) && lastPart > max ? lastPart : max;
    }, editableVariants.length);

    setNewVariantSku(`${basePrefix}-${maxSerial + 1}`);
    setNewVariantBarcode('');
    setNewVariantPurchasePrice(editableVariants[0] ? String(editableVariants[0].purchasePrice) : '0');
    setNewVariantSalePrice(editableVariants[0] ? String(editableVariants[0].salePrice) : '0');
    setNewVariantWholesalePrice(editableVariants[0]?.wholesalePrice ? String(editableVariants[0].wholesalePrice) : '');
    setNewVariantInitialStock('0');
    setNewVariantSelectedValues({});
    setIsAddVariantOpen(true);
  };

  // Submit New Variant
  const handleSubmitNewVariant = async () => {
    if (!productId) return;
    if (!newVariantSku.trim()) {
      toast.warning('Por favor ingresa un SKU para la nueva variante.');
      return;
    }

    const selectedAttrValueIds = Object.values(newVariantSelectedValues).filter(Boolean);
    if (selectedAttrValueIds.length === 0) {
      toast.warning('Selecciona al menos un valor de atributo (ej. Talla o Color) para la nueva combinación.');
      return;
    }

    try {
      const payload: any = {
        sku: newVariantSku.trim().toUpperCase(),
        barcode: newVariantBarcode.trim() || undefined,
        purchasePrice: Number(newVariantPurchasePrice) || 0,
        salePrice: Number(newVariantSalePrice) || 0,
        wholesalePrice: newVariantWholesalePrice !== '' ? Number(newVariantWholesalePrice) : null,
        attributeValues: selectedAttrValueIds.map((id) => ({ attributeValueId: id })),
        stocks: selectedBranchId ? [{ branchId: selectedBranchId, quantity: Number(newVariantInitialStock) || 0 }] : [],
      };

      const created = await createVariant({ productId, input: payload });

      // Build combination text for table row
      const comboText = (created.attributeValues || [])
        .map((av: any) => `${av.attribute?.name || 'Atributo'}: ${av.value}`)
        .join(' · ');

      setEditableVariants((prev) => [
        ...prev,
        {
          id: String(created.id || Date.now()),
          sku: created.sku,
          barcode: created.barcode || '',
          purchasePrice: Number(created.purchasePrice) || 0,
          salePrice: Number(created.salePrice) || 0,
          wholesalePrice: created.wholesalePrice !== null && created.wholesalePrice !== undefined ? Number(created.wholesalePrice) : null,
          combinationText: comboText || 'Nueva Variante',
          images: (created.images || []).map((img: any) => ({ id: img.id, url: img.url || '', description: img.description })),
          imageIds: (created.images || []).map((img: any) => img.id),
          hasChanged: false,
        },
      ]);

      setIsAddVariantOpen(false);
      toast.success(`¡Variante "${created.sku}" creada con éxito!`);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la variante.');
    }
  };

  // Save everything and close
  const handleSaveAllAndClose = async () => {
    await handleSaveParent();
    const changedRows = editableVariants.filter((v) => v.hasChanged);
    if (changedRows.length > 0) {
      await handleSaveVariants();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-5xl! h-[calc(100vh-2rem)] max-h-[850px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl bg-card border border-border">
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 pr-14 py-4 border-b border-border bg-muted/25 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Editar Producto Compuesto
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {editableVariants.length} variantes
              </Badge>
            </div>
            <DialogDescription className="text-xs text-neutral mt-0.5">
              Modifica la ficha general o actualiza individualmente los precios y códigos de cada variante sin desarmar el producto.
            </DialogDescription>
          </div>
        </DialogHeader>

        {isLoadingProduct ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-neutral">Cargando producto y variantes...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Bar */}
            <div className="px-6 pt-3 border-b border-border bg-card">
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'info' | 'variants')}>
                <TabsList className="bg-muted/40 p-1 mb-2 border border-border/40">
                  <TabsTrigger value="info" className="gap-2 text-xs font-semibold data-[state=active]:shadow-xs">
                    <Package className="w-4 h-4 text-primary" />
                    1. Ficha General del Padre
                  </TabsTrigger>
                  <TabsTrigger value="variants" className="gap-2 text-xs font-semibold data-[state=active]:shadow-xs">
                    <Layers className="w-4 h-4 text-primary" />
                    2. Variantes y Precios ({editableVariants.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Tab Contents Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'info' && (
                <div className="space-y-5">
                  <Card className="border-border shadow-xs bg-card">
                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/15">
                      <CardTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-primary" />
                        Datos del Producto Padre
                      </CardTitle>
                      <CardDescription className="text-xs text-neutral">
                        Los cambios aquí se aplicarán a la ficha principal del producto y su categorización global.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Nombre */}
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <Field className="md:col-span-1">
                              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                                Nombre del Producto <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Input {...field} placeholder="Ej. Playera Oversize" className="text-xs h-9 bg-background" />
                            </Field>
                          )}
                        />

                        {/* SKU Base */}
                        <Controller
                          name="baseSku"
                          control={control}
                          render={({ field }) => (
                            <Field>
                              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                                SKU Base / Modelo
                              </FieldLabel>
                              <Input
                                {...field}
                                placeholder="Ej. KHKASER3"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                                className="text-xs h-9 bg-background font-mono font-bold"
                              />
                            </Field>
                          )}
                        />

                        {/* Categoría */}
                        <Controller
                          name="categoryId"
                          control={control}
                          render={({ field }) => (
                            <Field>
                              <div className="flex items-center justify-between">
                                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                                  Categoría
                                </FieldLabel>
                                <button
                                  type="button"
                                  onClick={() => setIsCreatingCategoryInline(!isCreatingCategoryInline)}
                                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                                >
                                  {isCreatingCategoryInline ? 'Cancelar' : '+ Nueva'}
                                </button>
                              </div>

                              {isCreatingCategoryInline ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Nombre de categoría..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="text-xs h-9 bg-background"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleCreateCategory(field.onChange)}
                                    disabled={isCreatingCategory || !newCategoryName.trim()}
                                    className="h-9 text-xs font-bold"
                                  >
                                    {isCreatingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Crear'}
                                  </Button>
                                </div>
                              ) : (
                                <select
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                  <option value="">Sin categoría asignada</option>
                                  {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </Field>
                          )}
                        />
                      </div>

                      {/* Descripción */}
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                              Descripción
                            </FieldLabel>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Detalles del producto..."
                              className="text-xs bg-background"
                            />
                          </Field>
                        )}
                      />

                      {/* Imágenes */}
                      <div className="space-y-2 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                              Fotografías Principales
                            </FieldLabel>
                            <p className="text-[11px] text-neutral">
                              Fotografías compartidas asociadas a la ficha padre del producto.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsGalleryModalOpen(true)}
                              className="text-xs h-8 cursor-pointer font-semibold"
                            >
                              <ImageIcon className="w-3.5 h-3.5 mr-1 text-primary" />
                              Galería
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsUploadModalOpen(true)}
                              className="text-xs h-8 cursor-pointer font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Subir
                            </Button>
                          </div>
                        </div>

                        {selectedImages.length > 0 ? (
                          <div className="flex flex-wrap gap-2.5 pt-2">
                            {selectedImages.map((img) => (
                              <div
                                key={img.id}
                                className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group shadow-2xs"
                              >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setSelectedImages((prev) => prev.filter((i) => i.id !== img.id))}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-5 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                            <p className="text-[11px] text-neutral italic">Sin fotografías adjuntas al producto.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'variants' && (
                <div className="space-y-5">
                  {/* Asignación Masiva Rápida */}
                  <Card className="border-border shadow-xs bg-card overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/15">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs flex items-center gap-1.5 text-secondary font-bold">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Asignación Masiva Rápida a Variantes
                        </CardTitle>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={handleApplyBulk}
                          className="text-xs h-8 cursor-pointer font-bold shadow-xs gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Aplicar a Todas
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider">
                            P. Compra
                          </FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={bulkPurchasePrice}
                            onChange={(e) => setBulkPurchasePrice(e.target.value)}
                            className="text-xs h-9 bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider">
                            P. Venta
                          </FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={bulkSalePrice}
                            onChange={(e) => setBulkSalePrice(e.target.value)}
                            className="text-xs h-9 bg-background font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider">
                            P. Mayoreo (Opc.)
                          </FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={bulkWholesalePrice}
                            onChange={(e) => setBulkWholesalePrice(e.target.value)}
                            className="text-xs h-9 bg-background"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabla de Variantes */}
                  <Card className="border-border shadow-xs overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/60 bg-muted/15">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xs font-bold text-secondary uppercase tracking-wider">
                              Lista de Variantes Activas
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold bg-background">
                              {editableVariants.length} variantes
                            </Badge>
                          </div>
                          <CardDescription className="text-xs text-neutral mt-0.5">
                            Revisa y ajusta individualmente el SKU, código de barras y precios de cada variante.
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleOpenAddVariant}
                          className="text-xs h-8 cursor-pointer font-bold gap-1.5 self-start sm:self-center shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Nueva Variante
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[460px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="border-b border-border bg-muted/90 backdrop-blur-xs text-neutral font-semibold text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-3 font-bold text-center w-14">Foto</th>
                            <th className="py-2.5 px-3.5 font-bold">Combinación</th>
                            <th className="py-2.5 px-3 font-bold">SKU</th>
                            <th className="py-2.5 px-3 font-bold">Código Barras</th>
                            <th className="py-2.5 px-3 font-bold">P. Compra</th>
                            <th className="py-2.5 px-3 font-bold text-primary">P. Venta</th>
                            <th className="py-2.5 px-3 font-bold">P. Mayoreo</th>
                            <th className="py-2.5 px-3 text-center font-bold">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {editableVariants.map((row) => {
                            const firstImg = row.images && row.images.length > 0 ? row.images[0] : null;

                            return (
                            <tr
                              key={row.id}
                              className={`hover:bg-muted/20 transition-colors ${
                                row.hasChanged ? 'bg-primary/5' : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVariantForImage(row.id);
                                    setIsGalleryModalOpen(true);
                                  }}
                                  className={`w-9 h-9 rounded-lg border flex items-center justify-center overflow-hidden transition-all cursor-pointer group ${
                                    firstImg
                                      ? 'border-primary/50 bg-background hover:ring-2 hover:ring-primary/40'
                                      : 'border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary'
                                  }`}
                                  title={firstImg ? 'Cambiar foto de la variante' : 'Asignar foto a esta variante'}
                                >
                                  {firstImg ? (
                                    <img src={firstImg.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
                                  )}
                                </button>
                              </td>
                              <td className="py-2.5 px-3.5">
                                <Badge variant="secondary" className="text-[11px] font-semibold bg-background border border-border/80 px-2 py-0.5 shadow-2xs">
                                  {row.combinationText}
                                </Badge>
                                {row.hasChanged && (
                                  <span className="ml-1.5 text-[10px] text-primary font-bold italic">
                                    (Modificado)
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {(() => {
                                  const effectivePrefix = (baseSkuValue && baseSkuValue.trim()) || (product?.baseSku && product.baseSku.trim()) || '';
                                  const currentSku = row.sku || '';
                                  const prefixWithDash = effectivePrefix ? `${effectivePrefix}-` : '';
                                  
                                  // Determinar sufijo: si tiene el prefijo actual se quita; si tiene el prefijo anterior del producto también se quita
                                  let suffix = currentSku;
                                  if (prefixWithDash && currentSku.startsWith(prefixWithDash)) {
                                    suffix = currentSku.slice(prefixWithDash.length);
                                  } else if (product?.baseSku && currentSku.startsWith(`${product.baseSku}-`)) {
                                    suffix = currentSku.slice(`${product.baseSku}-`.length);
                                  } else if (currentSku.includes('-')) {
                                    // Fallback: si tiene un guion, tomar la parte posterior al primer guion
                                    suffix = currentSku.split('-').slice(1).join('-');
                                  }

                                  if (effectivePrefix) {
                                    return (
                                      <div className="flex items-center gap-0 border border-border/80 rounded-md overflow-hidden bg-background w-36 focus-within:ring-1 focus-within:ring-primary shadow-2xs">
                                        <span className="bg-muted/70 px-2 py-1 text-[11px] font-mono font-bold text-primary select-none shrink-0 border-r border-border/60">
                                          {effectivePrefix}-
                                        </span>
                                        <input
                                          type="text"
                                          value={suffix}
                                          onChange={(e) => {
                                            const cleanSuffix = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                                            handleUpdateVariantField(row.id, 'sku', `${effectivePrefix}-${cleanSuffix}`);
                                          }}
                                          className="w-full text-xs font-mono font-bold px-1.5 py-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                                          placeholder="1"
                                        />
                                      </div>
                                    );
                                  }

                                  return (
                                    <Input
                                      value={row.sku}
                                      onChange={(e) => handleUpdateVariantField(row.id, 'sku', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                                      className="text-xs font-mono font-bold h-8 w-32 bg-background/80"
                                    />
                                  );
                                })()}
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  value={row.barcode}
                                  onChange={(e) => handleUpdateVariantField(row.id, 'barcode', e.target.value)}
                                  placeholder="Opcional"
                                  className="text-xs font-mono h-8 w-32 bg-background/80"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={row.purchasePrice ?? ''}
                                  onChange={(e) =>
                                    handleUpdateVariantField(row.id, 'purchasePrice', e.target.value)
                                  }
                                  className="text-xs font-mono h-8 w-24 bg-background/80"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={row.salePrice ?? ''}
                                  onChange={(e) =>
                                    handleUpdateVariantField(row.id, 'salePrice', e.target.value)
                                  }
                                  className="text-xs font-mono font-bold text-primary h-8 w-24 bg-background border-primary/40 focus:border-primary"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={row.wholesalePrice ?? ''}
                                  placeholder="N/A"
                                  onChange={(e) =>
                                    handleUpdateVariantField(
                                      row.id,
                                      'wholesalePrice',
                                      e.target.value === '' ? null : e.target.value
                                    )
                                  }
                                  className="text-xs font-mono h-8 w-24 bg-background/80"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariant(row.id, row.sku)}
                                  disabled={isDeletingVariant}
                                  className="p-1.5 rounded-lg text-neutral hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Eliminar esta variante"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={onClose} className="text-xs cursor-pointer">
                Cancelar
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleSaveAllAndClose}
                  disabled={isUpdatingParent || isUpdatingVariant}
                  className="h-9 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-primary/20 cursor-pointer"
                >
                  {(isUpdatingParent || isUpdatingVariant) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Todos los Cambios
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Multimedia Modals */}
        <MediaGallerySelectorModal
          open={isGalleryModalOpen}
          onOpenChange={(open) => {
            setIsGalleryModalOpen(open);
            if (!open) setActiveVariantForImage(null);
          }}
          selectedImages={
            activeVariantForImage
              ? editableVariants.find((v) => v.id === activeVariantForImage)?.images || []
              : selectedImages
          }
          onToggleImage={(image) => {
            if (activeVariantForImage) {
              setEditableVariants((prev) =>
                prev.map((v) => {
                  if (v.id !== activeVariantForImage) return v;
                  const existing = v.images || [];
                  const isSelected = existing.some((img) => img.id === image.id);
                  const updated = isSelected
                    ? existing.filter((img) => img.id !== image.id)
                    : [...existing, image];
                  return {
                    ...v,
                    images: updated,
                    imageIds: updated.map((i) => i.id),
                    hasChanged: true,
                  };
                })
              );
            } else {
              setSelectedImages((prev) =>
                prev.some((img) => img.id === image.id)
                  ? prev.filter((img) => img.id !== image.id)
                  : [...prev, image]
              );
            }
          }}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />

        <ImageUploadModal
          open={isUploadModalOpen}
          onOpenChange={setIsUploadModalOpen}
          onImageSaved={(imgObj) => {
            const imageItem =
              typeof imgObj === 'string'
                ? { id: imgObj, url: '' }
                : imgObj;

            if (activeVariantForImage) {
              setEditableVariants((prev) =>
                prev.map((v) => {
                  if (v.id !== activeVariantForImage) return v;
                  const updated = [...(v.images || []), imageItem];
                  return {
                    ...v,
                    images: updated,
                    imageIds: updated.map((i) => i.id),
                    hasChanged: true,
                  };
                })
              );
            } else {
              setSelectedImages((prev) => [...prev, imageItem]);
            }
          }}
        />
        {/* Modal para Crear Nueva Variante */}
        <Dialog open={isAddVariantOpen} onOpenChange={setIsAddVariantOpen}>
          <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
            <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20">
              <DialogTitle className="text-sm sm:text-base font-bold text-secondary flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                Agregar Nueva Variante al Producto
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral mt-0.5">
                Selecciona la combinación de atributos y define el SKU y precios de la nueva variante.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Selección de Atributos */}
              <div className="space-y-3 p-4 rounded-xl border border-primary/25 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Combinación de Atributos <span className="text-destructive">*</span>
                  </span>
                  <span className="text-[10px] text-neutral">
                    {productAttributes.length} atributo(s) asignado(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {productAttributes.map((attr:Attribute) => (
                    <div key={attr.id} className="space-y-1">
                      <FieldLabel className="text-[11px] text-secondary font-bold">
                        {attr.name}
                      </FieldLabel>
                      <select
                        value={newVariantSelectedValues[attr.id] || ''}
                        onChange={(e) =>
                          setNewVariantSelectedValues((prev) => ({
                            ...prev,
                            [attr.id]: e.target.value,
                          }))
                        }
                        className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      >
                        <option value="">Seleccionar {attr.name}...</option>
                        {(attr.values || []).map((val) => (
                          <option key={val.id} value={val.id}>
                            {val.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* SKU & Código de Barras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    SKU de la Variante <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    value={newVariantSku}
                    onChange={(e) =>
                      setNewVariantSku(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
                    }
                    placeholder="Ej. CAM-AZU-XL"
                    className="text-xs h-8.5 font-mono font-bold bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Código de Barras (Opcional)
                  </FieldLabel>
                  <Input
                    value={newVariantBarcode}
                    onChange={(e) => setNewVariantBarcode(e.target.value)}
                    placeholder="Opcional"
                    className="text-xs h-8.5 font-mono bg-background"
                  />
                </div>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    P. Compra
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVariantPurchasePrice}
                    onChange={(e) => setNewVariantPurchasePrice(e.target.value)}
                    className="text-xs h-8.5 font-mono bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    P. Venta <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVariantSalePrice}
                    onChange={(e) => setNewVariantSalePrice(e.target.value)}
                    className="text-xs h-8.5 font-mono font-bold text-primary bg-background border-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    P. Mayoreo
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="N/A"
                    value={newVariantWholesalePrice}
                    onChange={(e) => setNewVariantWholesalePrice(e.target.value)}
                    className="text-xs h-8.5 font-mono bg-background"
                  />
                </div>
              </div>

              {/* Stock inicial en sucursal */}
              {selectedBranchId && (
                <div className="space-y-1 pt-1 border-t border-border/50">
                  <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Stock Inicial en Sucursal Seleccionada
                  </FieldLabel>
                  <Input
                    type="number"
                    step="1"
                    value={newVariantInitialStock}
                    onChange={(e) => setNewVariantInitialStock(e.target.value)}
                    className="text-xs h-8.5 font-mono w-32 bg-background"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddVariantOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitNewVariant}
                disabled={isCreatingNewVariant}
                className="text-xs font-bold gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
              >
                {isCreatingNewVariant ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Crear Variante
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

