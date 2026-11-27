import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { FileMatch, ImageTarget } from '../../domain/entities/image-files.entity';
import { screenImageFiles } from '../../domain/rules/bulk-images';
import type { ImageProgress } from '../../application/use-cases/upload-product-images';
import { productsRepository, uploadProductImages } from '../../infrastructure/dependencies';

export interface BulkImageRow {
  key: string;
  file: File;
  previewUrl: string;
  match: FileMatch['status'];
  candidates: ImageTarget[];
  /** Destino elegido; sin destino la foto no se sube. */
  target: ImageTarget | null;
  upload: 'pending' | 'uploading' | 'uploaded' | 'assigned' | 'failed';
  imageId?: string;
  error?: string;
}

const applyProgress = (row: BulkImageRow, progress: ImageProgress): BulkImageRow => {
  if (progress.state === 'uploaded') return { ...row, upload: 'uploaded', imageId: progress.imageId };
  if (progress.state === 'failed') return { ...row, upload: 'failed', error: getErrorMessage(progress.error, 'No se pudo subir. Revisa tu conexión y reintenta.') };
  return { ...row, upload: progress.state, error: undefined };
};

/** La tanda de fotos: elegirlas, emparejarlas por nombre, corregir destinos y subirlas. */
export function useBulkImageUpload() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<BulkImageRow[]>([]);
  const [rejected, setRejected] = useState<Array<{ name: string; reason: string }>>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const update = (key: string, change: (row: BulkImageRow) => BulkImageRow) => setRows((current) => current.map((row) => (row.key === key ? change(row) : row)));

  const addFiles = async (files: File[]) => {
    const screening = screenImageFiles(files, rows.map((row) => row.file));
    setRejected(screening.rejected);
    if (screening.accepted.length === 0) return;
    setIsMatching(true);
    try {
      const matches = await productsRepository.matchImageFiles(screening.accepted.map((file) => file.name));
      const added = screening.accepted.map((file, index): BulkImageRow => {
        const match = matches[index];
        const status = match?.status ?? 'NOT_FOUND';
        const candidates = match?.candidates ?? [];
        return { key: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), match: status, candidates, target: status === 'MATCHED' ? (candidates[0] ?? null) : null, upload: 'pending' };
      });
      setRows((current) => [...current, ...added]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudieron buscar los productos de esas fotos.'));
    } finally {
      setIsMatching(false);
    }
  };

  const chooseTarget = (key: string, target: ImageTarget | null) => update(key, (row) => ({ ...row, target }));

  const remove = (key: string) =>
    setRows((current) => {
      const row = current.find((item) => item.key === key);
      if (row) URL.revokeObjectURL(row.previewUrl);
      return current.filter((item) => item.key !== key);
    });

  const reset = () => {
    for (const row of rows) URL.revokeObjectURL(row.previewUrl);
    setRows([]);
    setRejected([]);
  };

  /** Lo que se subiría ahora: con destino y todavía sin asignar (incluye las que fallaron). */
  const pending = rows.flatMap((row) => (row.target && row.upload !== 'assigned' ? [{ key: row.key, file: row.file, target: row.target, imageId: row.imageId }] : []));

  const start = async () => {
    const abort = new AbortController();
    abortRef.current = abort;
    setIsUploading(true);
    try {
      const { assigned, failed } = await uploadProductImages.execute(pending, { signal: abort.signal, onProgress: (key, progress) => update(key, (row) => applyProgress(row, progress)) });
      if (assigned > 0) toast.success(`${assigned} ${assigned === 1 ? 'foto asignada' : 'fotos asignadas'}.`);
      if (failed > 0) toast.error(`${failed} ${failed === 1 ? 'foto no se pudo subir' : 'fotos no se pudieron subir'}. Puedes reintentar.`);
      for (const key of ['products', 'product-detail', 'media-images']) void queryClient.invalidateQueries({ queryKey: [key] });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    rows,
    rejected,
    isMatching,
    isUploading,
    pendingCount: pending.length,
    assignedCount: rows.filter((row) => row.upload === 'assigned').length,
    addFiles,
    chooseTarget,
    remove,
    reset,
    start,
    stop: () => abortRef.current?.abort(),
  };
}
