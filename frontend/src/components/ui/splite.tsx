'use client'

import Spline from '@splinetool/react-spline'

interface SplineSceneProps {
  scene: string
  className?: string
  onLoad?: () => void
}

export function SplineScene({ scene, className, onLoad }: SplineSceneProps) {
  return (
    <Spline
      scene={scene}
      className={className}
      onLoad={onLoad}
    />
  )
}

