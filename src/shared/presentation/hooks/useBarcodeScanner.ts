import { useCallback, useEffect, useRef, useState } from 'react';
import { acceptScan, normalizeScan, type LastScan } from '../../domain/rules/scan-filter';
import { createBarcodeEngine } from '../../infrastructure/scanner/barcode-engine';

export type ScannerStatus = 'starting' | 'scanning' | 'denied' | 'no-camera' | 'insecure' | 'error';

interface Options {
  /** La cámara solo se enciende mientras esto sea `true`. */
  active: boolean;
  /** Se llama una vez por cada lectura nueva (el mismo código, mientras siga a la vista, no se repite). */
  onCode: (code: string) => void;
  /** Cuánto debe apartarse un código para que, al volver a mostrarlo, cuente otra vez. */
  absenceMs?: number;
}

const SCAN_INTERVAL_MS = 120;

interface ExtendedCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  zoom?: { min: number; max: number; step: number };
}

export interface ZoomRange {
  min: number;
  max: number;
  step: number;
  value: number;
}

const CAMERA_KEY = 'pos_scanner_camera';

const savedCamera = (): string | undefined => {
  try {
    return localStorage.getItem(CAMERA_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};
const rememberCamera = (id: string | undefined) => {
  try {
    if (id) localStorage.setItem(CAMERA_KEY, id);
    else localStorage.removeItem(CAMERA_KEY);
  } catch {
    // sin almacenamiento solo se olvida la elección
  }
};

/**
 * Enciende la cámara trasera, lee códigos de barras y los entrega. Se apaga sola al desactivarse o al desmontarse.
 * Devuelve el `ref` del elemento `<video>`, el estado y los controles de cambiar de cámara y de linterna.
 */
export function useBarcodeScanner({ active, onCode, absenceMs = 700 }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('starting');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(savedCamera);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState<ZoomRange | null>(null);

  useEffect(() => {
    if (!active) return;
    setStatus('starting');
    setTorchOn(false);
    if (!window.isSecureContext) {
      setStatus('insecure');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('no-camera');
      return;
    }

    let attachedVideo: HTMLVideoElement | null = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stream: MediaStream | null = null;
    let wakeLock: WakeLockSentinel | null = null;
    // Que la pantalla no se apague a mitad de un escaneo
    void navigator.wakeLock?.request('screen').then((lock) => (wakeLock = lock), () => undefined);

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }), width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const track = stream.getVideoTracks()[0] ?? null;
        trackRef.current = track;
        const capabilities = track?.getCapabilities?.() as ExtendedCapabilities | undefined;
        setTorchSupported(Boolean(capabilities?.torch));
        const zoomRange = capabilities?.zoom;
        const currentZoom = (track?.getSettings() as { zoom?: number } | undefined)?.zoom;
        setZoom(zoomRange ? { ...zoomRange, value: Number(currentZoom ?? zoomRange.min) } : null);
        const video = videoRef.current;
        if (!video) return;
        attachedVideo = video;
        video.srcObject = stream;
        await video.play();
        setCameras((await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput'));
        const engine = await createBarcodeEngine();
        if (cancelled) return;
        setStatus('scanning');

        let last: LastScan | null = null;
        const tick = async () => {
          if (cancelled) return;
          try {
            const code = normalizeScan((await engine.detect(video)) ?? '');
            const now = Date.now();
            const isNew = acceptScan(code, last, now, absenceMs);
            if (code) last = { code, at: now };
            if (isNew) onCodeRef.current(code);
          } catch {
            // un fotograma que falla no apaga la cámara
          }
          if (!cancelled) timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS);
        };
        void tick();
      } catch (error) {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : '';
        if (name === 'OverconstrainedError' && deviceId) {
          // La cámara recordada ya no está (otro teléfono, otro permiso): se vuelve a la trasera por defecto
          rememberCamera(undefined);
          setDeviceId(undefined);
          return;
        }
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no-camera' : 'error');
      }
    };
    void start();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      void wakeLock?.release().catch(() => undefined);
      trackRef.current = null;
      if (attachedVideo) attachedVideo.srcObject = null;
    };
  }, [active, deviceId, absenceMs]);

  const switchCamera = useCallback(() => {
    setDeviceId((current) => {
      if (cameras.length < 2) return current;
      const index = cameras.findIndex((camera) => camera.deviceId === (current ?? trackRef.current?.getSettings().deviceId));
      const next = cameras[(index + 1) % cameras.length]?.deviceId;
      rememberCamera(next);
      return next;
    });
  }, [cameras]);

  const toggleTorch = useCallback(async () => {
    const track = trackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  const changeZoom = useCallback(async (value: number) => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] });
      setZoom((current) => (current ? { ...current, value } : current));
    } catch {
      setZoom(null);
    }
  }, []);

  return { videoRef, status, zoom, changeZoom, canSwitchCamera: cameras.length > 1, switchCamera, torchSupported, torchOn, toggleTorch };
}
