import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

const ZERO_DURATION = '00h 00m 00s';
const pad = (value: number): string => Math.max(0, Math.floor(value)).toString().padStart(2, '0');

/** Hora actual de la tienda y tiempo transcurrido desde que se abrió el turno, actualizados cada segundo. */
export function usePOSClock(openedAt: string | Date | null | undefined, timezone: string) {
  const [currentTime, setCurrentTime] = useState(() => DateTime.now().setZone(timezone).toFormat('HH:mm:ss'));
  const [shiftDuration, setShiftDuration] = useState(ZERO_DURATION);

  useEffect(() => {
    const tick = () => {
      const now = DateTime.now().setZone(timezone);
      setCurrentTime(now.toFormat('HH:mm:ss'));
      if (!openedAt) return setShiftDuration(ZERO_DURATION);

      const start = typeof openedAt === 'string' ? DateTime.fromISO(openedAt).setZone(timezone) : DateTime.fromJSDate(new Date(openedAt)).setZone(timezone);
      if (!start.isValid) return setShiftDuration(ZERO_DURATION);
      const diff = now.diff(start, ['hours', 'minutes', 'seconds']);
      setShiftDuration(`${pad(diff.hours)}h ${pad(diff.minutes)}m ${pad(diff.seconds)}s`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [openedAt, timezone]);

  return { currentTime, shiftDuration };
}
