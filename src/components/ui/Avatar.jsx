import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circular',
  className,
  fallbackClassName,
  ...props
}) => {
  const initials = useMemo(() => {
    if (!name) return '';
    
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 0) return '';
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }, [name]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  const variantClasses = {
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none',
  };

  const baseClasses = 'inline-flex items-center justify-center flex-shrink-0 overflow-hidden';
  
  const avatarClasses = clsx(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  const fallbackClasses = clsx(
    'bg-primary-100 text-primary-700 font-medium',
    fallbackClassName
  );

  if (src) {
    return (
      <div className={avatarClasses} {...props}>
        <img 
          src={src} 
          alt={alt || name || 'avatar'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
        <div className={`${fallbackClasses} w-full h-full items-center justify-center`} style={{ display: 'none' }}>
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div className={`${avatarClasses} ${fallbackClasses}`} {...props}>
      {initials}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  variant: PropTypes.oneOf(['circular', 'rounded', 'square']),
  className: PropTypes.string,
  fallbackClassName: PropTypes.string,
};

export default Avatar; 