import React, { useState, useEffect } from 'react';

interface NetworkStatusIndicatorProps {
  status: 'healthy' | 'degraded' | 'unhealthy';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
  pulseEffect?: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  status,
  size = 'md',
  label,
  showLabel = true,
  pulseEffect = true,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Size mapping
  const sizeMap = {
    sm: { circle: 8, container: 16, fontSize: 'text-xs' },
    md: { circle: 12, container: 24, fontSize: 'text-sm' },
    lg: { circle: 16, container: 32, fontSize: 'text-base' },
  };
  
  // Color mapping
  const colorMap = {
    healthy: {
      fill: 'fill-green-500',
      stroke: 'stroke-green-600',
      pulse: 'rgba(34, 197, 94, 0.5)', // green-500 with opacity
      text: 'text-green-600',
    },
    degraded: {
      fill: 'fill-yellow-400',
      stroke: 'stroke-yellow-500',
      pulse: 'rgba(250, 204, 21, 0.5)', // yellow-400 with opacity
      text: 'text-yellow-600',
    },
    unhealthy: {
      fill: 'fill-red-500',
      stroke: 'stroke-red-600',
      pulse: 'rgba(239, 68, 68, 0.5)', // red-500 with opacity
      text: 'text-red-600',
    },
  };
  
  // Animation effect
  useEffect(() => {
    if (pulseEffect) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1500);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [pulseEffect]);
  
  // Display label based on status if not provided
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative" style={{ width: sizeMap[size].container, height: sizeMap[size].container }}>
        {/* Static circle */}
        <svg
          width={sizeMap[size].container}
          height={sizeMap[size].container}
          viewBox={`0 0 ${sizeMap[size].container} ${sizeMap[size].container}`}
          className="absolute inset-0"
        >
          <circle
            cx={sizeMap[size].container / 2}
            cy={sizeMap[size].container / 2}
            r={sizeMap[size].circle}
            className={`${colorMap[status].fill} ${colorMap[status].stroke} stroke-1 transition-all duration-300`}
          />
        </svg>
        
        {/* Animated pulse effect */}
        {pulseEffect && (
          <svg
            width={sizeMap[size].container}
            height={sizeMap[size].container}
            viewBox={`0 0 ${sizeMap[size].container} ${sizeMap[size].container}`}
            className="absolute inset-0"
          >
            <circle
              cx={sizeMap[size].container / 2}
              cy={sizeMap[size].container / 2}
              r={sizeMap[size].circle}
              fill="none"
              className={`${colorMap[status].stroke} opacity-0`}
              style={{
                animation: isAnimating ? 'pulse 1.5s ease-out' : 'none',
              }}
            />
          </svg>
        )}
        
        {/* Data flow animation for healthy status */}
        {status === 'healthy' && (
          <svg
            width={sizeMap[size].container}
            height={sizeMap[size].container}
            viewBox={`0 0 ${sizeMap[size].container} ${sizeMap[size].container}`}
            className="absolute inset-0"
          >
            <circle
              cx={sizeMap[size].container / 2}
              cy={sizeMap[size].container / 2}
              r={sizeMap[size].circle * 0.6}
              className="fill-white opacity-70"
              style={{
                animation: 'dataFlow 2s infinite',
              }}
            />
          </svg>
        )}
      </div>
      
      {showLabel && (
        <span className={`${colorMap[status].text} ${sizeMap[size].fontSize} font-medium`}>
          {displayLabel}
        </span>
      )}
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            r: ${sizeMap[size].circle};
            opacity: 0.8;
            stroke-width: 1;
          }
          100% {
            r: ${sizeMap[size].circle * 2};
            opacity: 0;
            stroke-width: 0;
          }
        }
        
        @keyframes dataFlow {
          0%, 100% {
            opacity: 0;
            r: ${sizeMap[size].circle * 0.3};
          }
          50% {
            opacity: 0.7;
            r: ${sizeMap[size].circle * 0.6};
          }
        }
      `}</style>
    </div>
  );
};

export default NetworkStatusIndicator;
