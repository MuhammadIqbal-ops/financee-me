import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  className?: string;
  /** Renders behind content; keep children separate for stacking */
  intensity?: 'soft' | 'vivid';
}

/**
 * ReactBits-style animated aurora: slow drifting color blobs that sit
 * behind hero sections and auth screens.
 */
export function AuroraBackground({ className, intensity = 'soft' }: AuroraBackgroundProps) {
  const opacity = intensity === 'vivid' ? 'opacity-40' : 'opacity-25';

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <motion.div
        className={cn('absolute -top-1/4 -left-1/4 h-[28rem] w-[28rem] rounded-full blur-3xl gradient-primary', opacity)}
        animate={{ x: [0, 60, -30, 0], y: [0, 40, 80, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={cn('absolute -bottom-1/4 -right-1/4 h-[26rem] w-[26rem] rounded-full blur-3xl gradient-accent', opacity)}
        animate={{ x: [0, -50, 30, 0], y: [0, -60, 20, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={cn('absolute top-1/3 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full blur-3xl bg-accent', intensity === 'vivid' ? 'opacity-25' : 'opacity-15')}
        animate={{ x: [0, 40, -50, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
