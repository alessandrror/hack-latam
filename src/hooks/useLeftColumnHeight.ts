"use client";

import { useEffect, useState, type RefObject } from "react";

const LG_MEDIA = "(min-width: 1024px)";

/**
 * Mide la altura de la columna izquierda en desktop para fijar el chat
 * sin que los mensajes expandan la fila del layout.
 */
export function useLeftColumnHeight(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setHeight(null));
      return;
    }

    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia(LG_MEDIA);

    const measure = () => {
      if (!mq.matches) {
        setHeight(null);
        return;
      }
      setHeight(el.getBoundingClientRect().height);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    mq.addEventListener("change", measure);
    measure();

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", measure);
    };
  }, [enabled, ref]);

  return height;
}
