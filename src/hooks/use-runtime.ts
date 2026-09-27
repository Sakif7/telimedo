import { useContext, useEffect } from 'react';
import { RuntimeContext } from '@/components/providers/RuntimeProvider';
import type { Registry } from '@/lib/runtime/types';

/** Registers elements with the runtime once they exist. `collect` runs after mount. */
export function useRuntimeRegistration<K extends keyof Registry>(key: K, collect: () => Registry[K] | null) {
  const handle = useContext(RuntimeContext);
  useEffect(() => {
    if (!handle) return;
    const value = collect();
    if (value) handle.register(key, value);
    return () => handle.unregister(key);
    // collect reads refs; it only needs to run once after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, key]);
}

/** For components that call into the runtime (e.g. the demo form waves the buddy). */
export function useRuntime() {
  return useContext(RuntimeContext);
}
