import React from 'react';
import { AlertTriangle, Layers } from 'lucide-react';
import { MAX_VARIANTS, WARN_VARIANTS, type AttributeChoice } from '../../../domain/rules/variable-wizard';

/** Cuántas variantes saldrían con las opciones marcadas: la cuenta (3 tallas × 2 colores = 6) o el aviso de que son demasiadas. */
export const CombinationsFormula: React.FC<{ choices: readonly AttributeChoice[]; total: number }> = ({ choices, total }) => (
  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3 text-xs font-medium text-secondary">
    <span className="flex items-center gap-1 text-xs font-bold text-neutral">
      <Layers className="h-3.5 w-3.5 text-primary" />
      Cálculo:
    </span>
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
      {choices.map((choice, index) => (
        <React.Fragment key={choice.attributeId}>
          {index > 0 && <span className="font-bold text-neutral/50">&times;</span>}
          <span className="rounded-md border border-border bg-background px-2 py-0.5">
            {choice.values.length} {choice.attributeName.toLowerCase()}
          </span>
        </React.Fragment>
      ))}
      <span className="font-bold text-neutral/50">=</span>
      <span className="rounded-md bg-primary px-2 py-0.5 font-bold text-primary-foreground shadow-xs">{total} variantes en total</span>
    </div>
  </div>
);

/** Aviso cuando la tabla sería muy larga (amarillo) o no cabe en un producto (rojo); nada si el número es razonable. */
export const TooManyVariantsNotice: React.FC<{ total: number }> = ({ total }) => {
  if (total <= WARN_VARIANTS) return null;
  const overLimit = total > MAX_VARIANTS;
  return (
    <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${overLimit ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {overLimit
          ? `Con estas opciones saldrían ${total} variantes y el máximo por producto es ${MAX_VARIANTS}. Quita algunas opciones.`
          : `Saldrían ${total} variantes: la tabla será larga. Si no vendes todas las combinaciones, quita opciones o separa el producto en dos.`}
      </span>
    </div>
  );
};
