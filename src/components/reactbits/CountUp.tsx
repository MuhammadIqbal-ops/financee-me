import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CountUpProps {
  /** Target numeric value */
  value: number;
  /** Formats the interpolated number for display */
  format: (n: number) => string;
  className?: string;
  duration?: number;
}

/**
 * ReactBits-style CountUp: numbers roll up from 0 to the target with a
 * spring, triggered when the element scrolls into view.
 */
export function CountUp({ value, format, className, duration = 1.2 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5% 0px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsub = spring.on('change', (latest) => setDisplay(format(latest)));
    return () => unsub();
  }, [spring, format]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {display}
    </span>
  );
}
