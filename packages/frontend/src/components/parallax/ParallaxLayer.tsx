import React, { ReactNode } from 'react';

interface ParallaxLayerProps {
  children: ReactNode;
  depth?: number;
  className?: string;
  speed?: number;
}

const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  depth = 0,
  className = '',
  speed = 1,
}) => {
  return (
    <div 
      className={`parallax-layer ${className}`}
      style={{ 
        transform: `translateZ(${depth * -10}px) scale(${1 + depth * 0.1})`,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: depth !== 0 ? 'none' : 'auto',
        transition: `transform ${0.2 * speed}s ease-out`,
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxLayer;
