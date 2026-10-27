import { useRef, useState, ReactNode, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Adds a subtle 3D tilt that follows the pointer */
  tilt?: boolean;
}

/**
 * ReactBits-style SpotlightCard: a radial spotlight that tracks the cursor
 * across the card surface, with an optional soft 3D tilt.
 */
export function SpotlightCard({ children, className, tilt = false }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: -999, y: -999, opacity: 0 });

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSpotlight({ x, y, opacity: 1 });
    if (tilt) {
      mx.set(x / rect.width);
      my.set(y / rect.height);
    }
  };

  const handleLeave = () => {
    setSpotlight((s) => ({ ...s, opacity: 0 }));
    if (tilt) {
      mx.set(0.5);
      my.set(0.5);
    }
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={tilt ? { rotateX: rx, rotateY: ry, transformPerspective: 900 } : undefined}
      className={cn('relative group/spotlight', className)}
    >
      {/* Pointer spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(340px circle at ${spotlight.x}px ${spotlight.y}px, hsl(var(--primary) / 0.10), transparent 70%)`,
        }}
      />
      {/* Border sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: `radial-gradient(220px circle at ${spotlight.x}px ${spotlight.y}px, hsl(var(--primary) / 0.22), transparent 70%)`,
          maskImage: 'radial-gradient(220px circle at center, transparent 68%, black 100%)',
          WebkitMaskImage: 'radial-gradient(220px circle at center, transparent 68%, black 100%)',
        }}
      />
      <Card className="h-full w-full bg-transparent border-transparent shadow-none">
        {children}
      </Card>
    </motion.div>
  );
}
