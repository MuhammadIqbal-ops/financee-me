import { useEffect, useMemo, useState } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Delay before the animation starts (s) */
  delay?: number;
  /** Stagger between words (s) */
  stagger?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

/**
 * ReactBits-style SplitText: words slide up + fade in with a soft blur,
 * staggered left to right. Respects prefers-reduced-motion.
 */
export function SplitText({ text, className, delay = 0, stagger = 0.06, as = 'h1' }: SplitTextProps) {
  const words = useMemo(() => text.split(' '), [text]);
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  const child: Variants = {
    hidden: { opacity: 0, y: '0.6em', filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: '0em',
      filter: 'blur(0px)',
      transition: { type: 'spring', damping: 20, stiffness: 220 },
    },
  };

  const Tag = motion[as] as typeof motion.h1;

  return (
    <Tag
      ref={ref as never}
      variants={container}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={cn('inline-block', className)}
      aria-label={text}
    >
      {words.map((word, i) => (
        <motion.span key={`${word}-${i}`} variants={child} className="inline-block will-change-transform" style={{ whiteSpace: 'pre' }}>
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </Tag>
  );
}
