import React from 'react';

const SHORTCUTS = [
  { key: 'F5', label: 'Buscar producto' },
  { key: 'F7', label: 'Monto recibido' },
  { key: 'F8', label: 'Cobro exacto' },
  { key: 'F12', label: 'Completar venta' },
];

/** Leyenda de los atajos del POS, siempre a la vista para que el cajero los descubra y los use. */
export const KeyboardHints: React.FC = () => (
  <ul aria-label="Atajos de teclado" className="hidden md:flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-neutral">
    {SHORTCUTS.map(({ key, label }) => (
      <li key={key} className="flex items-center gap-1.5">
        <kbd className="rounded border border-border-card bg-bg-dark px-1.5 py-0.5 font-mono text-xs font-semibold text-secondary">{key}</kbd>
        <span>{label}</span>
      </li>
    ))}
  </ul>
);
