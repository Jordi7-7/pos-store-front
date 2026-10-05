import { createFileRoute } from '@tanstack/react-router';
import { MediaView } from '@/modules/media/components/MediaView';
import { useMediaUpload } from '@/modules/media';
import { toast } from 'sonner';

export const Route = createFileRoute('/_layout/multimedia')({
  component: MediaRoute,
});

function MediaRoute() {
  const {
    uploadedImages,
    isUploading,
    isDeleting,
    isLoading: isLoadingMedia,
    uploadImage,
    uploadImageByUrl,
    deleteImage,
  } = useMediaUpload();

  const handleUpload = async (params: { file: File; description: string }) => {
    try {
      const res = await uploadImage(params);
      toast.success('¡Imagen subida con éxito!');
      return res;
    } catch (err: any) {
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al procesar la imagen externa.');
      throw err;
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const res = await deleteImage(id);
      toast.success('Imagen eliminada de la galería.');
      return res;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al eliminar la imagen.');
      throw err;
    }
  };

  return (
    <MediaView
      uploadedImages={uploadedImages}
      isUploading={isUploading}
      isDeleting={isDeleting}
      isLoading={isLoadingMedia}
      onUpload={async (file, desc) => { await handleUpload({ file, description: desc }); }}
      onUploadByUrl={async (url, desc) => { await handleUploadByUrl({ url, description: desc }); }}
      onDelete={handleDeleteImage}
    />
  );
}
