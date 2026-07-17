"use client";

import { useEffect, useRef } from "react";
import styles from "./FaseLobby.module.css";

interface FaseLobbyProps {
  sessaoId: string;
  isAdmin: boolean;
}

export const FaseLobby = ({ sessaoId, isAdmin }: FaseLobbyProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto play the audio when the component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Low volume for background music
      // Note: Browsers usually block autoplay unless the user has interacted with the page.
      // Since the Admin clicked "Criar Nova Sala" to get here, it should autoplay for them.
      // For participants who just land on the URL, they might need to click somewhere,
      // so we provide controls or they can just interact to unmute.
      audioRef.current.play().catch(e => console.log("Autoplay prevented by browser:", e));
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.presentationCard}>
        <div className={styles.logoContainer}>
          <span className={styles.icon} style={{ fontSize: '64px' }}>
            🎰
          </span>
          <h1 className={styles.title}>Bugzinho Retro</h1>
        </div>
        
        <p className={styles.subtitle}>
          Aguardando os jogadores sentarem à mesa...
        </p>

        <div className={styles.linkBox}>
          <p className={styles.linkText}>Compartilhe este link com a equipe:</p>
          <div className={styles.url}>
            {typeof window !== "undefined" ? window.location.href : ""}
          </div>
        </div>

        <div className={styles.loading}>
          <div className={styles.chip}></div>
          <div className={styles.chip} style={{ animationDelay: "0.2s" }}></div>
          <div className={styles.chip} style={{ animationDelay: "0.4s" }}></div>
        </div>
        
        {isAdmin && (
          <div className={styles.audioPlayer}>
            <p className={styles.audioLabel}>
              Som Ambiente <span style={{ marginLeft: '4px' }}>🎵</span>
            </p>
            <audio ref={audioRef} controls loop src="/casino-lounge.mp3" />
          </div>
        )}
      </div>
    </div>
  );
};
