import React, { useMemo } from 'react';
import type { LabelItem } from '@/modules/printing/domain/entities/label';
import type { LabelSpec } from '@/modules/printing/domain/rules/label-layout';
import { renderLabelCanvas } from '@/modules/printing/infrastructure/labels/label-canvas';
import { useTicketFormat } from '@/modules/printing/presentation/hooks/useTicketFormat';

interface BarcodeLabelProps {
  item: LabelItem;
  storeName: string;
  spec: LabelSpec;
  showStore: boolean;
}

/** La etiqueta tal como saldrá: la misma imagen que recibe la impresora (o el controlador del sistema). */
export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ item, storeName, spec, showStore }) => {
  const format = useTicketFormat();
  const dataUrl = useMemo(() => renderLabelCanvas({ item, storeName, format, spec, showStore }).toDataURL('image/png'), [item, storeName, format, spec, showStore]);
  return (
    <img
      src={dataUrl}
      alt={`Etiqueta de ${item.sku}`}
      className="block h-auto max-w-full rounded-sm border border-neutral-300 bg-white shadow-sm"
      style={{ width: `${Math.min(420, spec.widthMm * 7)}px`, aspectRatio: `${spec.widthMm} / ${spec.heightMm}` }}
    />
  );
};
