import { describe, expect, it } from 'vitest';
import { assignmentFor, pickPortIndex, type PortInfo } from './port-assignment';

const usbTicket: PortInfo = { usbVendorId: 0x0416, usbProductId: 0x5011 };
const usbLabel: PortInfo = { usbVendorId: 0x2d84, usbProductId: 0x0001 };
const bluetooth: PortInfo = { bluetoothServiceClassId: '00001101-0000-1000-8000-00805f9b34fb' };

describe('qué impresora usa cada rol', () => {
  it('con una sola impresora vinculada para etiquetas, los tickets no la toman (el defecto: el ticket salía por la de etiquetas)', () => {
    const infos = [bluetooth];
    const assignments = { label: assignmentFor(infos, 0) ?? undefined };
    expect(pickPortIndex(infos, 'ticket', assignments)).toBeNull();
    expect(pickPortIndex(infos, 'label', assignments)).toBe(0);
  });

  it('con una sola impresora vinculada para tickets, las etiquetas no la toman', () => {
    const infos = [usbTicket];
    const assignments = { ticket: assignmentFor(infos, 0) ?? undefined };
    expect(pickPortIndex(infos, 'label', assignments)).toBeNull();
    expect(pickPortIndex(infos, 'ticket', assignments)).toBe(0);
  });

  it('cada rol encuentra la suya aunque el navegador cambie el orden de la lista', () => {
    const before = [usbTicket, bluetooth];
    const assignments = { ticket: assignmentFor(before, 0) ?? undefined, label: assignmentFor(before, 1) ?? undefined };
    const after = [bluetooth, usbTicket];
    expect(pickPortIndex(after, 'ticket', assignments)).toBe(1);
    expect(pickPortIndex(after, 'label', assignments)).toBe(0);
  });

  it('dos impresoras idénticas se distinguen por cuál es de cuál entre las iguales', () => {
    const infos = [usbLabel, usbLabel];
    const assignments = { ticket: assignmentFor(infos, 0) ?? undefined, label: assignmentFor(infos, 1) ?? undefined };
    expect(assignments.label?.nth).toBe(1);
    expect(pickPortIndex(infos, 'ticket', assignments)).toBe(0);
    expect(pickPortIndex(infos, 'label', assignments)).toBe(1);
  });

  it('si la impresora asignada ya no está, el rol queda sin impresora y no toma otra', () => {
    const assignments = { ticket: assignmentFor([usbTicket], 0) ?? undefined };
    expect(pickPortIndex([bluetooth], 'ticket', assignments)).toBeNull();
  });

  it('sin asignaciones guardadas los tickets siguen usando la primera (como antes), y las etiquetas ninguna: es una función nueva', () => {
    expect(pickPortIndex([usbTicket, bluetooth], 'ticket', {})).toBe(0);
    expect(pickPortIndex([usbTicket, bluetooth], 'label', {})).toBeNull();
    expect(pickPortIndex([], 'ticket', {})).toBeNull();
  });

  it('los tickets sin asignación propia nunca toman la que ya es de las etiquetas', () => {
    const infos = [usbTicket, bluetooth];
    expect(pickPortIndex(infos, 'ticket', { label: assignmentFor(infos, 0) ?? undefined })).toBe(1);
    expect(pickPortIndex(infos, 'ticket', { label: assignmentFor(infos, 1) ?? undefined })).toBe(0);
    expect(pickPortIndex([bluetooth], 'ticket', { label: assignmentFor([bluetooth], 0) ?? undefined })).toBeNull();
  });
});
