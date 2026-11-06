import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { MediaView } from '@/modules/media/presentation/components/MediaView';
import { useMediaUpload } from '@/modules/media';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/multimedia')({
  beforeLoad: () => guardRoute('/multimedia'),
  component: MediaRoute,
});

function MediaRoute() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    uploadedImages,
    meta,
    isUploading,
    isDeleting,
    isLoading: isLoadingMedia,
    uploadImage,
    uploadImageByUrl,
    deleteImage,
  } = useMediaUpload({
    page,
    limit,
    search: debouncedSearch,
  });

  const handleUpload = async (params: { file: File; description: string }) => {
    try {
      const res = await uploadImage(params);
      toast.success('¡Imagen subida con éxito!');
      return res;
    } catch (err) {
      console.error(err);
      toast.error('Error en la subida multimedia.');
      throw err;
    }
  };

  const handleUploadByUrl = async (params: { url: string; description: string }) => {
    try {
      const res = await uploadImageByUrl(params);
      toast.success('¡Imagen de internet descargada y registrada con éxito!');
      return res;
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Error al procesar la imagen externa.'));
      throw err;
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const res = await deleteImage(id);
      toast.success('Imagen eliminada de la galería.');
      return res;
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Error al eliminar la imagen.'));
      throw err;
    }
  };

  return (
    <>
      <PageHeader title="Galería" description="Imágenes de tu catálogo y galería multimedia." />
      <MediaView
        uploadedImages={uploadedImages}
        isUploading={isUploading}
        isDeleting={isDeleting}
        isLoading={isLoadingMedia}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        search={search}
        onSearchChange={setSearch}
        onUpload={async (file, desc) => { await handleUpload({ file, description: desc }); }}
        onUploadByUrl={async (url, desc) => { await handleUploadByUrl({ url, description: desc }); }}
        onDelete={handleDeleteImage}
      />
    </>
  );
}
