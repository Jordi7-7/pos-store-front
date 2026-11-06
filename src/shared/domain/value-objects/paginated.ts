/** Una página de resultados y su posición dentro del total. */
export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
