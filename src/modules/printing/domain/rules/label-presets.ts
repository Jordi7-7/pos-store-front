import type { LabelPreset } from '../entities/label';

/** Medidas de etiqueta adhesiva más usadas en comercio (ancho × alto en mm). Cualquier otra se escribe a mano. */
export const LABEL_PRESETS: LabelPreset[] = [
  { id: '50x25', name: '50 × 25 mm', widthMm: 50, heightMm: 25, gapMm: 2, category: 'Producto', description: 'Ropa, calzado, farmacia y perfumería. Cabe el código, el nombre y el precio.' },
  { id: '50x30', name: '50 × 30 mm', widthMm: 50, heightMm: 30, gapMm: 2, category: 'Producto', description: 'La más usada en tiendas de ropa y accesorios.' },
  { id: '40x30', name: '40 × 30 mm', widthMm: 40, heightMm: 30, gapMm: 2, category: 'Producto', description: 'Accesorios, bisutería y papelería.' },
  { id: '40x20', name: '40 × 20 mm', widthMm: 40, heightMm: 20, gapMm: 2, category: 'Pequeña', description: 'Joyería y productos pequeños.' },
  { id: '38x25', name: '38 × 25 mm', widthMm: 38, heightMm: 25, gapMm: 2, category: 'Pequeña', description: 'Código compacto para productos chicos.' },
  { id: '30x20', name: '30 × 20 mm', widthMm: 30, heightMm: 20, gapMm: 2, category: 'Pequeña', description: 'Muy pequeña: solo código y precio.' },
  { id: '60x40', name: '60 × 40 mm', widthMm: 60, heightMm: 40, gapMm: 2, category: 'Grande', description: 'Cajas medianas, calzado y repuestos.' },
  { id: '80x50', name: '80 × 50 mm', widthMm: 80, heightMm: 50, gapMm: 3, category: 'Grande', description: 'Bultos y cajas de almacén.' },
  { id: '100x50', name: '100 × 50 mm', widthMm: 100, heightMm: 50, gapMm: 3, category: 'Grande', description: 'Etiqueta ancha para distribución.' },
  { id: '100x150', name: '100 × 150 mm', widthMm: 100, heightMm: 150, gapMm: 3, category: 'Envíos', description: 'Guías de paquetería (4" × 6").' },
];
