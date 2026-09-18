import { describe, it, expect, vi } from 'vitest';
// @ts-expect-error - api/manifest.js is a plain JS Vercel serverless function outside src
import handler from '../../api/manifest.js';

describe('Manifest API Route', () => {
  it('returns manifest with start_url containing room parameter', () => {
    const req = {
      query: { room: 'my-cool-room' },
      url: '/api/manifest?room=my-cool-room',
    };
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/manifest+json; charset=utf-8');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        start_url: '/?room=my-cool-room',
        display: 'standalone',
      })
    );
  });

  it('returns default start_url "/" when no room is specified', () => {
    const req = {
      query: {},
      url: '/api/manifest',
    };
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        start_url: '/',
        display: 'standalone',
      })
    );
  });
});
