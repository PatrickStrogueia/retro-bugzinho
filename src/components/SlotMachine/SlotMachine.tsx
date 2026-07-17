"use client";

import { useEffect, useState } from "react";
import styles from "./SlotMachine.module.css";
import { Club, Spade, Heart, Diamond, DiceThree } from "@phosphor-icons/react";

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
              <span><Club weight="fill" color="var(--casino-green)" /></span>
              <span><DiceThree weight="fill" color="#fff" /></span>
              <span><Spade weight="fill" color="var(--casino-gold)" /></span>
              <span><Heart weight="fill" color="var(--casino-red)" /></span>
              <span><Club weight="fill" color="var(--casino-green)" /></span>
            </div>
          </div>
          <div className={styles.reel}>
            <div className={styles.symbols} style={{ animationDelay: "0.2s" }}>
              <span><Heart weight="fill" color="var(--casino-red)" /></span>
              <span><Diamond weight="fill" color="#38bdf8" /></span>
              <span><Spade weight="fill" color="var(--casino-gold)" /></span>
              <span><DiceThree weight="fill" color="#fff" /></span>
              <span><Heart weight="fill" color="var(--casino-red)" /></span>
            </div>
          </div>
          <div className={styles.reel}>
            <div className={styles.symbols} style={{ animationDelay: "0.4s" }}>
              <span><Club weight="fill" color="var(--casino-green)" /></span>
              <span><DiceThree weight="fill" color="#fff" /></span>
              <span><Heart weight="fill" color="var(--casino-red)" /></span>
              <span><Diamond weight="fill" color="#38bdf8" /></span>
              <span><Club weight="fill" color="var(--casino-green)" /></span>
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
