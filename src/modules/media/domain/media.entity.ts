/** Imagen registrada en la galería de la tienda. */
export interface RegisteredImage {
  id: string;
  url: string;
  tenantId: string;
  description?: string;
  createdAt: string;
}

export interface PaginatedImages {
  data: RegisteredImage[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Dirección temporal para subir un archivo directamente al almacenamiento, y la URL pública que tendrá. */
export interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
}
