'use client';
import { type JSX, useEffect, useState, useRef } from 'react';
import { motion, type MotionProps } from 'motion/react';

export type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: React.ElementType;
  className?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
} & MotionProps;

const defaultChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  as: Component = 'p',
  trigger = true,
  onScrambleComplete,
  ...props
}: TextScrambleProps) {
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements
  );
  const [displayText, setDisplayText] = useState(children);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const text = children;

  useEffect(() => {
    // 如果 trigger 为 false，直接显示文本
    if (!trigger) {
      setDisplayText(text);
      return;
    }

    // 清理之前的 interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 重置显示文本为初始状态（显示随机字符开始）
    setDisplayText('');

    const steps = duration / speed;
    let step = 0;

    // 延迟一小段时间后开始动画，确保初始状态可见
    const timeoutId = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        let scrambled = '';
        const progress = step / steps;

        for (let i = 0; i < text.length; i++) {
          if (text[i] === ' ') {
            scrambled += ' ';
            continue;
          }

          if (progress * text.length > i) {
            scrambled += text[i];
          } else {
            scrambled +=
              characterSet[Math.floor(Math.random() * characterSet.length)];
          }
        }

        setDisplayText(scrambled);
        step++;

        if (step > steps) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setDisplayText(text);
          onScrambleComplete?.();
        }
      }, speed * 1000);
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearTimeout(timeoutId);
    };
  }, [trigger, duration, speed, text, characterSet, onScrambleComplete]);

  return (
    <MotionComponent className={className} {...props}>
      {displayText}
    </MotionComponent>
  );
}

