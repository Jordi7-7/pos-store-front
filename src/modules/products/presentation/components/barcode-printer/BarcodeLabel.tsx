import React, { useMemo } from 'react';
import type { LabelSpec } from '@/modules/printing/domain/rules/label-layout';
import type { LabelSheet, LabelStyle } from '@/modules/printing/domain/rules/label-sheets';
import { renderSheetCanvas } from '@/modules/printing/infrastructure/labels/label-canvas';
import { useTicketFormat } from '@/modules/printing/presentation/hooks/useTicketFormat';

interface BarcodeLabelProps {
  sheet: LabelSheet;
  storeName: string;
  spec: LabelSpec;
  style: LabelStyle;
}

/** La etiqueta tal como saldrá: la misma imagen que recibe la impresora (o el controlador del sistema). */
export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({ sheet, storeName, spec, style }) => {
  const format = useTicketFormat();
  const dataUrl = useMemo(() => renderSheetCanvas({ sheet, storeName, format, spec, style }).toDataURL('image/png'), [sheet, storeName, format, spec, style]);
  return (
    <img
      src={dataUrl}
      alt={`Etiqueta de ${sheet.items.map((item) => item.sku).join(' y ')}`}
      className="block h-auto max-w-full rounded-sm border border-neutral-300 bg-white shadow-sm"
      style={{ width: `${Math.min(420, spec.widthMm * 7)}px`, aspectRatio: `${spec.widthMm} / ${spec.heightMm}` }}
    />
  );
};
