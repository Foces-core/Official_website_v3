/**
 * Shared constants for probe scripts.
 * All probes read PREVIEW_URL from environment, defaulting to the local preview server.
 */

export const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';
export const DEV_URL = process.env.DEV_URL ?? 'http://localhost:5173';

export function getPreviewUrl() {
  return PREVIEW_URL;
}

export function getDevUrl() {
  return DEV_URL;
}
