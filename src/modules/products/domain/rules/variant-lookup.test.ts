import { describe, expect, it } from 'vitest';
import { matchSku } from './variant-lookup';

const camisa = { sku: 'CAM-M', barcode: '7790001' };
const camisaL = { sku: 'CAM-L', barcode: '7790002' };

describe('matchSku', () => {
  it('encuentra por SKU sin importar mayúsculas y por código de barras', () => {
    expect(matchSku([camisa, camisaL], 'cam-l')).toEqual({ kind: 'found', variant: camisaL });
    expect(matchSku([camisa, camisaL], '7790001')).toEqual({ kind: 'found', variant: camisa });
  });

  it('si el buscador devolvió una sola variante, es esa aunque no coincida exacto', () => {
    expect(matchSku([camisa], 'CAM')).toEqual({ kind: 'found', variant: camisa });
  });

  it('varias sin coincidencia exacta es ambiguo, y ninguna es no encontrado', () => {
    expect(matchSku([camisa, camisaL], 'CAM')).toEqual({ kind: 'ambiguous' });
    expect(matchSku([], 'CAM')).toEqual({ kind: 'not-found' });
  });

  it('la coincidencia exacta gana aunque haya más candidatas', () => {
    expect(matchSku([camisa, camisaL], 'CAM-M')).toEqual({ kind: 'found', variant: camisa });
  });
});
