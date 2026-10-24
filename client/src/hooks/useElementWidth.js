/**
 * Measures a container's width so charts can be rendered with an explicit
 * width. This avoids Recharts' responsive wrapper seeing a stale plot width
 * during layout or viewport changes.
 */

import { useLayoutEffect, useRef, useState } from 'react';

export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const update = () => {
      const nextWidth = Math.floor(element.getBoundingClientRect().width);
      setWidth((previous) => (previous === nextWidth ? previous : nextWidth));
    };

    update();

    if (typeof window.ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new window.ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
