import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const CustomButton: React.FC<ButtonProps> = ({
  loading = false,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-semibold rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
       bg-[#136fb0] hover:bg-[#bdeafe]
      text-white hover:text-[#136fb0] shadow-lg hover:shadow-xl focus:ring-cyan-400
      transform hover:scale-105 active:scale-95
    `,
    secondary: `
      bg-transparent border-2 border-cyan-400 text-cyan-400
      hover:bg-cyan-400 hover:text-purple-900 focus:ring-cyan-400
    `
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-md',
    lg: 'px-8 py-4 text-md'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 animate-spin" size={size === 'sm' ? 16 : 20} />
      )}
      {children}
    </button>
  );
};