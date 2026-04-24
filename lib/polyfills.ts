import { Buffer as BufferPolyfill } from 'buffer';

// Install Buffer globally for libraries (e.g. isomorphic-git) that expect it.
const g = globalThis as unknown as { Buffer?: unknown };
if (typeof g.Buffer === 'undefined') {
  g.Buffer = BufferPolyfill;
}

export {};
