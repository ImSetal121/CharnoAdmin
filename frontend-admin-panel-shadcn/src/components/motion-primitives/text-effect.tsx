'use client';
import { type JSX, useMemo } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import { cn } from '@/lib/utils';

export type TextEffectProps = {
  children: string;
  per?: 'word' | 'char' | 'line';
  as?: keyof JSX.IntrinsicElements;
  preset?: 'blur-sm' | 'fade-in-blur' | 'scale' | 'fade' | 'slide';
  variants?: { container?: Variants; item?: Variants };
  className?: string;
  delay?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  segmentWrapperClassName?: string;
  style?: React.CSSProperties;
  containerTransition?: Transition;
  segmentTransition?: Transition;
  speedReveal?: number;
  speedSegment?: number;
};

const presetVariants: Record<string, { container: Variants; item?: Variants }> = {
  'blur-sm': {
    container: {},
    item: {
      hidden: { opacity: 0, filter: 'blur(4px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
  },
  'fade-in-blur': {
    container: {},
    item: {
      hidden: { opacity: 0, filter: 'blur(8px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
  },
  scale: {
    container: {},
    item: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  fade: {
    container: {},
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  slide: {
    container: {},
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  },
};

export function TextEffect({
  children,
  per = 'word',
  as: Component = 'p',
  preset = 'fade',
  variants,
  className,
  delay = 0,
  trigger = true,
  onAnimationComplete,
  onAnimationStart,
  segmentWrapperClassName,
  style,
  containerTransition,
  segmentTransition,
  speedReveal = 1,
  speedSegment = 1,
}: TextEffectProps) {
  const finalVariants = useMemo(() => {
    if (variants) {
      return variants;
    }
    return presetVariants[preset] || presetVariants.fade;
  }, [variants, preset]);

  const segments = useMemo(() => {
    if (per === 'char') {
      return children.split('').map((char, index) => ({ text: char, index }));
    } else if (per === 'line') {
      return children.split('\n').map((line, index) => ({ text: line, index }));
    } else {
      // per === 'word'
      return children.split(/(\s+)/).map((word, index) => ({ text: word, index }));
    }
  }, [children, per]);

  const defaultItemTransition: Transition = {
    duration: 0.3 / speedSegment,
    ease: [0.4, 0, 0.2, 1],
    ...segmentTransition,
  };

  const defaultContainerTransition: Transition = {
    staggerChildren: 0.05 / speedReveal,
    delayChildren: delay,
    ...containerTransition,
  };

  if (!trigger) {
    const StaticComponent = Component as keyof JSX.IntrinsicElements;
    return (
      <StaticComponent className={className} style={style}>
        {children}
      </StaticComponent>
    );
  }

  // 使用 motion.div 作为容器，然后根据 as prop 设置样式
  const containerProps = {
    className,
    style,
    initial: 'hidden' as const,
    animate: 'visible' as const,
    variants: finalVariants.container,
    transition: defaultContainerTransition,
    onAnimationStart,
    onAnimationComplete,
  };

  // 根据 as prop 选择渲染方式
  if (Component === 'p') {
    return (
      <motion.p {...containerProps}>
        {segments.map((segment, index) => (
          <motion.span
            key={index}
            className={cn('inline-block', segmentWrapperClassName)}
            variants={finalVariants.item}
            transition={defaultItemTransition}
          >
            {segment.text}
          </motion.span>
        ))}
      </motion.p>
    );
  } else if (Component === 'h1') {
    return (
      <motion.h1 {...containerProps}>
        {segments.map((segment, index) => (
          <motion.span
            key={index}
            className={cn('inline-block', segmentWrapperClassName)}
            variants={finalVariants.item}
            transition={defaultItemTransition}
          >
            {segment.text}
          </motion.span>
        ))}
      </motion.h1>
    );
  } else if (Component === 'span') {
    return (
      <motion.span {...containerProps}>
        {segments.map((segment, index) => (
          <motion.span
            key={index}
            className={cn('inline-block', segmentWrapperClassName)}
            variants={finalVariants.item}
            transition={defaultItemTransition}
          >
            {segment.text}
          </motion.span>
        ))}
      </motion.span>
    );
  } else {
    // 对于其他标签，使用 motion.div 并设置 display 样式
    return (
      <motion.div {...containerProps} style={{ ...style, display: 'inline' }}>
        {segments.map((segment, index) => (
          <motion.span
            key={index}
            className={cn('inline-block', segmentWrapperClassName)}
            variants={finalVariants.item}
            transition={defaultItemTransition}
          >
            {segment.text}
          </motion.span>
        ))}
      </motion.div>
    );
  }
}

