import React, { useEffect, useState } from 'react';

interface AnimatedProgressBarProps {
  value: number;
  maxValue?: number;
  height?: number;
  width?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  valueFormat?: 'percentage' | 'fraction' | 'value';
  animated?: boolean;
  striped?: boolean;
  label?: string;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  maxValue = 100,
  height = 8,
  width = '100%',
  color = 'primary',
  showValue = true,
  valueFormat = 'percentage',
  animated = true,
  striped = false,
  label,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Color mapping
  const colorMap = {
    primary: {
      bg: 'bg-blue-600',
      text: 'text-blue-700',
      light: 'bg-blue-100',
    },
    secondary: {
      bg: 'bg-purple-600',
      text: 'text-purple-700',
      light: 'bg-purple-100',
    },
    success: {
      bg: 'bg-green-600',
      text: 'text-green-700',
      light: 'bg-green-100',
    },
    warning: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700',
      light: 'bg-yellow-100',
    },
    danger: {
      bg: 'bg-red-600',
      text: 'text-red-700',
      light: 'bg-red-100',
    },
  };
  
  // Calculate percentage
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  
  // Animate value on mount and when value changes
  useEffect(() => {
    if (animated) {
      setDisplayValue(0);
      const timeout = setTimeout(() => {
        setDisplayValue(percentage);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);
  
  // Format the displayed value
  const getFormattedValue = () => {
    switch (valueFormat) {
      case 'percentage':
        return `${Math.round(percentage)}%`;
      case 'fraction':
        return `${value}/${maxValue}`;
      case 'value':
        return `${value}`;
      default:
        return `${Math.round(percentage)}%`;
    }
  };
  
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
          {showValue && (
            <span className={`text-xs font-medium ${colorMap[color].text}`}>
              {getFormattedValue()}
            </span>
          )}
        </div>
      )}
      
      <div 
        className={`w-full ${colorMap[color].light} rounded-full overflow-hidden`}
        style={{ height: `${height}px`, width }}
      >
        <div
          className={`${colorMap[color].bg} ${striped ? 'progress-bar-striped' : ''} ${animated && striped ? 'progress-bar-animated' : ''} rounded-full h-full transition-all duration-500 ease-out`}
          style={{ 
            width: `${displayValue}%`,
            transition: animated ? 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
        >
          {/* Animated particles for non-striped bars */}
          {animated && !striped && (
            <div className="relative w-full h-full overflow-hidden">
              <div className="absolute inset-0 particles-container">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute bg-white opacity-30 rounded-full particle"
                    style={{
                      width: `${Math.random() * 10 + 5}px`,
                      height: `${Math.random() * 10 + 5}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${Math.random() * 3 + 2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx global>{`
        .progress-bar-striped {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 1rem 1rem;
        }
        
        .progress-bar-animated {
          animation: progress-bar-stripes 1s linear infinite;
        }
        
        @keyframes progress-bar-stripes {
          from {
            background-position: 1rem 0;
          }
          to {
            background-position: 0 0;
          }
        }
        
        .particle {
          animation: float-particle linear infinite;
          opacity: 0;
        }
        
        @keyframes float-particle {
          0% {
            transform: translateX(-10px) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateX(calc(100% + 10px)) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedProgressBar;
