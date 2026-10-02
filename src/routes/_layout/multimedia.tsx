import { createFileRoute } from '@tanstack/react-router';
import { MediaView } from '@/modules/media/components/MediaView';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/multimedia')({
  component: MediaRoute,
});

function MediaRoute() {
  const {
    uploadedImages,
    isUploading,
    isDeleting,
    isLoadingMedia,
    uploadImage,
    uploadImageByUrl,
    deleteImage,
  } = useLayoutContext();

  return (
    <MediaView
      uploadedImages={uploadedImages}
      isUploading={isUploading}
      isDeleting={isDeleting}
      isLoading={isLoadingMedia}
      onUpload={(file, desc) => uploadImage({ file, description: desc })}
      onUploadByUrl={(url, desc) => uploadImageByUrl({ url, description: desc })}
      onDelete={deleteImage}
    />
  );
}
