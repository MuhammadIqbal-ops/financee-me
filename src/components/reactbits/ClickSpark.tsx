import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ReactBits-style ClickSpark: a burst of sparks fires from every click
 * anywhere in the app. Mount once at the layout root.
 */
const SPARK_COUNT = 8;

interface Spark {
  id: number;
  x: number;
  y: number;
}

export function ClickSpark({ className }: { className?: string }) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Skip on touch-first / small screens and reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setEnabled(window.matchMedia('(pointer: fine)').matches && !mq.matches);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let counter = 0;
    const onClick = (e: MouseEvent) => {
      const id = ++counter;
      setSparks((s) => [...s.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => setSparks((s) => s.filter((sp) => sp.id !== id)), 650);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className={cn('pointer-events-none fixed inset-0 z-[9999]', className)}>
      <AnimatePresence>
        {sparks.map((spark) => (
          <div key={spark.id} className="absolute" style={{ left: spark.x, top: spark.y }}>
            {Array.from({ length: SPARK_COUNT }).map((_, i) => {
              const angle = (i / SPARK_COUNT) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute block h-1 w-1 rounded-full bg-primary"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * 22,
                    y: Math.sin(angle) * 22,
                    opacity: 0,
                    scale: 0.4,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              );
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
