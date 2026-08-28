import React from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PaginationMeta = { total: number; page: number; limit: number; totalPages: number };

interface ProductPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({ meta, onPageChange, onLimitChange }) => {
  if (meta.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 mt-4 mb-5">
      <Field orientation="horizontal" className="w-fit gap-2">
        <FieldLabel htmlFor="select-rows-per-page" className="text-[11px] text-muted-foreground whitespace-nowrap">
          Filas por página
        </FieldLabel>
        <Select value={String(meta.limit)} onValueChange={(value) => onLimitChange(Number(value))}>
          <SelectTrigger className="w-20" id="select-rows-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground">Página {meta.page} de {meta.totalPages} ({meta.total})</span>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => onPageChange(Math.max(1, meta.page - 1))} disabled={meta.page === 1} />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))} disabled={meta.page === meta.totalPages} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
