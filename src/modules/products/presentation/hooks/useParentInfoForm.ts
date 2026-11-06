import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ProductVM } from '../view-models/product.vm';

/** Valores del formulario de la ficha del producto padre. */
export interface ParentFormValues {
  name: string;
  baseSku: string;
  description: string;
  categoryId: string;
}

export interface ImageItem {
  id: string;
  url: string;
  description?: string;
}

/**
 * Formulario de la ficha del padre (nombre, SKU base, categoría, descripción) y sus fotos. Se carga
 * al abrir el editor o al cambiar de producto, NO cuando el mismo producto se recarga (p. ej. tras
 * crear una variante), para no perder lo que el usuario ya escribió.
 */
export function useParentInfoForm(product: ProductVM | null, isOpen: boolean) {
  const form = useForm<ParentFormValues>({ defaultValues: { name: '', baseSku: '', description: '', categoryId: '' } });
  const [images, setImages] = useState<ImageItem[]>([]);
  const loadedProductId = useRef<string | null>(null);
  const { reset } = form;

  useEffect(() => {
    if (!isOpen) {
      loadedProductId.current = null;
      return;
    }
    if (!product || loadedProductId.current === product.id) return;
    loadedProductId.current = product.id;
    reset({ name: product.name || '', baseSku: product.baseSku || '', description: product.description || '', categoryId: product.categoryId || '' });
    setImages(product.images.map((image) => ({ id: image.id, url: image.url || '', description: image.description })));
  }, [product, isOpen, reset]);

  return {
    control: form.control,
    getValues: form.getValues,
    /** SKU base escrito ahora en el formulario. */
    currentBaseSku: form.watch('baseSku'),
    images,
    setImages,
  };
}
