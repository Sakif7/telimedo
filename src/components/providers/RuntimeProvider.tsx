'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Runtime } from '@/lib/runtime/runtime';
import type { BrandSvgs, Registry } from '@/lib/runtime/types';

/* Collects the elements the imperative runtime drives (studios, story, manifesto,
   "Say hi" label) and starts the runtime after hydration. Children register in
   their effects, which run before this provider's effect, so the registry is
   complete when the runtime starts. The runtime module (and, from it, three.js)
   is imported lazily, so nothing touching window or WebGL runs on the server.
   StrictMode's double effects dispose the first runtime before the second starts. */

export class RuntimeHandle {
  registry: Registry = {};
  runtime: Runtime | null = null;
  register<K extends keyof Registry>(key: K, value: Registry[K]) {
    this.registry[key] = value;
  }
  unregister(key: keyof Registry) {
    delete this.registry[key];
  }
  sayHi() {
    this.runtime?.sayHi();
  }
}

/** Read through the hooks in src/hooks/use-runtime.ts. */
export const RuntimeContext = createContext<RuntimeHandle | null>(null);

export function RuntimeProvider({ brand, children }: { brand: BrandSvgs; children: ReactNode }) {
  const [handle] = useState(() => new RuntimeHandle());
  useEffect(() => {
    let cancelled = false;
    let runtime: Runtime | null = null;
    import('@/lib/runtime/runtime').then(({ createRuntime }) => {
      if (cancelled) return;
      runtime = createRuntime(handle.registry, { brand });
      handle.runtime = runtime;
    });
    return () => {
      cancelled = true;
      handle.runtime = null;
      runtime?.dispose();
    };
  }, [handle, brand]);
  return <RuntimeContext.Provider value={handle}>{children}</RuntimeContext.Provider>;
}
