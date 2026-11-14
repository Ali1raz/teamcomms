import { createLocalStorage } from "@ui-sdk/core";
import { useEffect, useRef } from "react";

function hasDraftContent(value: string): boolean {
  if (!value || !value.trim()) return false;
  try {
    const json = JSON.parse(value);
    const content = json?.content;
    if (!Array.isArray(content) || content.length === 0) return false;
    return /"text":/.test(JSON.stringify(content));
  } catch {
    return value.trim().length > 0;
  }
}

/**
 * Persists an in-progress draft in localStorage, keyed per conversation/thread.
 * - Restores once per key (only when the current value is empty).
 * - Debounces writes (300ms) to avoid writing on every keystroke.
 * - Removes the draft immediately when the value becomes empty, so a successful
 *   send (which resets the field) clears it, while a failed send preserves it.
 * - Flushes any pending draft on unmount so switching threads doesn't lose it.
 */
export function useDraft(
  draftKey: string | undefined,
  value: string,
  onChange: (value: string) => void
) {
  const restoredRef = useRef(false);
  const prevKeyRef = useRef<string | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const valueRef = useRef(value);
  valueRef.current = value;
  const keyRef = useRef(draftKey);
  keyRef.current = draftKey;

  useEffect(() => {
    return () => {
      const k = keyRef.current;
      const v = valueRef.current;
      if (!k || typeof window === "undefined") return;
      if (!v || !v.trim() || !hasDraftContent(v)) return;
      try {
        createLocalStorage(k).set(v);
      } catch {
        // ignore storage errors
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevKeyRef.current !== draftKey) {
      prevKeyRef.current = draftKey;
      restoredRef.current = false;
    }
    if (!draftKey || typeof window === "undefined") return;

    if (!restoredRef.current) {
      restoredRef.current = true;
      try {
        const storage = createLocalStorage(draftKey);
        const stored = storage.get();
        if (stored && (!value || !value.trim())) {
          onChangeRef.current(stored);
          return;
        }
      } catch {
        // ignore storage errors
      }
    }

    const storage = createLocalStorage(draftKey);

    if (!value || !value.trim()) {
      try {
        storage.remove();
      } catch {
        // ignore storage errors
      }
      return;
    }

    const timeout = window.setTimeout(() => {
      try {
        if (hasDraftContent(value)) {
          storage.set(value);
        }
      } catch {
        // ignore storage errors
      }
    }, 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, value]);
}
