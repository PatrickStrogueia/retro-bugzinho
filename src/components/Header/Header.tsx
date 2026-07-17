"use client";

import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logoLink}>
          <span className={styles.icon} style={{ fontSize: '28px' }}>
            🎰
          </span>
          <span className={styles.logoText}>Bugzinho</span>
        </Link>
        
        <nav className={styles.nav}>
          <div className={styles.status}>
            <span className={styles.statusDot}></span>
            <span>Sistema Online</span>
          </div>
        </nav>
      </div>
    </header>
  );
};
