import React, { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'none';
  clickEffect?: 'press' | 'none';
  className?: string;
  borderColor?: string;
  glowColor?: string;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hoverEffect = 'none',
  clickEffect = 'none',
  className = '',
  borderColor = 'rgba(59, 130, 246, 0.5)',
  glowColor = 'rgba(59, 130, 246, 0.3)',
}) => {
  const getHoverEffectClasses = () => {
    switch (hoverEffect) {
      case 'lift':
        return 'transition-transform duration-200 hover:-translate-y-1';
      case 'glow':
        return 'transition-shadow duration-200';
      case 'scale':
        return 'transition-transform duration-200 hover:scale-105';
      case 'none':
      default:
        return '';
    }
  };
  
  const getClickEffectClasses = () => {
    switch (clickEffect) {
      case 'press':
        return 'active:scale-95 transition-transform';
      case 'none':
      default:
        return '';
    }
  };
  
  const getHoverStyles = () => {
    if (hoverEffect === 'glow') {
      return {
        boxShadow: `0 0 15px ${glowColor}`,
      };
    }
    return {};
  };
  
  return (
    <div
      className={`animated-card ${getHoverEffectClasses()} ${getClickEffectClasses()} ${className}`}
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        transition: 'all 0.2s ease-in-out',
        ...(hoverEffect === 'glow' ? { ':hover': getHoverStyles() } : {}),
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
