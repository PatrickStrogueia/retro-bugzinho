import React, { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold';
  children: React.ReactNode;
  href?: string;
}

export const Button = ({ variant = 'primary', children, className, href, ...props }: ButtonProps) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${className || ''}`;
  
  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        {children}
      </Link>
    );
  }
  
  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

