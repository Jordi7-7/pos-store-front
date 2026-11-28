/**
 * Elegir una variante por sus atributos (Base, Cierre, Copa…). Los atributos se filtran en orden: el primero ofrece
 * todas sus opciones y cada uno de los siguientes solo las que existen con lo elegido antes. Lo seleccionado es siempre
 * una variante real, así que la foto, el precio y lo que se agrega nunca son de otra combinación.
 */

export interface SelectableVariant {
  id: string;
  stock: number;
  attributeValues: ReadonlyArray<{ attributeId: string; valueId: string }>;
}

export interface SelectorAttribute {
  id: string;
  name: string;
  values: ReadonlyArray<{ id: string; value: string }>;
}

export interface OptionState {
  valueId: string;
  label: string;
  selected: boolean;
  /** Alguna de las variantes a las que lleva esta opción tiene existencia. */
  inStock: boolean;
}

export interface AttributeChoice {
  attributeId: string;
  name: string;
  options: OptionState[];
}

/** Para una variante que no usa un atributo que otras sí: así también se puede elegir. */
export const UNSPECIFIED_VALUE = '';
const UNSPECIFIED_LABEL = 'Sin especificar';

const valueOf = (variant: SelectableVariant, attributeId: string): string =>
  variant.attributeValues.find((option) => option.attributeId === attributeId)?.valueId ?? UNSPECIFIED_VALUE;

const withValue = <T extends SelectableVariant>(variants: readonly T[], attributeId: string, valueId: string): T[] =>
  variants.filter((variant) => valueOf(variant, attributeId) === valueId);

/** La primera con existencia; si ninguna tiene (se puede vender en negativo), la primera. */
export const preferredVariant = <T extends SelectableVariant>(variants: readonly T[]): T | undefined =>
  variants.find((variant) => variant.stock > 0) ?? variants[0];

/** Las opciones que se muestran en cada atributo con `selected` elegida. */
export function attributeChoices(attributes: readonly SelectorAttribute[], variants: readonly SelectableVariant[], selected: SelectableVariant): AttributeChoice[] {
  let candidates = variants;
  return attributes.map((attribute) => {
    const current = valueOf(selected, attribute.id);
    const values = [...attribute.values.map(({ id, value }) => ({ id, value })), { id: UNSPECIFIED_VALUE, value: UNSPECIFIED_LABEL }];
    const options = values.flatMap(({ id, value }) => {
      const reachable = withValue(candidates, attribute.id, id);
      return reachable.length > 0 ? [{ valueId: id, label: value, selected: id === current, inStock: reachable.some((variant) => variant.stock > 0) }] : [];
    });
    candidates = withValue(candidates, attribute.id, current);
    return { attributeId: attribute.id, name: attribute.name, options };
  });
}

/**
 * La variante que queda elegida al tocar una opción: respeta lo elegido en los atributos anteriores, conserva los
 * posteriores cuando esa combinación existe y, si no, toma una que exista (con stock si la hay).
 */
export function selectOption<T extends SelectableVariant>(
  attributes: readonly SelectorAttribute[],
  variants: readonly T[],
  selected: T,
  attributeId: string,
  valueId: string,
): T {
  const changed = attributes.findIndex((attribute) => attribute.id === attributeId);
  if (changed < 0) return selected;

  const before = attributes.slice(0, changed).reduce((list, attribute) => withValue(list, attribute.id, valueOf(selected, attribute.id)), [...variants]);
  let candidates = withValue(before, attributeId, valueId);
  for (const attribute of attributes.slice(changed + 1)) {
    const kept = withValue(candidates, attribute.id, valueOf(selected, attribute.id));
    if (kept.length > 0) {
      candidates = kept;
      continue;
    }
    const fallback = preferredVariant(candidates);
    if (fallback) candidates = withValue(candidates, attribute.id, valueOf(fallback, attribute.id));
  }
  return preferredVariant(candidates) ?? selected;
}

/** Variantes con exactamente la misma combinación que `selected` (incluida): si hay varias, se distinguen por su SKU. */
export function sameCombination<T extends SelectableVariant>(attributes: readonly SelectorAttribute[], variants: readonly T[], selected: T): T[] {
  return attributes.reduce((list, attribute) => withValue(list, attribute.id, valueOf(selected, attribute.id)), [...variants]);
}
