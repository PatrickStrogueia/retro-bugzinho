"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "../Card/Card";
import { PokerChip } from "../PokerChip/PokerChip";
import { Button } from "../Button/Button";
import { ItemRetro } from "@/types/database";
import styles from "./FaseVotacao.module.css";

interface FaseVotacaoProps {
  sessaoId: string;
}

export const FaseVotacao = ({ sessaoId }: FaseVotacaoProps) => {
  const [itens, setItens] = useState<ItemRetro[]>([]);
  const [loading, setLoading] = useState(true);
  const [meusVotos, setMeusVotos] = useState<string[]>([]);
  
  const MAX_VOTOS = 5;
  const fichasRestantes = MAX_VOTOS - meusVotos.length;

  // Busca os itens, escuta atualizações e recupera os votos locais
  useEffect(() => {
    const buscarItens = async () => {
      const { data, error } = await supabase
        .from("itens_retro")
        .select("*")
        .eq("sessao_id", sessaoId)
        .order("created_at", { ascending: true }); 

      if (data) setItens(data);
      setLoading(false);
    };

    buscarItens();

    // Recuperar quais itens eu já votei nesta sessão
    const votosSalvos = localStorage.getItem(`bugzinho_votos_${sessaoId}`);
    if (votosSalvos) {
      setMeusVotos(JSON.parse(votosSalvos));
    }

    const channel = supabase
      .channel(`itens_votacao_${sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "itens_retro",
          filter: `sessao_id=eq.${sessaoId}`,
        },
        (payload) => {
          setItens((prev) =>
            prev.map((item) => (item.id === payload.new.id ? (payload.new as ItemRetro) : item))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId]);

  // Função para adicionar voto
  const adicionarVoto = async (item: ItemRetro) => {
    if (fichasRestantes <= 0) {
      alert("Você não tem mais fichas disponíveis!");
      return;
    }
    
    if (meusVotos.includes(item.id)) {
      alert("Você já colocou uma ficha neste item!");
      return;
    }

    // Salva o voto localmente
    const novosMeusVotos = [...meusVotos, item.id];
    setMeusVotos(novosMeusVotos);
    localStorage.setItem(`bugzinho_votos_${sessaoId}`, JSON.stringify(novosMeusVotos));

    const novosVotos = item.votos + 1;
    
    // Atualiza otimisticamente a UI
    setItens((prev) => prev.map(i => i.id === item.id ? { ...i, votos: novosVotos } : i));

    // Salva no banco
    const { error } = await supabase
      .from("itens_retro")
      .update({ votos: novosVotos })
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao votar:", error);
    }
  };

  if (loading) return <div style={{ textAlign: "center" }}>Carregando as cartas da mesa...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Hora da Votação!
          <span style={{ display: 'inline-block', marginLeft: '12px', fontSize: '1.5rem' }}>♠️</span>
        </h3>
        <p className={styles.subtitle}>Distribua suas fichas nos temas que acha mais importantes para discutirmos.</p>
        
        <div style={{ marginTop: "1rem", display: "inline-block", padding: "0.5rem 1rem", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "99px", border: "1px solid var(--casino-gold)" }}>
          <span style={{ color: "var(--text-primary)" }}>Fichas Restantes: </span>
          <strong style={{ color: "var(--casino-gold)", fontSize: "1.2rem", marginLeft: "0.5rem" }}>
            {fichasRestantes} / {MAX_VOTOS}
          </strong>
        </div>
      </div>

      <div className={styles.gridCartas}>
        {itens.map((item) => {
          const jaVotei = meusVotos.includes(item.id);
          const semFichas = fichasRestantes <= 0;
          
          return (
            <div key={item.id} className={styles.cartaWrapper} style={{ opacity: (semFichas && !jaVotei) ? 0.6 : 1 }}>
              <Card type={item.tipo} className={styles.cardPersonalizado}>
                <p className={styles.textoCarta}>{item.texto}</p>
              </Card>
              
              <div className={styles.areaVoto}>
                <div style={{ opacity: jaVotei ? 0.5 : 1, filter: jaVotei ? "grayscale(100%)" : "none" }}>
                  <PokerChip 
                    value={1} 
                    onClick={() => adicionarVoto(item)} 
                  />
                </div>
                <span className={styles.contador}>
                  Total: <strong style={{ color: "var(--casino-gold)" }}>{item.votos}</strong>
                </span>
              </div>
              
              {jaVotei && (
                <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--casino-gold)", marginTop: "-0.5rem" }}>
                  Sua ficha está aqui!
                </div>
              )}
            </div>
          );
        })}
        {itens.length === 0 && (
          <p style={{ color: "var(--text-secondary)", gridColumn: "1 / -1", textAlign: "center" }}>
            A mesa está vazia! Nenhuma carta foi jogada na fase de coleta.
          </p>
        )}
      </div>
    </div>
  );
}
