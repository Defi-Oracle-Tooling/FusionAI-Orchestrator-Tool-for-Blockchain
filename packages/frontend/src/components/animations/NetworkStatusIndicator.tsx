import React from 'react';

interface NetworkStatusIndicatorProps {
  status: 'healthy' | 'degraded' | 'unhealthy';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'degraded': return 'Degraded';
      case 'unhealthy': return 'Unhealthy';
      default: return 'Unknown';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-2 h-2';
      case 'lg': return 'w-4 h-4';
      case 'md':
      default: return 'w-3 h-3';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${getSizeClasses()} rounded-full ${getStatusColor()} animate-pulse`} />
      {showLabel && (
        <span className="ml-2 text-xs">{getStatusLabel()}</span>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
