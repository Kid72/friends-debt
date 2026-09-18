import { describe, it, expect, beforeEach } from 'vitest';
import { updatePwaManifest, isStandaloneMode } from './pwa';

describe('PWA Utilities', () => {
  beforeEach(() => {
    // Reset any manifest links
    const existing = document.getElementById('app-manifest');
    if (existing) {
      existing.remove();
    }
  });

  it('creates and sets the manifest link href with room parameter', () => {
    updatePwaManifest('test-room-123');

    const manifestLink = document.getElementById('app-manifest') as HTMLLinkElement | null;
    expect(manifestLink).not.toBeNull();
    expect(manifestLink?.getAttribute('href')).toBe('/api/manifest?room=test-room-123');
  });

  it('updates the existing manifest link href when room changes', () => {
    updatePwaManifest('room-1');
    let manifestLink = document.getElementById('app-manifest') as HTMLLinkElement | null;
    expect(manifestLink?.getAttribute('href')).toBe('/api/manifest?room=room-1');

    updatePwaManifest('room-2');
    manifestLink = document.getElementById('app-manifest') as HTMLLinkElement | null;
    expect(manifestLink?.getAttribute('href')).toBe('/api/manifest?room=room-2');
  });

  it('sets manifest link href to base /api/manifest when roomId is null', () => {
    updatePwaManifest(null);

    const manifestLink = document.getElementById('app-manifest') as HTMLLinkElement | null;
    expect(manifestLink?.getAttribute('href')).toBe('/api/manifest');
  });

  it('detects browser vs standalone mode', () => {
    // In JSDOM test environment by default it is not standalone
    expect(isStandaloneMode()).toBe(false);
  });
});
