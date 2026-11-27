import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Search, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ImageTarget } from '../../../domain/entities/image-files.entity';
import { targetKey, targetLabel } from '../../../domain/rules/bulk-images';
import type { BulkImageRow } from '../../hooks/useBulkImageUpload';
import { useImageTargetSearch } from '../../hooks/useImageTargetSearch';

const TargetSearch: React.FC<{ onChoose: (target: ImageTarget) => void }> = ({ onChoose }) => {
  const { term, setTerm, targets, isSearching, hasSearched } = useImageTargetSearch();
  return (
    <div className="mt-2 space-y-1.5">
      <Input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nombre o SKU del producto…" aria-label="Buscar producto para la foto" />
      {hasSearched && (
        <ul className="max-h-40 overflow-y-auto rounded-lg border border-border">
          {targets.map((target) => (
            <li key={targetKey(target)}>
              <button type="button" onClick={() => onChoose(target)} className="w-full cursor-pointer px-3 py-1.5 text-left text-xs hover:bg-muted">{targetLabel(target)}</button>
            </li>
          ))}
          {targets.length === 0 && <li className="px-3 py-1.5 text-xs text-muted-foreground">{isSearching ? 'Buscando…' : 'Sin resultados.'}</li>}
        </ul>
      )}
    </div>
  );
};

const Status: React.FC<{ row: BulkImageRow }> = ({ row }) => {
  if (row.upload === 'assigned') return <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="size-3.5" />Asignada</span>;
  if (row.upload === 'uploading' || row.upload === 'uploaded') return <span className="flex items-center gap-1 text-xs font-semibold text-primary"><Loader2 className="size-3.5 animate-spin" />Subiendo…</span>;
  if (row.upload === 'failed') return <span className="flex items-center gap-1 text-xs font-semibold text-rose-600"><XCircle className="size-3.5" />{row.error}</span>;
  if (row.target) return <span className="text-xs font-semibold text-emerald-700">Lista</span>;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
      <AlertTriangle className="size-3.5" />
      {row.match === 'AMBIGUOUS' ? 'Hay varias coincidencias: elige una' : 'Sin coincidencia'}
    </span>
  );
};

interface BulkImageRowItemProps {
  row: BulkImageRow;
  disabled: boolean;
  onChoose: (target: ImageTarget | null) => void;
  onRemove: () => void;
}

/** Una foto de la tanda: miniatura, archivo, a qué producto va y cómo va su subida. */
export const BulkImageRowItem: React.FC<BulkImageRowItemProps> = ({ row, disabled, onChoose, onRemove }) => {
  const [isSearching, setIsSearching] = useState(false);
  const locked = disabled || row.upload === 'assigned';
  const choose = (target: ImageTarget | null) => {
    setIsSearching(false);
    onChoose(target);
  };

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border p-3">
      <img src={row.previewUrl} alt="" loading="lazy" decoding="async" className="size-14 shrink-0 rounded-lg border border-border object-cover" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-mono text-xs font-semibold text-foreground" title={row.file.name}>{row.file.name}</p>
        {row.target && <p className="truncate text-sm text-foreground" title={targetLabel(row.target)}>{targetLabel(row.target)}</p>}
        {!row.target && row.candidates.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {row.candidates.map((candidate) => (
              <Button key={targetKey(candidate)} type="button" variant="outline" size="sm" disabled={locked} onClick={() => choose(candidate)}>{targetLabel(candidate)}</Button>
            ))}
          </div>
        )}
        <Status row={row} />
        {isSearching && !locked && <TargetSearch onChoose={choose} />}
      </div>
      {!locked && (
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsSearching((open) => !open)}>
            <Search />
            {row.target ? 'Cambiar' : 'Buscar'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Quitar ${row.file.name}`}>
            <Trash2 />
          </Button>
        </div>
      )}
    </li>
  );
};
