import React, { useRef, useState } from 'react';
import { Images, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import { BULK_IMAGE_TYPES, MAX_BULK_IMAGE_MB, MAX_BULK_IMAGES } from '../../../domain/rules/bulk-images';
import { useBulkImageUpload } from '../../hooks/useBulkImageUpload';
import { BulkImageRowItem } from './BulkImageRowItem';

/** «Subir fotos por lote»: muchas fotos a la vez, asignadas a productos y variantes por el nombre del archivo. */
export const BulkImageUploadButton: React.FC = () => {
  const { can } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const batch = useBulkImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  if (!can(APP_PERMISSIONS.MEDIA_UPLOAD) || !can(APP_PERMISSIONS.PRODUCTS_EDIT)) return null;

  const busy = batch.isUploading || batch.isMatching;
  const withoutTarget = batch.rows.filter((row) => !row.target).length;
  const close = () => {
    batch.reset();
    setIsOpen(false);
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => setIsOpen(true)}>
        <Images />
        Subir fotos por lote
      </Button>

      {/* Mientras sube no se cierra sin querer: primero se detiene */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && !batch.isUploading && close()}>
        <DialogContent className="flex h-[88vh] w-[calc(100vw-2rem)] max-w-3xl! flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-3xl!">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle className="text-base font-semibold">Subir fotos por lote</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cada foto se asigna por el nombre del archivo: el SKU (<span className="font-mono">MOCH-KTM-01.jpg</span>), el nombre del producto o el nombre con su variante (<span className="font-mono">Mochila KTM 01.jpg</span>). Con <span className="font-mono">_2</span> al final es otra foto de lo mismo. Las fotos que ya tenga se conservan.
            </DialogDescription>
          </DialogHeader>

          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) void batch.addFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 disabled:cursor-default disabled:opacity-50">
              {batch.isMatching ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
              <span className="font-semibold text-foreground">{batch.isMatching ? 'Buscando los productos…' : 'Elige las fotos o arrástralas aquí'}</span>
              <span className="text-xs">JPG, PNG o WebP · hasta {MAX_BULK_IMAGE_MB} MB cada una · {MAX_BULK_IMAGES} por tanda</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={BULK_IMAGE_TYPES.join(',')}
              className="hidden"
              aria-label="Elegir fotos"
              onChange={(e) => {
                void batch.addFiles(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />

            {batch.rejected.length > 0 && (
              <div role="alert" className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700">
                <p className="font-semibold">No se agregaron {batch.rejected.length}:</p>
                <ul className="mt-1 max-h-24 overflow-y-auto">
                  {batch.rejected.map((item, index) => (
                    <li key={`${item.name}-${index}`}><span className="font-mono">{item.name}</span>: {item.reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="space-y-2">
              {/* Primero las que necesitan que se elija destino */}
              {[...batch.rows].sort((a, b) => Number(Boolean(a.target)) - Number(Boolean(b.target))).map((row) => (
                <BulkImageRowItem key={row.key} row={row} disabled={batch.isUploading} onChoose={(target) => batch.chooseTarget(row.key, target)} onRemove={() => batch.remove(row.key)} />
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-3">
            <p className="text-xs text-muted-foreground">
              {batch.rows.length} {batch.rows.length === 1 ? 'foto' : 'fotos'}
              {batch.assignedCount > 0 && ` · ${batch.assignedCount} asignadas`}
              {withoutTarget > 0 && ` · ${withoutTarget} sin producto (no se subirán)`}
            </p>
            <div className="flex gap-2">
              {batch.isUploading ? (
                <Button type="button" variant="ghost" size="sm" onClick={batch.stop}>Detener</Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={close}>Cerrar</Button>
              )}
              <Button type="button" size="sm" disabled={busy || batch.pendingCount === 0} onClick={() => void batch.start()}>
                {batch.isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
                {batch.isUploading ? 'Subiendo…' : `Subir y asignar ${batch.pendingCount}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
