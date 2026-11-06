import { describe, expect, it, vi } from 'vitest';
import type { RegisteredImage } from '../../domain/entities/media.entity';
import { UploadFile } from './upload-file';
import { UploadImage } from './upload-image';

const file = new File(['x'], 'foto.png', { type: 'image/png' });
const image = { id: 'i1', url: 'https://cdn/x.png' } as RegisteredImage;

describe('UploadFile', () => {
  it('pide la dirección temporal con el nombre y tipo del archivo, sube y devuelve la URL pública', async () => {
    const repository = {
      getPresignedUpload: vi.fn(async () => ({ uploadUrl: 'https://r2/put', fileUrl: 'https://cdn/x.png' })),
      putFile: vi.fn(async () => undefined),
    };
    expect(await new UploadFile(repository).execute(file)).toBe('https://cdn/x.png');
    expect(repository.getPresignedUpload).toHaveBeenCalledWith('foto.png', 'image/png');
    expect(repository.putFile).toHaveBeenCalledWith('https://r2/put', file);
  });

  it('si la subida falla no devuelve una URL que no existe', async () => {
    const repository = { getPresignedUpload: vi.fn(async () => ({ uploadUrl: 'u', fileUrl: 'f' })), putFile: vi.fn(async () => Promise.reject(new Error('R2 caído'))) };
    await expect(new UploadFile(repository).execute(file)).rejects.toThrow('R2 caído');
  });
});

describe('UploadImage', () => {
  it('sube el archivo y registra la URL resultante con su descripción', async () => {
    const uploadFile = { execute: vi.fn(async () => 'https://cdn/x.png') };
    const repository = { register: vi.fn(async () => image) };
    expect(await new UploadImage(uploadFile, repository).execute({ file, description: 'Logo' })).toBe(image);
    expect(repository.register).toHaveBeenCalledWith('https://cdn/x.png', 'Logo');
  });

  it('si la subida falla no registra nada en la galería', async () => {
    const uploadFile = { execute: vi.fn(async () => Promise.reject(new Error('sin red'))) };
    const repository = { register: vi.fn() };
    await expect(new UploadImage(uploadFile, repository).execute({ file })).rejects.toThrow('sin red');
    expect(repository.register).not.toHaveBeenCalled();
  });
});
