import { describe, expect, it } from 'vitest';
import { pushScanResult } from './scan-history';

describe('historial del escáner', () => {
  it('la lectura más nueva va primero', () => {
    const history = pushScanResult(pushScanResult([], { status: 'ok', message: 'Playera M agregada' }), { status: 'ok', message: 'Pantalón agregado' });
    expect(history.map((entry) => entry.message)).toEqual(['Pantalón agregado', 'Playera M agregada']);
  });

  it('lo mismo dos veces seguidas suma en la misma línea', () => {
    const once = pushScanResult([], { status: 'ok', message: 'Playera M agregada' });
    expect(pushScanResult(once, { status: 'ok', message: 'Playera M agregada' })).toEqual([{ status: 'ok', message: 'Playera M agregada', count: 2 }]);
  });

  it('un error con el mismo texto que un acierto es otra línea, y solo se guardan las últimas', () => {
    let history = pushScanResult([], { status: 'ok', message: 'X' });
    history = pushScanResult(history, { status: 'error', message: 'X' });
    expect(history).toHaveLength(2);
    for (let i = 0; i < 10; i++) history = pushScanResult(history, { status: 'ok', message: `P${i}` });
    expect(history).toHaveLength(4);
  });
});
