import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * Card component for displaying content in a styled container
 * 
 * @param {Object} props Component props
 * @param {string} props.title Card title text
 * @param {ReactNode} props.icon Icon component to display
 * @param {string} props.iconBg Background color for the icon
 * @param {ReactNode} props.children Child elements to render inside the card
 * @param {string} props.className Additional CSS classes
 * @param {function} props.onClick Click handler for the card
 * @param {boolean} props.loading Whether the card is in loading state
 * @param {boolean} props.hoverable Whether the card should have hover effects
 * @param {boolean} props.noPadding Whether to remove padding inside the card
 * @returns {ReactElement} The rendered Card component
 */
const Card = ({ 
  title, 
  icon, 
  iconBg = 'bg-primary-500',
  children, 
  className = '',
  onClick,
  loading = false,
  hoverable = false,
  noPadding = false
}) => {
  const { theme } = useTheme();
  
  // Card variants for animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div 
      className={`
        ${theme === 'dark' ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} 
        border rounded-lg shadow-card 
        ${hoverable ? 'transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1' : ''} 
        ${noPadding ? '' : 'p-5'}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
    >
      {loading ? (
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {(title || icon) && (
            <div className="flex items-center mb-4">
              {icon && (
                <div className={`${iconBg} text-white p-2 rounded-lg mr-3`}>
                  {icon}
                </div>
              )}
              {title && (
                <h2 className="text-lg font-semibold">{title}</h2>
              )}
            </div>
          )}
          <div className={`${(title || icon) ? 'mt-3' : ''}`}>
            {children}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Card; 