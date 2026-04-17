import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(currentDirectory, '..');
const source = resolve(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const target = resolve(root, 'public', 'wasm');

if (!existsSync(source)) {
  console.warn('[mediapipe] wasm source folder was not found, skipping asset copy.');
  process.exit(0);
}

mkdirSync(resolve(root, 'public'), { recursive: true });
cpSync(source, target, { recursive: true, force: true });
console.log('[mediapipe] copied wasm assets to public/wasm');
