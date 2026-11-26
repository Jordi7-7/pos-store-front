import { assignmentFor, pickPortIndex, type PortAssignments, type PortInfo, type PrinterRole } from '../../domain/rules/port-assignment';
import { getSerial, type SerialPortLike } from './web-serial';

const STORAGE_KEY = 'aura_printer_ports';

const infoOf = (port: SerialPortLike): PortInfo => port.getInfo?.() ?? {};

function readAssignments(): PortAssignments {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as PortAssignments) : {};
  } catch {
    return {};
  }
}

function writeAssignments(assignments: PortAssignments): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    // sin almacenamiento se vuelve a elegir la impresora cada vez
  }
}

/**
 * Qué puerto del navegador es de cada impresora (tickets o etiquetas). El navegador da una sola lista de todo lo vinculado
 * a este sitio; aquí cada rol recuerda cuál es el suyo para que el ticket no salga por la impresora de etiquetas ni al revés.
 */
export const portRegistry = {
  async portFor(role: PrinterRole): Promise<SerialPortLike | null> {
    const serial = getSerial();
    if (!serial) return null;
    const ports = await serial.getPorts();
    const index = pickPortIndex(ports.map(infoOf), role, readAssignments());
    return index === null ? null : (ports[index] ?? null);
  },

  /** El puerto que acaba de elegir la persona en el selector del navegador pasa a ser el de este rol. */
  async assign(role: PrinterRole, port: SerialPortLike): Promise<void> {
    const serial = getSerial();
    if (!serial) return;
    const ports = await serial.getPorts();
    const index = ports.indexOf(port);
    const assignment = assignmentFor(ports.map(infoOf), index);
    if (assignment) writeAssignments({ ...readAssignments(), [role]: assignment });
  },

  /** Olvida la impresora de este rol (y la desvincula del navegador). */
  async release(role: PrinterRole): Promise<void> {
    const port = await this.portFor(role);
    const rest = { ...readAssignments() };
    delete rest[role];
    writeAssignments(rest);
    if (!port) return;
    try {
      if (port.readable || port.writable) await port.close();
      await port.forget?.();
    } catch {
      // ya estaba cerrado o desconectado
    }
  },
};
