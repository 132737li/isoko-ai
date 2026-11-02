import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({ children, variant = 'primary', isLoading, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === 'primary' && "bg-teal-600 text-white hover:bg-teal-700",
        variant === 'secondary' && "bg-gray-200 text-gray-800 hover:bg-gray-300",
        variant === 'danger' && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? "Chargement..." : children}
    </button>
  );
}