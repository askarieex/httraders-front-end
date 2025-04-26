import React from 'react';
import { motion } from 'framer-motion';

/**
 * Button component with various variants and sizes
 * 
 * @param {Object} props Component props
 * @param {ReactNode} props.children Child elements to render inside the button
 * @param {string} props.className Additional CSS classes
 * @param {string} props.variant Button variant (primary, secondary, outline, danger, success)
 * @param {string} props.size Button size (sm, md, lg)
 * @param {boolean} props.disabled Whether the button is disabled
 * @param {boolean} props.loading Whether the button is in loading state
 * @param {boolean} props.fullWidth Whether the button should take full width
 * @param {function} props.onClick Click handler for the button
 * @param {ReactNode} props.leftIcon Icon to display on the left
 * @param {ReactNode} props.rightIcon Icon to display on the right
 * @param {string} props.type Button type attribute
 * @returns {ReactElement} The rendered Button component
 */
const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}) => {
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-300',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-300',
    outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-100 text-neutral-700 focus:ring-neutral-200',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-red-300',
    success: 'bg-success text-white hover:bg-green-600 focus:ring-green-300',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700 focus:ring-neutral-200',
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      type={type}
      className={`
        inline-flex items-center justify-center 
        rounded font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
};

export default Button; 