import React, { useEffect, useRef } from 'react';

interface DataFlowAnimationProps {
  width?: number;
  height?: number;
  color?: string;
  speed?: 'slow' | 'medium' | 'fast';
  density?: 'low' | 'medium' | 'high';
  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
  className?: string;
}

const DataFlowAnimation: React.FC<DataFlowAnimationProps> = ({
  width = 200,
  height = 80,
  color = '#3b82f6', // blue-500
  speed = 'medium',
  density = 'medium',
  direction = 'left-to-right',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Speed mapping
  const speedMap = {
    slow: 1,
    medium: 2,
    fast: 3,
  };
  
  // Density mapping (number of particles)
  const densityMap = {
    low: 15,
    medium: 30,
    high: 50,
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Create particles
    const particleCount = densityMap[density];
    const particles: any[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: 0,
        speedY: 0,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    
    // Set direction-based speeds
    particles.forEach(p => {
      const baseSpeed = (Math.random() * 0.5 + 0.5) * speedMap[speed];
      
      switch (direction) {
        case 'left-to-right':
          p.speedX = baseSpeed;
          p.speedY = 0;
          p.x = 0;
          break;
        case 'right-to-left':
          p.speedX = -baseSpeed;
          p.speedY = 0;
          p.x = width;
          break;
        case 'top-to-bottom':
          p.speedX = 0;
          p.speedY = baseSpeed;
          p.y = 0;
          break;
        case 'bottom-to-top':
          p.speedX = 0;
          p.speedY = -baseSpeed;
          p.y = height;
          break;
      }
    });
    
    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw particles
      particles.forEach(p => {
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Reset position when out of bounds
        if (direction === 'left-to-right' && p.x > width) {
          p.x = 0;
          p.y = Math.random() * height;
          p.size = Math.random() * 3 + 1;
          p.opacity = Math.random() * 0.5 + 0.3;
        } else if (direction === 'right-to-left' && p.x < 0) {
          p.x = width;
          p.y = Math.random() * height;
          p.size = Math.random() * 3 + 1;
          p.opacity = Math.random() * 0.5 + 0.3;
        } else if (direction === 'top-to-bottom' && p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
          p.size = Math.random() * 3 + 1;
          p.opacity = Math.random() * 0.5 + 0.3;
        } else if (direction === 'bottom-to-top' && p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
          p.size = Math.random() * 3 + 1;
          p.opacity = Math.random() * 0.5 + 0.3;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(')', `, ${p.opacity})`).replace('rgb', 'rgba');
        ctx.fill();
        
        // Draw trail
        if (p.size > 1.5) {
          const trailLength = direction === 'left-to-right' || direction === 'right-to-left' ? 20 : 15;
          const trailX = direction === 'left-to-right' ? p.x - trailLength : direction === 'right-to-left' ? p.x + trailLength : p.x;
          const trailY = direction === 'top-to-bottom' ? p.y - trailLength : direction === 'bottom-to-top' ? p.y + trailLength : p.y;
          
          const gradient = ctx.createLinearGradient(
            p.x, p.y,
            trailX, trailY
          );
          
          gradient.addColorStop(0, color.replace(')', `, ${p.opacity})`).replace('rgb', 'rgba'));
          gradient.addColorStop(1, color.replace(')', `, 0)`).replace('rgb', 'rgba'));
          
          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = p.size / 2;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(trailX, trailY);
          ctx.stroke();
        }
      });
      
      // Connect nearby particles with lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30) {
            ctx.beginPath();
            ctx.strokeStyle = color.replace(')', `, ${0.1 * (1 - distance / 30)})`).replace('rgb', 'rgba');
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    // Start animation
    const animationId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
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
