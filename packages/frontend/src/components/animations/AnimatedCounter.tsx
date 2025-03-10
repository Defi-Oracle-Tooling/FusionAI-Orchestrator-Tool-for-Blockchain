import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  size = 'md',
  color = 'default',
  fontWeight = 'semibold',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Size mapping
  const sizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };
  
  // Color mapping
  const colorMap = {
    default: 'text-gray-800 dark:text-gray-200',
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-purple-600 dark:text-purple-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };
  
  // Font weight mapping
  const fontWeightMap = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;
    
    const startValue = displayValue;
    const endValue = value;
    const difference = endValue - startValue;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function: cubic-bezier(0.34, 1.56, 0.64, 1)
      const easeOutBack = (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      
      // Apply easing and calculate current value
      const easedProgress = progress < 1 ? easeOutBack(progress) : 1;
      const currentValue = startValue + difference * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };
    
    animationFrame = requestAnimationFrame(step);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  // Format the displayed value
  const formattedValue = displayValue.toFixed(decimals);
  
  return (
    <div className={`${sizeMap[size]} ${colorMap[color]} ${fontWeightMap[fontWeight]} counter-container`}>
      <span className="counter-prefix">{prefix}</span>
      <span className="counter-value">{formattedValue}</span>
      <span className="counter-suffix">{suffix}</span>
      
      {/* CSS for animations */}
      <style jsx>{`
        .counter-container {
          display: inline-flex;
          align-items: center;
        }
        
        .counter-value {
          position: relative;
          display: inline-block;
        }
        
        .counter-value::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: currentColor;
          transform: scaleX(0);
          opacity: 0.3;
          transition: transform 0.3s ease-out;
        }
        
        .counter-container:hover .counter-value::after {
          transform: scaleX(1);
        }
      `}</style>
    </div>
  );
};

export default AnimatedCounter;
