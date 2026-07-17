"use client";

import { useEffect, useState } from "react";
import styles from "./SlotMachine.module.css";

export const SlotMachine = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.slotMachine}>
        <div className={styles.reels}>
          <div className={styles.reel}>
            <div className={styles.symbols}>
              <span>♣️</span>
              <span>🎲</span>
              <span>♠️</span>
              <span>♥️</span>
              <span>♣️</span>
            </div>
          </div>
          <div className={styles.reel}>
            <div className={styles.symbols} style={{ animationDelay: "0.2s" }}>
              <span>♥️</span>
              <span>♦️</span>
              <span>♠️</span>
              <span>🎲</span>
              <span>♥️</span>
            </div>
          </div>
          <div className={styles.reel}>
            <div className={styles.symbols} style={{ animationDelay: "0.4s" }}>
              <span>♣️</span>
              <span>🎲</span>
              <span>♥️</span>
              <span>♦️</span>
              <span>♣️</span>
            </div>
          </div>
        </div>
        <div className={styles.handle}>
          <div className={styles.knob}></div>
        </div>
      </div>
      
      <div className={styles.message}>
        <h3 style={{ color: "var(--casino-gold)" }}>O Dealer IA está embaralhando as cartas{dots}</h3>
        <p style={{ color: "var(--text-secondary)" }}>Aguarde enquanto os temas são agrupados magicamente.</p>
      </div>
    </div>
  );
};
