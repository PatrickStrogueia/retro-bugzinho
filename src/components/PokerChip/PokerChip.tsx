import React from 'react';
import styles from './PokerChip.module.css';

interface PokerChipProps {
  value?: number;
  onClick?: () => void;
  className?: string;
}

export const PokerChip = ({ value = 1, onClick, className }: PokerChipProps) => {
  return (
    <button 
      className={`${styles.chip} ${className || ''}`} 
      onClick={onClick}
      aria-label={`Votar com peso ${value}`}
    >
      <div className={styles.innerRing}>
        <div className={styles.centerDot}>
          <span className={styles.value}>{value}</span>
        </div>
      </div>
    </button>
  );
};
