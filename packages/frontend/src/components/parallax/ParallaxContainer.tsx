import React, { ReactNode } from 'react';

interface ParallaxContainerProps {
  children: ReactNode;
  perspective?: number;
  className?: string;
}

const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  perspective = 1000,
  className = '',
}) => {
  return (
    <div 
      className={`parallax-container ${className}`}
      style={{ 
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxContainer;
