import { useEffect, useRef } from 'react';
import { useAuthStore } from './useAuthStore';

// Tiempo máximo de inactividad antes de abrir el modal (por defecto 15 minutos o configurable en .env)
const envMinutes = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);
export const DEFAULT_IDLE_TIMEOUT_MS =
  (!isNaN(envMinutes) && envMinutes > 0 ? envMinutes : 15) * 60 * 1000;

interface UseIdleTimerOptions {
  idleTimeoutMs?: number;
}

export function useIdleTimer({ idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS }: UseIdleTimerOptions = {}) {
  const {
    isAuthenticated,
    isSessionExpiredModalOpen,
    openSessionExpiredModal,
  } = useAuthStore();

  const lastActivityRef = useRef<number>(Date.now());

  // Registro de interacción del usuario (mouse, teclado, touch, scroll)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Actualiza la marca de última actividad (throttled a máximo una vez por segundo)
    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 1000) {
        lastActivityRef.current = now;
        lastThrottledTime = now;
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated]);

  // Monitor periódico: únicamente detecta inactividad prolongada
  useEffect(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();

    const interval = setInterval(() => {
      // Si el modal ya está visible, el modal gestiona su propia cuenta regresiva
      if (isSessionExpiredModalOpen) return;

      const now = Date.now();
      const idleElapsed = now - lastActivityRef.current;

      // Inactividad prolongada: nadie tocó el sistema durante idleTimeoutMs
      if (idleElapsed >= idleTimeoutMs) {
        openSessionExpiredModal();
      }
    }, 5000); // Evaluación cada 5 segundos

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    idleTimeoutMs,
    isSessionExpiredModalOpen,
    openSessionExpiredModal,
  ]);
}
