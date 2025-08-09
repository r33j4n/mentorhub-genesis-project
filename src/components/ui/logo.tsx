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
    default: 'text-gray-900',
    white: 'text-white',
    gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
  };

  return (
    <div className={`flex items-center gap-3 ${className} hover:scale-105 transition-transform duration-300`}>
      <div className={`${sizeClasses[size]} flex-shrink-0 hover:rotate-3 transition-transform duration-300`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#6366F1', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#FFFFFF', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#F3F4F6', stopOpacity: 1}} />
            </linearGradient>
          </defs>
          
          <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" stroke="#1E40AF" strokeWidth="1.5"/>
          
          {/* Mentor figure (larger and clearer) */}
          <circle cx="20" cy="12" r="4.5" fill="url(#innerGradient)"/>
          <path d="M15.5 18 L24.5 18 L22.5 25 L17.5 25 Z" fill="url(#innerGradient)"/>
          
          {/* Mentee figure (smaller but clearer) */}
          <circle cx="20" cy="28" r="3" fill="url(#innerGradient)"/>
          <path d="M17 30.5 L23 30.5 L21.5 35 L18.5 35 Z" fill="url(#innerGradient)"/>
          
          {/* Connection line (thicker and more visible) */}
          <line x1="20" y1="16.5" x2="20" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          
          {/* Growth arrow (larger and clearer) */}
          <path d="M28 20 L34 20 L31 17 M34 20 L31 23" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Decorative dots (larger and more visible) */}
          <circle cx="7" cy="14" r="1.2" fill="white" opacity="0.7"/>
          <circle cx="33" cy="26" r="1.2" fill="white" opacity="0.7"/>
          <circle cx="9" cy="31" r="1" fill="white" opacity="0.5"/>
        </svg>
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} ${textColors[variant]}`}>
          MentorSES
        </span>
      )}
    </div>
  );
}; 