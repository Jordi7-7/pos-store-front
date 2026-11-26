/** Pitido corto de confirmación: agudo si salió bien; grave y doble si no. Sirve para escanear sin mirar la pantalla. */
export function beep(ok: boolean): void {
  try {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const gain = context.createGain();
    gain.gain.value = 0.08;
    gain.connect(context.destination);
    const tones = ok ? [{ at: 0, hz: 1100, length: 0.09 }] : [{ at: 0, hz: 330, length: 0.12 }, { at: 0.17, hz: 260, length: 0.16 }];
    for (const tone of tones) {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = tone.hz;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + tone.at);
      oscillator.stop(context.currentTime + tone.at + tone.length);
    }
    setTimeout(() => void context.close(), 600);
  } catch {
    // sin sonido no pasa nada
  }
  navigator.vibrate?.(ok ? 40 : [60, 40, 60]);
}
