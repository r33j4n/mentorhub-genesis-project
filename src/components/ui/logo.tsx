import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'white' | 'gradient';
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = true,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const textColors = {
    default: 'text-teal-700',
    white: 'text-white',
    gradient: 'text-teal-700'
  };

  return (
    <div className={`flex items-center gap-3 ${className} hover:scale-105 transition-transform duration-300`}>
      <div className={`${sizeClasses[size]} flex-shrink-0 hover:rotate-3 transition-transform duration-300`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Perfect circle outline */}
          <circle 
            cx="20" 
            cy="20" 
            r="18" 
            fill="none" 
            stroke="#0F766E" 
            strokeWidth="2"
          />
          
          {/* Outline "M" */}
          <path 
            d="M12 26 L16 8 L20 20 L24 8 L28 26" 
            stroke="#0F766E" 
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} ${textColors[variant]} tracking-wide`}>
          MENTORSES
        </span>
      )}
    </div>
  );
}; 