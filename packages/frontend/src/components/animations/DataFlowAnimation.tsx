import React, { useEffect, useRef } from 'react';

interface DataFlowAnimationProps {
  width: number;
  height: number;
  color?: string;
  speed?: 'slow' | 'medium' | 'fast';
  density?: 'low' | 'medium' | 'high';
  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
  className?: string;
}

const DataFlowAnimation: React.FC<DataFlowAnimationProps> = ({
  width,
  height,
  color = '#3b82f6',
  speed = 'medium',
  density = 'medium',
  direction = 'left-to-right',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Configure animation parameters
    const speedMap = {
      slow: 0.5,
      medium: 1,
      fast: 2,
    };
    
    const densityMap = {
      low: 5,
      medium: 10,
      high: 20,
    };
    
    const speedFactor = speedMap[speed];
    const particleCount = densityMap[density];
    
    // Create particles
    const particles: {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speed: (Math.random() * 1 + 0.5) * speedFactor,
        opacity: Math.random() * 0.5 + 0.3,
      };
      particles.push(particle);
    }
    
    // Animation loop
    let animationFrameId: number;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw flow lines
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      
      const lineCount = 3;
      const lineSpacing = height / (lineCount + 1);
      
      for (let i = 0; i < lineCount; i++) {
        const y = lineSpacing * (i + 1);
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        
        // Create wavy line
        for (let x = 0; x < width; x += 10) {
          const amplitude = 3;
          const frequency = 0.02;
          const wave = Math.sin(x * frequency + Date.now() * 0.001) * amplitude;
          ctx.lineTo(x, y + wave);
        }
        
        ctx.stroke();
      }
      
      // Draw particles
      ctx.globalAlpha = 1;
      
      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = particle.opacity;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Update particle position based on direction
        switch (direction) {
          case 'left-to-right':
            particle.x += particle.speed;
            if (particle.x > width) {
              particle.x = 0;
              particle.y = Math.random() * height;
            }
            break;
          case 'right-to-left':
            particle.x -= particle.speed;
            if (particle.x < 0) {
              particle.x = width;
              particle.y = Math.random() * height;
            }
            break;
          case 'top-to-bottom':
            particle.y += particle.speed;
            if (particle.y > height) {
              particle.y = 0;
              particle.x = Math.random() * width;
            }
            break;
          case 'bottom-to-top':
            particle.y -= particle.speed;
            if (particle.y < 0) {
              particle.y = height;
              particle.x = Math.random() * width;
            }
            break;
        }
      });
      
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, color, speed, density, direction]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`data-flow-animation ${className}`}
      style={{ width, height }}
    />
  );
};

export default DataFlowAnimation;
