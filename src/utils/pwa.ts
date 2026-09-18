/**
 * Updates the PWA manifest link element in document head to include the current room parameter.
 * This guarantees that when the user selects "Add to Home Screen" on iOS Safari or Android Chrome,
 * the created shortcut's start_url points directly to their active room.
 */
export function updatePwaManifest(roomId: string | null): void {
  if (typeof document === 'undefined') return;

  const manifestUrl = roomId
    ? `/api/manifest?room=${encodeURIComponent(roomId)}`
    : '/api/manifest';

  const manifestLink = document.getElementById('app-manifest') as HTMLLinkElement | null;
  if (manifestLink) {
    if (manifestLink.getAttribute('href') !== manifestUrl) {
      manifestLink.setAttribute('href', manifestUrl);
    }
  } else {
    const newLink = document.createElement('link');
    newLink.id = 'app-manifest';
    newLink.rel = 'manifest';
    newLink.href = manifestUrl;
    document.head.appendChild(newLink);
  }
}

/**
 * Checks if the current window is launched in standalone / PWA mode.
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true ||
    (typeof document !== 'undefined' && Boolean(document.referrer && document.referrer.includes('android-app://')))
  );
}
