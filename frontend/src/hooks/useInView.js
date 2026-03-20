import { useEffect, useRef, useState } from 'react';

const observerMap = new Map();
const observerRegistry = new Map();

function getObserverKey(threshold, rootMargin) {
  return `${threshold}|${rootMargin}`;
}

function getSharedObserver(threshold, rootMargin) {
  const key = getObserverKey(threshold, rootMargin);
  if (observerRegistry.has(key)) {
    return observerRegistry.get(key);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const onVisible = observerMap.get(entry.target);
        if (onVisible) {
          onVisible();
          observerMap.delete(entry.target);
        }
        observer.unobserve(entry.target);
      });
    },
    { threshold, rootMargin }
  );

  observerRegistry.set(key, observer);
  return observer;
}

/**
 * Intersection Observer hook
 * @param {object} options - IntersectionObserver options
 * @returns {{ ref, inView }}
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const threshold = options.threshold ?? 0.15;
  const rootMargin = options.rootMargin ?? '0px';

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = getSharedObserver(threshold, rootMargin);
    observerMap.set(element, () => setInView(true));
    observer.observe(element);
    return () => {
      observerMap.delete(element);
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return { ref, inView };
}
