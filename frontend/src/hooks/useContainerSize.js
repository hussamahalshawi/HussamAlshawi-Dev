import { useState, useEffect } from 'react';

export default function useContainerSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = true;
    let ro;
    let rafId;

    function handleSize(w, h) {
      if (!active) return;
      if (w > 0 && h > 0) {
        setSize({ width: w, height: h });
        return true;
      }
      return false;
    }

    ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        handleSize(cr.width, cr.height);
      }
    });
    ro.observe(el);

    function poll() {
      if (!active) return;
      const rect = el.getBoundingClientRect();
      if (!handleSize(rect.width, rect.height)) {
        rafId = requestAnimationFrame(poll);
      }
    }
    requestAnimationFrame(poll);

    return () => {
      active = false;
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref]);

  return size;
}
