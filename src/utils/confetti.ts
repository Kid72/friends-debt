import confetti from 'canvas-confetti';

const BRAND_CONFETTI_COLORS = [
  '#006A60', // Primary Deep Teal
  '#70F7E5', // Teal Light
  '#FFD700', // Gold
  '#984061', // Rose
  '#7C5800', // Amber
  '#006783', // Cyan
];

/**
 * Triggers a single celebratory confetti burst when a debt is settled.
 */
export function triggerSettlementConfetti(): void {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: BRAND_CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
  } catch {
    // In headless or non-browser environments, fail silently
  }
}

/**
 * Triggers an energetic multi-stage celebratory fireworks display
 * when all group debts have been settled.
 */
export function triggerAllSettledCelebration(): void {
  try {
    const duration = 2500;
    const animationEnd = Date.now() + duration;

    // Initial central pop
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
      colors: BRAND_CONFETTI_COLORS,
      disableForReducedMotion: true,
    });

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);

      // Left cannon
      confetti({
        particleCount,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: BRAND_CONFETTI_COLORS,
        disableForReducedMotion: true,
      });

      // Right cannon
      confetti({
        particleCount,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: BRAND_CONFETTI_COLORS,
        disableForReducedMotion: true,
      });
    }, 250);
  } catch {
    // Gracefully handle unsupported environments
  }
}
