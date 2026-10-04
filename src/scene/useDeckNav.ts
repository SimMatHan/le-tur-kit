import { useCallback, useEffect, useState } from 'react';

function readHash(count: number): number {
  const m = window.location.hash.match(/^#\/(\d+)/);
  const n = m ? parseInt(m[1], 10) - 1 : 0;
  return Math.min(Math.max(0, n), Math.max(0, count - 1));
}

/** Aktuel slide, synkroniseret med URL-hash (#/5), så genindlæsning bevarer pladsen. */
export function useDeckNav(count: number) {
  const [index, setIndex] = useState(() => readHash(count));
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const on = () => setIndex(readHash(count));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, [count]);

  useEffect(() => {
    if (index > count - 1 && count > 0) setIndex(count - 1);
  }, [count, index]);

  useEffect(() => {
    const want = `#/${index + 1}`;
    if (window.location.hash !== want) history.replaceState(null, '', want);
  }, [index]);

  const go = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(0, i), count - 1);
      setIndex((cur) => {
        setDirection(next >= cur ? 1 : -1);
        return next;
      });
    },
    [count],
  );
  const next = useCallback(() => setIndex((i) => (setDirection(1), Math.min(i + 1, count - 1))), [count]);
  const prev = useCallback(() => setIndex((i) => (setDirection(-1), Math.max(i - 1, 0))), []);

  return { index, direction, go, next, prev };
}
