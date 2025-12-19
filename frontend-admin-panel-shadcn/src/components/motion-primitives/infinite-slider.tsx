'use client';
import { useRef, useEffect, useState, cloneElement, isValidElement, type ReactNode } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'motion/react';
import { cn } from '@/lib/utils';

export type InfiniteSliderProps = {
  children: ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 100,
  speedOnHover,
  direction = 'horizontal',
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const x = useMotionValue(0);

  // 将 children 转换为数组
  const childrenArray = Array.isArray(children) ? children : [children];
  const validChildren = childrenArray.filter((child) => isValidElement(child));

  // 测量内容宽度
  useEffect(() => {
    if (!sliderRef.current || direction !== 'horizontal') return;

    const updateWidth = () => {
      if (sliderRef.current) {
        const firstChild = sliderRef.current.firstElementChild as HTMLElement;
        if (firstChild) {
          // 计算一组子元素的总宽度（包括 gap）
          const totalWidth = Array.from(sliderRef.current.children)
            .slice(0, validChildren.length)
            .reduce((sum, child, index) => {
              const element = child as HTMLElement;
              return sum + element.offsetWidth + (index < validChildren.length - 1 ? gap : 0);
            }, 0);
          setContentWidth(totalWidth);
        }
      }
    };

    // 延迟测量以确保 DOM 已渲染
    const timeoutId = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateWidth);
    };
  }, [children, gap, direction, validChildren.length]);

  // 动画循环
  useAnimationFrame((_t, delta) => {
    if (direction !== 'horizontal' || contentWidth === 0) return;

    const currentSpeed = isHovered && speedOnHover !== undefined ? speedOnHover : speed;
    const pixelsPerSecond = currentSpeed;
    const pixelsPerFrame = (pixelsPerSecond * delta) / 1000;
    const directionMultiplier = reverse ? -1 : 1;

    const currentX = x.get();
    const newX = currentX + pixelsPerFrame * directionMultiplier;

    // 当滚动到一组内容的末尾时，无缝重置到开始位置
    if (reverse) {
      if (newX <= -contentWidth) {
        x.set(0);
      } else {
        x.set(newX);
      }
    } else {
      if (newX >= contentWidth) {
        x.set(0);
      } else {
        x.set(newX);
      }
    }
  });

  return (
    <div
      className={cn('overflow-hidden w-full', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        ref={sliderRef}
        className={cn(
          'flex',
          direction === 'horizontal' ? 'flex-row' : 'flex-col',
          'w-fit'
        )}
        style={{
          x: direction === 'horizontal' ? x : 0,
          y: direction === 'vertical' ? x : 0,
          gap: `${gap}px`,
        }}
      >
        {/* 渲染两组子元素以实现无缝循环 */}
        {Array.from({ length: 2 }).map((_, groupIndex) =>
          validChildren.map((child, childIndex) => {
            const key = `group-${groupIndex}-child-${childIndex}`;
            return isValidElement(child)
              ? cloneElement(child, { key, ...(child.props as Record<string, unknown>) })
              : child;
          })
        )}
      </motion.div>
    </div>
  );
}

