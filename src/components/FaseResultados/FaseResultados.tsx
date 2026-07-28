"use client";

import { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";
import { supabase } from "@/lib/supabase";
import { Card } from "../Card/Card";
import { ItemRetro } from "@/types/database";
import { WidgetClima } from "../WidgetClima/WidgetClima";
import styles from "./FaseResultados.module.css";

interface FaseResultadosProps {
  sessaoId: string;
  isAdmin?: boolean;
}

export const FaseResultados = ({ sessaoId, isAdmin }: FaseResultadosProps) => {
  const [itens, setItens] = useState<ItemRetro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const winSize = typeof window !== "undefined" ? { w: window.innerWidth, h: window.innerHeight } : { w: 1000, h: 800 };
  const victorySoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    victorySoundRef.current = new Audio("https://actions.google.com/sounds/v1/cartoon/clown_horn.ogg"); // A simple victory sound? Let's use a bell or pop
    // Actually, a nice subtle chime or applause is better. Let's use "xylophone" or "magic"
    // Wait, let's use: https://actions.google.com/sounds/v1/foley/glass_clink.ogg? No, let's just use window audio
    victorySoundRef.current = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");
    if (victorySoundRef.current) victorySoundRef.current.volume = 0.3;
    victorySoundRef.current?.play().catch(e => console.log(e));

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const buscarItens = async () => {
      const { data, error } = await supabase
        .from("itens_retro")
        .select("*")
        .eq("sessao_id", sessaoId)
        .order("votos", { ascending: false }); 

      if (data) setItens(data);
      setLoading(false);
    };

    buscarItens();
  }, [sessaoId]);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}>Contando as fichas... <span style={{ marginLeft: '8px' }}>🎲</span></div>;

  return (
    <div className={styles.container}>
      {showConfetti && <Confetti width={winSize.w} height={winSize.h} recycle={false} numberOfPieces={300} colors={['#FBBF24', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6']} />}
      <div className={styles.header}>
        <h3 className={styles.title}>
          Resultados da Rodada 
          <span style={{ display: 'inline-block', marginLeft: '12px', fontSize: '1.5rem' }}>🏆</span>
        </h3>
        <p className={styles.subtitle}>Estes foram os temas agrupados pela IA, ordenados pelos mais votados da equipe.</p>
      </div>

      <WidgetClima sessaoId={sessaoId} isAdmin={isAdmin} />

      <div className={styles.gridCartas}>
        {itens.filter(i => !i.parent_id).map((item, index) => {
          const filhos = itens.filter(i => i.parent_id === item.id);
          const tooltipText = filhos.length > 0 
            ? "Post-its originais:\n" + filhos.map(f => `• ${f.texto}`).join('\n') 
            : "";

          return (
            <div key={item.id} className={styles.cartaWrapper} title={tooltipText}>
              <div className={styles.posicao}>#{index + 1}</div>
              <Card type={item.tipo} className={styles.cardPersonalizado}>
                <p className={styles.textoCarta}>{item.texto}</p>
                {filhos.length > 0 && (
                  <div style={{ fontSize: "0.75rem", marginTop: "8px", color: "var(--text-secondary)", fontStyle: "italic", cursor: "help" }}>
                    ℹ️ Ver {filhos.length} originais (Hover)
                  </div>
                )}
              </Card>
            
            <div className={styles.areaVotos}>
              <span className={styles.votosTexto}>
                Total de Fichas: <strong style={{ color: "var(--casino-gold)", fontSize: "1.2rem", marginLeft: "0.5rem" }}>{item.votos}</strong>
              </span>
            </div>
            </div>
          );
        })}
        {itens.filter(i => !i.parent_id).length === 0 && (
          <p style={{ color: "var(--text-secondary)", gridColumn: "1 / -1", textAlign: "center" }}>
            Nenhum item foi registrado nesta sessão.
          </p>
        )}
      </div>
    </div>
  );
}
