import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, isApiError } from './api-error';
import { HttpClient, type HttpClientHooks } from './http-client';

const BASE = 'http://api.test';

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const contractError = (status: number, code: string, message = 'msg') =>
  json(status, { statusCode: status, code, message, details: { x: 1 }, path: '/p', timestamp: 't', requestId: 'req-1' });

function makeHooks(overrides: Partial<HttpClientHooks> = {}): HttpClientHooks {
  return {
    getAccessToken: vi.fn(() => 'tok-1'),
    refreshSession: vi.fn(async () => true),
    onSessionExpired: vi.fn(),
    ...overrides,
  };
}

function makeClient(hooks: HttpClientHooks = makeHooks()) {
  const client = new HttpClient({ baseUrl: BASE, refreshExemptPaths: ['/auth/login', '/auth/refresh'] });
  client.configure(hooks);
  return { client, hooks };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const sentInit = (call: number): RequestInit => (fetchMock.mock.calls[call]?.[1] ?? {}) as RequestInit;
const sentHeaders = (call: number): Headers => new Headers(sentInit(call).headers);

describe('HttpClient · respuestas correctas', () => {
  it('devuelve el JSON y envía el token como Bearer', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    const { client } = makeClient();
    await expect(client.get('/x')).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${BASE}/x`);
    expect(sentHeaders(0).get('Authorization')).toBe('Bearer tok-1');
  });

  it('no pisa un Authorization explícito (logout con el token a revocar)', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    const { client } = makeClient();
    await client.post('/auth/logout', {}, { headers: { Authorization: 'Bearer otro' } });
    expect(sentHeaders(0).get('Authorization')).toBe('Bearer otro');
  });

  it('envía Content-Type JSON solo cuando hay cuerpo', async () => {
    fetchMock.mockImplementation(async () => json(200, {}));
    const { client } = makeClient();
    await client.get('/x');
    await client.post('/x', { a: 1 });
    expect(sentHeaders(0).has('Content-Type')).toBe(false);
    expect(sentHeaders(1).get('Content-Type')).toBe('application/json');
    expect(sentInit(1).body).toBe('{"a":1}');
  });

  it('204 y cuerpo vacío devuelven objeto vacío', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));
    const { client } = makeClient();
    await expect(client.delete('/x')).resolves.toEqual({});
    await expect(client.get('/x')).resolves.toEqual({});
  });

  it('un 200 con cuerpo que no es JSON lanza INVALID_RESPONSE', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }));
    const { client } = makeClient();
    await expect(client.get('/x')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});

describe('HttpClient · contrato de errores', () => {
  it('conserva status, code, message, details, requestId, path y timestamp', async () => {
    fetchMock.mockResolvedValueOnce(contractError(409, 'SKU_TAKEN', 'El SKU ya existe'));
    const { client } = makeClient();
    const error = await client.post('/products', {}).catch((e: unknown) => e);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({
      status: 409,
      code: 'SKU_TAKEN',
      message: 'El SKU ya existe',
      details: { x: 1 },
      requestId: 'req-1',
      path: '/p',
      timestamp: 't',
    });
  });

  it('un cuerpo que no cumple el contrato da UNKNOWN_ERROR con el estado HTTP', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }));
    const { client } = makeClient();
    const error = (await client.get('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.status).toBe(502);
    expect(error.message).toContain('502');
  });

  it('un fallo de red es un ApiError NETWORK_ERROR con estado 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { client } = makeClient();
    const error = (await client.get('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.status).toBe(0);
    expect(error.isNetworkError).toBe(true);
    expect(error.cause).toBeInstanceOf(TypeError);
  });

  it('un 429 de login llega con su code y sin intentar renovar la sesión', async () => {
    fetchMock.mockResolvedValueOnce(contractError(429, 'TOO_MANY_ATTEMPTS'));
    const { client, hooks } = makeClient();
    await expect(client.post('/auth/login', {})).rejects.toMatchObject({ status: 429, code: 'TOO_MANY_ATTEMPTS' });
    expect(hooks.refreshSession).not.toHaveBeenCalled();
  });
});

describe('HttpClient · renovación de sesión ante 401', () => {
  it('renueva y reintenta con el token nuevo', async () => {
    let token = 'viejo';
    const hooks = makeHooks({
      getAccessToken: () => token,
      refreshSession: vi.fn(async () => {
        token = 'nuevo';
        return true;
      }),
    });
    fetchMock.mockResolvedValueOnce(contractError(401, 'AUTH_TOKEN_INVALID'));
    fetchMock.mockResolvedValueOnce(json(200, { ok: 1 }));
    const { client } = makeClient(hooks);
    await expect(client.get('/x')).resolves.toEqual({ ok: 1 });
    expect(sentHeaders(0).get('Authorization')).toBe('Bearer viejo');
    expect(sentHeaders(1).get('Authorization')).toBe('Bearer nuevo');
    expect(hooks.onSessionExpired).not.toHaveBeenCalled();
  });

  it('si el reintento falla con otro error, se informa ESE error (no el 401 original)', async () => {
    fetchMock.mockResolvedValueOnce(contractError(401, 'AUTH_TOKEN_INVALID'));
    fetchMock.mockResolvedValueOnce(contractError(403, 'PERMISSION_DENIED'));
    const { client } = makeClient();
    await expect(client.get('/x')).rejects.toMatchObject({ status: 403, code: 'PERMISSION_DENIED' });
  });

  it('si no se puede renovar, avisa de sesión expirada y lanza el 401', async () => {
    fetchMock.mockResolvedValueOnce(contractError(401, 'AUTH_TOKEN_INVALID'));
    const hooks = makeHooks({ refreshSession: vi.fn(async () => false) });
    const { client } = makeClient(hooks);
    await expect(client.get('/x')).rejects.toMatchObject({ status: 401, code: 'AUTH_TOKEN_INVALID' });
    expect(hooks.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('si renovar lanza una excepción se trata como sesión expirada', async () => {
    fetchMock.mockResolvedValueOnce(contractError(401, 'AUTH_TOKEN_INVALID'));
    const hooks = makeHooks({
      refreshSession: vi.fn(async () => {
        throw new Error('boom');
      }),
    });
    const { client } = makeClient(hooks);
    await expect(client.get('/x')).rejects.toMatchObject({ status: 401 });
    expect(hooks.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('varios 401 simultáneos provocan UNA sola renovación (el refresh token rota)', async () => {
    let token = 'viejo';
    const hooks = makeHooks({
      getAccessToken: () => token,
      refreshSession: vi.fn(async () => {
        await Promise.resolve();
        token = 'nuevo';
        return true;
      }),
    });
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
      new Headers(init.headers).get('Authorization') === 'Bearer nuevo'
        ? json(200, { ok: 1 })
        : contractError(401, 'AUTH_TOKEN_INVALID'),
    );
    const { client } = makeClient(hooks);
    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(results).toEqual([{ ok: 1 }, { ok: 1 }, { ok: 1 }]);
    expect(hooks.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('en rutas de login/refresh un 401 no intenta renovar', async () => {
    fetchMock.mockResolvedValueOnce(contractError(401, 'INVALID_CREDENTIALS'));
    const { client, hooks } = makeClient();
    await expect(client.post('/auth/login', {})).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(hooks.refreshSession).not.toHaveBeenCalled();
    expect(hooks.onSessionExpired).not.toHaveBeenCalled();
  });
});
