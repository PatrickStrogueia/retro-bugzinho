"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./Timer.module.css";

interface TimerState {
  status: "IDLE" | "RUNNING" | "PAUSED";
  endsAt: number | null;
  duration: number; // original duration in seconds
  timeLeft: number; // when paused
}

interface TimerProps {
  sessaoId: string;
  isAdmin: boolean;
}

export const Timer = ({ sessaoId, isAdmin }: TimerProps) => {
  const [timerState, setTimerState] = useState<TimerState>({ status: "IDLE", endsAt: null, duration: 0, timeLeft: 0 });
  const [displayTime, setDisplayTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const hasPlayedRef = useRef(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    // Sound beep
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    
    const fetchState = async () => {
      const { data, error } = await supabase.from("sessoes").select("timer_state").eq("id", sessaoId).single();
      
      if (error && (error.code === "PGRST204" || error.code === "42703")) {
        setDbError(true);
      } else if (data?.timer_state) {
        setTimerState(data.timer_state as TimerState);
      }
    };
    fetchState();

    const channel = supabase
      .channel(`sessao_timer_${sessaoId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessoes", filter: `id=eq.${sessaoId}` },
        (payload) => {
          if (payload.new.timer_state) {
            setTimerState(payload.new.timer_state as TimerState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId]);

  useEffect(() => {
    if (timerState.status === "IDLE") {
      setDisplayTime(0);
      setIsFlashing(false);
      hasPlayedRef.current = false;
      return;
    }

    if (timerState.status === "PAUSED") {
      setDisplayTime(timerState.timeLeft);
      setIsFlashing(false);
      return;
    }

    if (timerState.status === "RUNNING" && timerState.endsAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const left = Math.max(0, Math.floor((timerState.endsAt! - now) / 1000));
        setDisplayTime(left);

        if (left === 0) {
          setIsFlashing(true);
          if (!hasPlayedRef.current) {
            audioRef.current?.play().catch(e => console.error("Audio play blocked", e));
            hasPlayedRef.current = true;
          }
        } else {
          setIsFlashing(false);
          hasPlayedRef.current = false;
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [timerState]);

  const updateGlobalTimer = async (newState: TimerState) => {
    // Optimistic update
    setTimerState(newState);
    
    await supabase.from("sessoes").update({ timer_state: newState }).eq("id", sessaoId);
  };

  const startTimer = (minutes: number) => {
    const ms = minutes * 60 * 1000;
    updateGlobalTimer({
      status: "RUNNING",
      duration: minutes * 60,
      timeLeft: minutes * 60,
      endsAt: Date.now() + ms
    });
  };

  const pauseTimer = () => {
    updateGlobalTimer({
      ...timerState,
      status: "PAUSED",
      timeLeft: displayTime
    });
  };

  const resumeTimer = () => {
    updateGlobalTimer({
      ...timerState,
      status: "RUNNING",
      endsAt: Date.now() + (timerState.timeLeft * 1000)
    });
  };

  const stopTimer = () => {
    updateGlobalTimer({
      status: "IDLE",
      duration: 0,
      timeLeft: 0,
      endsAt: null
    });
  };

  const addTime = (minutes: number) => {
    if (timerState.status === "RUNNING" && timerState.endsAt) {
      updateGlobalTimer({
        ...timerState,
        endsAt: timerState.endsAt + (minutes * 60 * 1000)
      });
    } else if (timerState.status === "PAUSED") {
      updateGlobalTimer({
        ...timerState,
        timeLeft: timerState.timeLeft + (minutes * 60)
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (dbError) {
    if (!isAdmin) return null;
    return (
      <div className={styles.timerWrapper} style={{ fontSize: '0.8rem', color: 'red', maxWidth: '200px' }}>
        ⚠️ Timer desabilitado: execute a query SQL de timer_state.
      </div>
    );
  }

  // Only show the floating timer if it's running/paused or if the user is Admin
  if (!isAdmin && timerState.status === "IDLE") return null;

  return (
    <div className={`${styles.timerWrapper} ${isFlashing ? styles.flashing : ""}`}>
      <div className={styles.timerHeader}>
        ⏱️ Relógio da Mesa
      </div>
      <div className={styles.timerDisplay}>
        {formatTime(displayTime)}
      </div>

      {isAdmin && (
        <div className={styles.adminControls}>
          {timerState.status === "IDLE" ? (
            <>
              <button className={styles.controlBtn} onClick={() => startTimer(3)}>3m</button>
              <button className={styles.controlBtn} onClick={() => startTimer(5)}>5m</button>
            </>
          ) : (
            <>
              {timerState.status === "RUNNING" ? (
                <button className={styles.controlBtn} title="Pausar" onClick={pauseTimer}>⏸️</button>
              ) : (
                <button className={styles.controlBtn} title="Continuar" onClick={resumeTimer}>▶️</button>
              )}
              <button className={styles.controlBtn} title="Parar" onClick={stopTimer}>⏹️</button>
              <button className={styles.controlBtn} title="Adicionar 1 minuto" onClick={() => addTime(1)}>+1m</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
