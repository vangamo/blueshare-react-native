/// <reference types="node" />
/**
 * `PhotoStore` over `node:fs` in a fresh temp folder per instance, so Jest runs real
 * file I/O. Only tests and jest-setup.ts import it, so Metro never bundles it.
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { PhotoStore } from '@/items/domain/ports';

export class NodePhotoStore implements PhotoStore {
  /** The folder the photos are copied into (created on the first import, like the app's). */
  readonly folder: string;

  constructor() {
    this.folder = join(mkdtempSync(join(tmpdir(), 'blueshare-photos-')), 'images');
  }

  async importPhoto(sourceUri: string, fileName: string): Promise<void> {
    mkdirSync(this.folder, { recursive: true });
    copyFileSync(sourceUri, join(this.folder, fileName));
  }

  async removePhoto(fileName: string): Promise<void> {
    rmSync(join(this.folder, fileName), { force: true });
  }

  uriFor(fileName: string): string {
    return join(this.folder, fileName);
  }

  /** Whether a stored photo exists. */
  has(fileName: string): boolean {
    return existsSync(this.uriFor(fileName));
  }
}

/** Bytes of a tiny valid PNG, so fixtures are real image files. */
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Writes a small fixture image in a fresh temp folder and returns its path (a "picked" file). */
export function writeFixturePhoto(name = 'picked.png', bytes: Buffer = PNG_BYTES): string {
  const dir = mkdtempSync(join(tmpdir(), 'blueshare-picked-'));
  const path = join(dir, name);
  writeFileSync(path, bytes);
  return path;
}
