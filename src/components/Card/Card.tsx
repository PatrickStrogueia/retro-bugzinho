import React from 'react';
import styles from './Card.module.css';

export type CardType = string;

interface CardProps {
  type?: CardType;
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ type = 'default', children, className }: CardProps) => {
  const cardClass = `${styles.card} ${styles[type]} ${className || ''}`;
  
  return (
    <div className={cardClass}>
      {children}
    </div>
  );
};
