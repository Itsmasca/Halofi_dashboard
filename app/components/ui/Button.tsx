'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'px-5 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300';

  const variants = {
    primary: `
      bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none
      hover:translate-y-[-2px] hover:shadow-[0_10px_20px_rgba(102,126,234,0.4)]
      active:translate-y-0
      disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
    `,
    secondary: `
      bg-white/95 text-[#667eea] border-none
      shadow-[0_5px_15px_rgba(0,0,0,0.2)]
      hover:translate-y-[-2px] hover:shadow-[0_7px_20px_rgba(0,0,0,0.3)]
    `,
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
