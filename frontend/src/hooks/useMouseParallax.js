import { useEffect, useRef } from 'react';

/**
 * Mouse parallax hook
 * Returns a ref to attach to the container element.
 * Normalized mouse position [-1, +1] is applied as CSS transforms.
 * @param {{ intensity?: number, transition?: string }} options
 */
export function useMouseParallax({ intensity = 6, transitionMs = 120 } = {}) {
  const targetRef = useRef(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = (e.clientY / window.innerHeight) * 2 - 1;

      const rotateY = mx * -intensity;
      const rotateX = my * (intensity * 0.67);

      if (el) {
        el.style.transform = `perspective(900px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        el.style.transition = `transform ${transitionMs}ms ease-out`;
      }
    };

    const handleMouseLeave = () => {
      if (el) {
        el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
        el.style.transition = 'transform 0.5s ease-out';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity, transitionMs]);

  return targetRef;
}
