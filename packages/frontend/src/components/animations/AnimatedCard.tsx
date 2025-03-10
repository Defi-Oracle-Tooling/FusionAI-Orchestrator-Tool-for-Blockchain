import React, { useState } from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'border' | 'scale' | 'none';
  clickEffect?: 'ripple' | 'press' | 'none';
  borderColor?: string;
  glowColor?: string;
  transitionSpeed?: 'fast' | 'medium' | 'slow';
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  hoverEffect = 'lift',
  clickEffect = 'ripple',
  borderColor = 'rgba(59, 130, 246, 0.5)', // blue-500 with opacity
  glowColor = 'rgba(59, 130, 246, 0.3)', // blue-500 with opacity
  transitionSpeed = 'medium',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [rippleEffect, setRippleEffect] = useState<{
    x: number;
    y: number;
    size: number;
    opacity: number;
    active: boolean;
  }>({
    x: 0,
    y: 0,
    size: 0,
    opacity: 0,
    active: false,
  });

  // Transition speed mapping
  const transitionSpeedMap = {
    fast: '0.15s',
    medium: '0.3s',
    slow: '0.5s',
  };

  // Handle mouse down for click effects
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickEffect === 'press') {
      setIsPressed(true);
    } else if (clickEffect === 'ripple') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      setRippleEffect({
        x,
        y,
        size,
        opacity: 0.5,
        active: true,
      });

      // Fade out ripple
      setTimeout(() => {
        setRippleEffect(prev => ({ ...prev, opacity: 0 }));
      }, 50);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRippleEffect(prev => ({ ...prev, active: false }));
      }, 500);
    }
  };

  // Handle mouse up for click effects
  const handleMouseUp = () => {
    if (clickEffect === 'press') {
      setIsPressed(false);
    }
  };

  // Generate hover effect classes
  const getHoverEffectClasses = () => {
    switch (hoverEffect) {
      case 'lift':
        return 'hover:-translate-y-1 hover:shadow-lg';
      case 'glow':
        return 'hover:shadow-glow';
      case 'border':
        return 'hover:border-opacity-100';
      case 'scale':
        return 'hover:scale-105';
      case 'none':
      default:
        return '';
    }
  };

  // Generate click effect classes
  const getClickEffectClasses = () => {
    if (clickEffect === 'press' && isPressed) {
      return 'scale-98 shadow-inner';
    }
    return '';
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 
        shadow-md border border-opacity-30 
        ${getHoverEffectClasses()} 
        ${getClickEffectClasses()} 
        ${className}
      `}
      style={{
        borderColor: borderColor,
        transition: `all ${transitionSpeedMap[transitionSpeed]} ease-in-out`,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => clickEffect === 'press' && setIsPressed(false)}
    >
      {/* Ripple effect */}
      {rippleEffect.active && clickEffect === 'ripple' && (
        <div
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: rippleEffect.x - rippleEffect.size / 2,
            top: rippleEffect.y - rippleEffect.size / 2,
            width: rippleEffect.size,
            height: rippleEffect.size,
            opacity: rippleEffect.opacity,
            transform: 'scale(0)',
            animation: 'ripple-animation 0.5s ease-out forwards',
          }}
        />
      )}

      {/* Glow effect overlay */}
      {hoverEffect === 'glow' && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 pointer-events-none transition-opacity rounded-lg"
          style={{
            boxShadow: `0 0 15px 3px ${glowColor}`,
            transition: `opacity ${transitionSpeedMap[transitionSpeed]} ease-in-out`,
          }}
        />
      )}

      {/* Card content */}
      <div className="relative z-10">{children}</div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes ripple-animation {
          0% {
            transform: scale(0);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        .scale-98 {
          transform: scale(0.98);
        }

        .shadow-glow {
          box-shadow: 0 0 15px 3px ${glowColor};
        }
      `}</style>
    </div>
  );
};

export default AnimatedCard;
