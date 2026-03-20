import { useEffect, useRef, useState } from 'react';

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Animated counter hook using requestAnimationFrame
 * @param {number} targetValue - The number to count up to
 * @param {number} duration - Animation duration in ms (default 2000)
 * @param {boolean} start - Whether to start the animation
 * @returns {number} current animated value
 */
export function useCounter(targetValue, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!start) return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      setValue(easedProgress * targetValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(targetValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startTimeRef.current = null;
    };
  }, [targetValue, duration, start]);

  return value;
}
