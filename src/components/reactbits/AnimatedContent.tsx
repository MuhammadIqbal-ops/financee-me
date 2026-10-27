import { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

interface AnimatedContentProps {
  children: ReactNode;
  className?: string;
  /** Delay before the animation starts (s) */
  delay?: number;
  /** Vertical offset it slides in from (px) */
  distance?: number;
  direction?: 'up' | 'down';
}

/**
 * ReactBits-style AnimatedContent: fades and slides content into place
 * when it mounts / enters the viewport.
 */
export function AnimatedContent({ children, className, delay = 0, distance = 24, direction = 'up' }: AnimatedContentProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y: direction === 'up' ? distance : -distance },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 200, delay } },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-5% 0px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
