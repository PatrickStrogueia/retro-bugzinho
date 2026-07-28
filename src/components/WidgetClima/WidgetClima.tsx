import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../Button/Button";
import styles from "./WidgetClima.module.css";

interface ClimaData {
  score: string;
  sentimento: string;
  destaque: string;
  resumo: string;
}

interface WidgetClimaProps {
  sessaoId: string;
  isAdmin?: boolean;
}

export const WidgetClima = ({ sessaoId, isAdmin }: WidgetClimaProps) => {
  const [clima, setClima] = useState<ClimaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    const fetchClima = async () => {
      const { data, error } = await supabase
        .from("sessoes")
        .select("clima")
        .eq("id", sessaoId)
        .single();
      
      if (error) {
        if (error.code === "PGRST204" || error.code === "42703") {
          setDbError(true);
        }
      } else if (data?.clima) {
        setClima(data.clima as ClimaData);
      }
    };
    
    fetchClima();

    const channel = supabase
      .channel(`sessao_clima_${sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessoes",
          filter: `id=eq.${sessaoId}`,
        },
        (payload) => {
          if (payload.new.clima) {
            setClima(payload.new.clima as ClimaData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId]);

  const gerarClima = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analise-clima", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessaoId }),
      });
      
      if (!res.ok) {
        console.error("Erro ao gerar análise de clima");
        alert("Erro ao analisar o clima. A coluna 'clima' existe na tabela 'sessoes'?");
      }
    } catch (error) {
      console.error("Erro ao chamar API de análise de clima:", error);
    } finally {
      setLoading(false);
    }
  };

  if (dbError) {
    if (!isAdmin) return null;
    return (
      <div className={styles.warningBox}>
        ⚠️ <strong>Aviso para o Admin:</strong> A coluna <code>clima JSONB</code> precisa ser adicionada na tabela <code>sessoes</code> para habilitar esta funcionalidade.
      </div>
    );
  }

  return (
    <div className={styles.widgetContainer}>
      {!clima ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyText}>
            Nenhuma análise de clima gerada para esta sprint.
          </div>
          {isAdmin && (
            <Button variant="gold" onClick={gerarClima} disabled={loading}>
              {loading ? "Analista de IA trabalhando..." : "🪄 Analisar Clima da Sprint"}
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.climaData}>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLabel}>Sentimento Geral</div>
            <div className={styles.scoreValue}>{clima.score}</div>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.tagsRow}>
              <span className={styles.tagSentimento}>{clima.sentimento}</span>
              <span className={styles.tagDestaque}>✨ {clima.destaque}</span>
            </div>
            <div className={styles.resumo}>{clima.resumo}</div>
          </div>
        </div>
      )}
    </div>
  );
};
