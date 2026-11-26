import { acceptScan, normalizeScan, type LastScan } from '../../domain/rules/scan-filter';
import type { BarcodeEngine } from './barcode-engine';

export interface ZoomRange {
  min: number;
  max: number;
  step: number;
  value: number;
}

interface TrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  zoom?: { min: number; max: number; step: number };
}

const CAMERA_KEY = 'pos_scanner_camera';

/** La cámara que la persona eligió la última vez (si el navegador deja guardarla). */
export function savedCamera(): string | undefined {
  try {
    return localStorage.getItem(CAMERA_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function rememberCamera(deviceId: string | undefined): void {
  try {
    if (deviceId) localStorage.setItem(CAMERA_KEY, deviceId);
    else localStorage.removeItem(CAMERA_KEY);
  } catch {
    // sin almacenamiento solo se olvida la elección
  }
}

/** Pide la cámara indicada o, sin indicar, la trasera; con resolución suficiente para leer códigos chicos. */
export function openCamera(deviceId?: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }), width: { ideal: 1280 }, height: { ideal: 720 } },
  });
}

export async function listCameras(): Promise<MediaDeviceInfo[]> {
  return (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
}

/** Qué sabe hacer la cámara abierta: linterna y zoom, solo en los dispositivos que lo permiten. */
export function readAbilities(track: MediaStreamTrack): { torch: boolean; zoom: ZoomRange | null } {
  const capabilities = track.getCapabilities?.() as TrackCapabilities | undefined;
  const range = capabilities?.zoom;
  const current = (track.getSettings() as { zoom?: number }).zoom;
  return { torch: Boolean(capabilities?.torch), zoom: range ? { ...range, value: Number(current ?? range.min) } : null };
}

/** Aplica una opción avanzada de la cámara (linterna, zoom); `false` si el dispositivo la rechaza. */
export async function applyAdvanced(track: MediaStreamTrack, setting: { torch: boolean } | { zoom: number }): Promise<boolean> {
  try {
    await track.applyConstraints({ advanced: [setting as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

/** Mantiene la pantalla encendida mientras se escanea. Devuelve cómo soltarla. */
export function keepScreenAwake(): () => void {
  let lock: WakeLockSentinel | null = null;
  let released = false;
  void navigator.wakeLock?.request('screen').then(
    (sentinel) => {
      lock = sentinel;
      if (released) void sentinel.release().catch(() => undefined);
    },
    () => undefined,
  );
  return () => {
    released = true;
    void lock?.release().catch(() => undefined);
  };
}

interface DetectionOptions {
  intervalMs: number;
  /** Cuánto debe apartarse un código para que, al volver, cuente otra vez. */
  absenceMs: number;
  onCode: (code: string) => void;
}

/** Lee el video cada pocos milisegundos y avisa de cada código nuevo. Devuelve cómo detenerlo. */
export function startDetection(video: HTMLVideoElement, engine: BarcodeEngine, { intervalMs, absenceMs, onCode }: DetectionOptions): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last: LastScan | null = null;

  const tick = async () => {
    if (stopped) return;
    try {
      const code = normalizeScan((await engine.detect(video)) ?? '');
      const now = Date.now();
      const isNew = acceptScan(code, last, now, absenceMs);
      if (code) last = { code, at: now };
      if (isNew && !stopped) onCode(code);
    } catch {
      // un fotograma que falla no apaga la cámara
    }
    if (!stopped) timer = setTimeout(() => void tick(), intervalMs);
  };
  void tick();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
