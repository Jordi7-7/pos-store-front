import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Acciones de la pantalla (botones de arriba a la derecha): exportar, importar, actualizar… */
  actions?: React.ReactNode;
}

/** Cabecera común de todas las pantallas: título, descripción y acciones, con el mismo tamaño y espaciado. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-xl font-semibold tracking-tight text-secondary">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
