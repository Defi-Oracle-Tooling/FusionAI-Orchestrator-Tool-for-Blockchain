import React from 'react';

interface AnimatedProgressBarProps {
  value: number;
  maxValue: number;
  height?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  valueFormat?: 'percentage' | 'raw';
  className?: string;
  animated?: boolean;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  maxValue,
  height = 8,
  color = 'primary',
  showValue = false,
  valueFormat = 'percentage',
  className = '',
  animated = true,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  const getColorClasses = () => {
    switch (color) {
      case 'primary': return 'bg-blue-500';
      case 'secondary': return 'bg-purple-500';
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };
  
  const getFormattedValue = () => {
    if (valueFormat === 'percentage') {
      return `${Math.round(percentage)}%`;
    }
    return `${value} / ${maxValue}`;
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div 
        className="w-full bg-gray-700 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div 
          className={`${getColorClasses()} ${animated ? 'transition-all duration-500 ease-out' : ''}`}
          style={{ 
            width: `${percentage}%`,
            height: '100%',
            backgroundImage: animated ? 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)' : 'none',
            backgroundSize: animated ? '1rem 1rem' : 'auto',
            animation: animated ? 'progress-bar-stripes 1s linear infinite' : 'none',
          }}
        />
      </div>
      {showValue && (
        <div className="text-xs text-right mt-1">{getFormattedValue()}</div>
      )}
      
      <style jsx>{`
        @keyframes progress-bar-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedProgressBar;
