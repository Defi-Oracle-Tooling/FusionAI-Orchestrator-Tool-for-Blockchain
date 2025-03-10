import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  size = 'md',
  color = 'primary',
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    const change = endValue - startValue;
    
    if (change === 0) return;
    
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function: easeOutQuad
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      
      const currentValue = startValue + change * easedProgress;
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(endValue);
      }
    };
    
    requestAnimationFrame(animateCount);
  }, [value, duration]);
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-lg font-bold';
      case 'md':
      default: return 'text-base';
    }
  };
  
  const getColorClasses = () => {
    switch (color) {
      case 'primary': return 'text-blue-500';
      case 'secondary': return 'text-purple-500';
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'danger': return 'text-red-500';
      default: return '';
    }
  };
  
  const formattedValue = displayValue.toFixed(decimals);
  
  return (
    <span className={`${getSizeClasses()} ${getColorClasses()} ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default AnimatedCounter;
