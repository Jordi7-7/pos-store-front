/** Para qué se usa una impresora vinculada al navegador. */
export type PrinterRole = 'ticket' | 'label';

/** Lo que el navegador dice de un puerto (USB: fabricante y modelo; Bluetooth: el servicio). Dos impresoras distintas suelen diferir aquí. */
export interface PortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: string | number;
}

/** A qué impresora está asignado un rol: su descripción y cuál es entre las que tienen la MISMA descripción (por si hay dos iguales). */
export interface PortAssignment {
  info: PortInfo;
  nth: number;
}

export type PortAssignments = Partial<Record<PrinterRole, PortAssignment>>;

export const samePortInfo = (a: PortInfo, b: PortInfo): boolean =>
  a.usbVendorId === b.usbVendorId && a.usbProductId === b.usbProductId && a.bluetoothServiceClassId === b.bluetoothServiceClassId;

/** Posición, en la lista de puertos, del que corresponde a una asignación; `null` si esa impresora ya no está. */
function indexOfAssignment(infos: readonly PortInfo[], assignment: PortAssignment): number | null {
  const matches = infos.flatMap((info, index) => (samePortInfo(info, assignment.info) ? [index] : []));
  return matches[assignment.nth] ?? matches[0] ?? null;
}

/** La asignación que se guarda al vincular el puerto de la posición `index`. */
export function assignmentFor(infos: readonly PortInfo[], index: number): PortAssignment | null {
  const info = infos[index];
  if (!info) return null;
  return { info, nth: infos.slice(0, index).filter((other) => samePortInfo(other, info)).length };
}

/**
 * Qué puerto usa cada rol. El navegador da UNA lista con todas las impresoras vinculadas a este sitio, sin decir cuál es de qué:
 * si la de tickets tomara «la primera» y la de etiquetas «la última», con una sola impresora vinculada las dos creerían tener
 * la suya. Por eso cada rol recuerda cuál es la suya. Sin asignación guardada (vinculada antes de esto) se conserva lo de siempre
 * (tickets: la primera; etiquetas: la última) pero NUNCA la que ya es del otro rol.
 */
export function pickPortIndex(infos: readonly PortInfo[], role: PrinterRole, assignments: PortAssignments): number | null {
  const own = assignments[role];
  if (own) return indexOfAssignment(infos, own);
  if (role === 'label') return null;
  const labelAssignment = assignments.label;
  const taken = labelAssignment ? indexOfAssignment(infos, labelAssignment) : null;
  const first = infos.findIndex((_, index) => index !== taken);
  return first >= 0 ? first : null;
}
