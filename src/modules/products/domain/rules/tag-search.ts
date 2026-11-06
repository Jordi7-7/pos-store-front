interface Named {
  name: string;
}

/** Etiquetas cuyo nombre contiene lo escrito, sin distinguir mayúsculas. */
export function filterTags<T extends Named>(tags: T[], input: string): T[] {
  const needle = input.toLowerCase();
  return tags.filter((tag) => tag.name.toLowerCase().includes(needle));
}

/** ¿Se puede crear una etiqueta con lo escrito? Solo si no está vacío y no existe ya una con ese nombre. */
export function canCreateTag(tags: Named[], input: string): boolean {
  const name = input.trim().toLowerCase();
  return name.length > 0 && !tags.some((tag) => tag.name.toLowerCase() === name);
}
