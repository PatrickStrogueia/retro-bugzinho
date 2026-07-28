"use client";

import { useState, useEffect } from "react";
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
