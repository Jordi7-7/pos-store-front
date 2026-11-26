import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyCameraFailure } from '../../domain/rules/camera-error';
import { createBarcodeEngine } from '../../infrastructure/scanner/barcode-engine';
import { applyAdvanced, keepScreenAwake, listCameras, openCamera, readAbilities, rememberCamera, savedCamera, startDetection, type ZoomRange } from '../../infrastructure/scanner/camera';

export type ScannerStatus = 'starting' | 'scanning' | 'denied' | 'no-camera' | 'insecure' | 'error';
export type { ZoomRange };

interface Options {
  /** La cámara solo se enciende mientras esto sea `true`. */
  active: boolean;
  /** Se llama una vez por cada lectura nueva (el mismo código, mientras siga a la vista, no se repite). */
  onCode: (code: string) => void;
  /** Cuánto debe apartarse un código para que, al volver a mostrarlo, cuente otra vez. */
  absenceMs?: number;
}

const SCAN_INTERVAL_MS = 120;

/**
 * Enciende la cámara, lee códigos de barras y los entrega. Se apaga sola al desactivarse o al desmontarse.
 * Devuelve el `ref` del elemento `<video>`, el estado y los controles de cámara, linterna y zoom.
 */
export function useBarcodeScanner({ active, onCode, absenceMs = 700 }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
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
    if (!window.isSecureContext) return setStatus('insecure');
    if (!navigator.mediaDevices?.getUserMedia) return setStatus('no-camera');

    let cancelled = false;
    let stream: MediaStream | null = null;
    let attachedVideo: HTMLVideoElement | null = null;
    let stopDetection: (() => void) | null = null;
    const releaseScreen = keepScreenAwake();

    const start = async () => {
      try {
        stream = await openCamera(deviceId);
        if (cancelled) return stream.getTracks().forEach((track) => track.stop()); // se cerró mientras la cámara arrancaba
        const track = stream.getVideoTracks()[0] ?? null;
        trackRef.current = track;
        const abilities = track ? readAbilities(track) : { torch: false, zoom: null };
        setTorchSupported(abilities.torch);
        setZoom(abilities.zoom);
        const video = videoRef.current;
        if (!video) return;
        attachedVideo = video;
        video.srcObject = stream;
        await video.play();
        setCameras(await listCameras());
        const engine = await createBarcodeEngine();
        if (cancelled) return;
        setStatus('scanning');
        stopDetection = startDetection(video, engine, { intervalMs: SCAN_INTERVAL_MS, absenceMs, onCode: (code) => onCodeRef.current(code) });
      } catch (error) {
        if (cancelled) return;
        const failure = classifyCameraFailure(error instanceof DOMException ? error.name : '', Boolean(deviceId));
        if (failure === 'remembered-camera-missing') {
          rememberCamera(undefined);
          setDeviceId(undefined); // vuelve a la trasera por defecto
          return;
        }
        setStatus(failure);
      }
    };
    void start();

    return () => {
      cancelled = true;
      stopDetection?.();
      stream?.getTracks().forEach((track) => track.stop());
      releaseScreen();
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
    if (await applyAdvanced(track, { torch: !torchOn })) setTorchOn(!torchOn);
    else setTorchSupported(false);
  }, [torchOn]);

  const changeZoom = useCallback(async (value: number) => {
    const track = trackRef.current;
    if (!track) return;
    if (await applyAdvanced(track, { zoom: value })) setZoom((current) => (current ? { ...current, value } : current));
    else setZoom(null);
  }, []);

  return { videoRef, status, zoom, changeZoom, canSwitchCamera: cameras.length > 1, switchCamera, torchSupported, torchOn, toggleTorch };
}
