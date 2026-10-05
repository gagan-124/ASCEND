import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Hero3DCard } from './Hero3DCard';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export interface HeroCardCanvasProps {
  mode: 'role' | 'resume';
  originRect: DOMRect | null;
  onImpactPhase?: () => void;
  onFlightComplete?: () => void;
  className?: string;
}

export const HeroCardCanvas: React.FC<HeroCardCanvasProps> = ({
  mode,
  originRect,
  onImpactPhase,
  onFlightComplete,
  className,
}) => {
  const theme = useUIStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden bg-transparent',
        className
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Soft Neutral & Warm Theme-Aware Studio Lighting */}
        <ambientLight intensity={isDark ? 0.75 : 0.95} color={isDark ? '#ffffff' : '#FFF8F0'} />
        <directionalLight
          position={[4, 6, 6]}
          intensity={isDark ? 1.1 : 1.35}
          color={isDark ? '#ffffff' : '#FFFDF9'}
        />
        <directionalLight
          position={[-4, -3, 2]}
          intensity={isDark ? 0.35 : 0.4}
          color={isDark ? '#64748B' : '#EADBC8'}
        />

        {/* 3D Claymorphic Card Mesh with GSAP Physics */}
        <Hero3DCard
          mode={mode}
          originRect={originRect}
          onImpactPhase={onImpactPhase}
          onFlightComplete={onFlightComplete}
        />
      </Canvas>
    </div>
  );
};
