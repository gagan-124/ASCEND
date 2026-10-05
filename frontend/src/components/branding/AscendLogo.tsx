import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export type LogoVariant = 'horizontal' | 'stacked' | 'symbol-only' | 'wordmark-only';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom';

export interface AscendLogoProps extends HTMLMotionProps<'div'> {
  variant?: LogoVariant;
  size?: LogoSize;
  layoutId?: string;
  className?: string;
  symbolClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
}

/**
 * Authoritative SVG paths reproduced directly from the supplied ASCEND logo reference.
 * Coordinate space: 104 x 144 viewBox.
 * - Left Arrow: solid right-pointing triangular arrow head.
 * - Right Arrow: forward-pointing chevron with 45° angular profile and vertical boundary cuts.
 */
export const ASCEND_PATHS = {
  viewBox: '0 0 104 144',
  leftArrow: 'M 0 36 L 36 72 L 0 108 Z',
  rightArrow: 'M 32 0 L 104 72 L 32 144 L 32 108 L 68 72 L 32 36 Z',
} as const;

export interface AscendSymbolProps extends React.SVGProps<SVGSVGElement> {
  sizeClass?: string;
  leftArrowProps?: React.SVGProps<SVGPathElement>;
  rightArrowProps?: React.SVGProps<SVGPathElement>;
}

export const AscendSymbol = React.forwardRef<SVGSVGElement, AscendSymbolProps>(
  ({ className, sizeClass = 'h-8 w-auto', leftArrowProps, rightArrowProps, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        viewBox={ASCEND_PATHS.viewBox}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0 aspect-[104/144]', sizeClass, className)}
        aria-hidden="true"
        {...props}
      >
        {/* Left Arrow Component */}
        <path
          d={ASCEND_PATHS.leftArrow}
          {...leftArrowProps}
        />
        {/* Right Arrow Component */}
        <path
          d={ASCEND_PATHS.rightArrow}
          {...rightArrowProps}
        />
      </svg>
    );
  }
);
AscendSymbol.displayName = 'AscendSymbol';

export interface AscendWordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  sizeClass?: string;
}

export const AscendWordmark = React.forwardRef<HTMLSpanElement, AscendWordmarkProps>(
  ({ className, sizeClass = 'text-2xl', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'font-stardom font-semibold uppercase tracking-[0.14em] select-none leading-none',
          sizeClass,
          className
        )}
        {...props}
      >
        ASCEND
      </span>
    );
  }
);
AscendWordmark.displayName = 'AscendWordmark';

const sizeMap: Record<LogoSize, { symbol: string; text: string; gap: string }> = {
  sm: { symbol: 'h-6', text: 'text-xl', gap: 'gap-2.5' },
  md: { symbol: 'h-8', text: 'text-2xl', gap: 'gap-3.5' },
  lg: { symbol: 'h-10', text: 'text-3xl', gap: 'gap-4' },
  xl: { symbol: 'h-14', text: 'text-4xl', gap: 'gap-5' },
  custom: { symbol: '', text: '', gap: 'gap-3' },
};

/**
 * Authoritative ASCEND brand logo lockup component.
 */
export const AscendLogo = React.forwardRef<HTMLDivElement, AscendLogoProps>(
  (
    {
      variant = 'horizontal',
      size = 'md',
      layoutId,
      className,
      symbolClassName,
      wordmarkClassName,
      showWordmark = true,
      ...props
    },
    ref
  ) => {
    const currentSize = sizeMap[size];

    return (
      <motion.div
        ref={ref}
        layoutId={layoutId}
        role="img"
        aria-label="ASCEND — AI Career & Interview Intelligence"
        className={cn(
          'inline-flex items-center text-foreground transition-colors',
          variant === 'stacked' ? 'flex-col items-center gap-2' : currentSize.gap,
          className
        )}
        {...props}
      >
        {variant !== 'wordmark-only' && (
          <AscendSymbol
            sizeClass={currentSize.symbol}
            className={cn('text-foreground', symbolClassName)}
          />
        )}

        {showWordmark && variant !== 'symbol-only' && (
          <AscendWordmark
            sizeClass={currentSize.text}
            className={cn('text-foreground', wordmarkClassName)}
          />
        )}
      </motion.div>
    );
  }
);
AscendLogo.displayName = 'AscendLogo';
