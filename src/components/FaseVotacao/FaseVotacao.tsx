"use client";

import { useState, useEffect, useRef } from "react";
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
  const [configVotacao, setConfigVotacao] = useState({ max_fichas: 5, aposta_livre: false });
  const chipSoundRef = useRef<HTMLAudioElement | null>(null);
  
  const MAX_VOTOS = configVotacao.max_fichas;
  const fichasRestantes = MAX_VOTOS - meusVotos.length;

  // Busca os itens, escuta atualizações e recupera os votos locais
  useEffect(() => {
    chipSoundRef.current = new Audio("https://actions.google.com/sounds/v1/foley/glass_clink.ogg");
    if (chipSoundRef.current) chipSoundRef.current.volume = 0.3;

    const buscarItens = async () => {
      const { data, error } = await supabase
        .from("itens_retro")
        .select("*")
        .eq("sessao_id", sessaoId)
        .order("created_at", { ascending: true }); 

      if (data) setItens(data);
      
      const { data: sessaoData } = await supabase
        .from("sessoes")
        .select("config_votacao")
        .eq("id", sessaoId)
        .single();
        
      if (sessaoData?.config_votacao) {
        setConfigVotacao(sessaoData.config_votacao);
      }
      
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

  // Função para adicionar ou remover voto
  const toggleVoto = async (item: ItemRetro) => {
    chipSoundRef.current?.cloneNode(true).dispatchEvent(new Event('play')); // Clone to allow rapid clicking
    try {
      const audioClone = chipSoundRef.current?.cloneNode(true) as HTMLAudioElement;
      audioClone?.play().catch(e => console.log(e));
    } catch(e){}

    const jaVotei = meusVotos.includes(item.id);
    const qtdVotosNesteItem = meusVotos.filter(id => id === item.id).length;

    // Se já votou e Aposta Livre for falsa, o clique deve REMOVER o voto
    // Se Aposta Livre for verdadeira, o clique na ficha vai ADICIONAR (até acabar as fichas).
    // Para remover na Aposta Livre, o usuário clica no "Retirar ficha".
    if (jaVotei && !configVotacao.aposta_livre) {
      // Remover voto
      const novosMeusVotos = meusVotos.filter(id => id !== item.id);
      setMeusVotos(novosMeusVotos);
      localStorage.setItem(`bugzinho_votos_${sessaoId}`, JSON.stringify(novosMeusVotos));

      const novosVotos = Math.max(0, item.votos - 1);
      
      setItens((prev) => prev.map(i => i.id === item.id ? { ...i, votos: novosVotos } : i));

      const { error } = await supabase
        .from("itens_retro")
        .update({ votos: novosVotos })
        .eq("id", item.id);

      if (error) console.error("Erro ao remover voto:", error);
      return;
    }

    if (fichasRestantes <= 0) {
      alert("Você não tem mais fichas disponíveis!");
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

  const removerUmVoto = async (item: ItemRetro) => {
    if (!meusVotos.includes(item.id)) return;
    
    // Remove apenas a PRIMEIRA ocorrência do ID (para aposta livre)
    const index = meusVotos.indexOf(item.id);
    const novosMeusVotos = [...meusVotos];
    novosMeusVotos.splice(index, 1);
    
    setMeusVotos(novosMeusVotos);
    localStorage.setItem(`bugzinho_votos_${sessaoId}`, JSON.stringify(novosMeusVotos));

    const novosVotos = Math.max(0, item.votos - 1);
    setItens((prev) => prev.map(i => i.id === item.id ? { ...i, votos: novosVotos } : i));

    await supabase.from("itens_retro").update({ votos: novosVotos }).eq("id", item.id);
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
        {itens
          .filter(i => !i.parent_id)
          .sort((a, b) => {
            const order: Record<string, number> = { improve: 1, bad: 2, good: 3 };
            return (order[a.tipo] || 99) - (order[b.tipo] || 99);
          })
          .map((item) => {
          const jaVotei = meusVotos.includes(item.id);
          const semFichas = fichasRestantes <= 0;
          const filhos = itens.filter(i => i.parent_id === item.id);
          const tooltipText = filhos.length > 0 
            ? "Post-its originais:\n" + filhos.map(f => `• ${f.texto}`).join('\n') 
            : "";
          
          return (
            <div key={item.id} className={styles.cartaWrapper} style={{ opacity: (semFichas && !jaVotei) ? 0.6 : 1 }} title={tooltipText}>
              <Card type={item.tipo} className={styles.cardPersonalizado}>
                <p className={styles.textoCarta}>{item.texto}</p>
                {filhos.length > 0 && (
                  <div style={{ fontSize: "0.75rem", marginTop: "8px", color: "var(--text-secondary)", fontStyle: "italic", cursor: "help" }}>
                    ℹ️ Ver {filhos.length} originais (Hover)
                  </div>
                )}
              </Card>
              
              <div className={styles.areaVoto}>
                <div 
                  style={{ opacity: (jaVotei && !configVotacao.aposta_livre) ? 0.7 : 1, filter: (jaVotei && !configVotacao.aposta_livre) ? "grayscale(80%)" : "none", cursor: "pointer" }} 
                  title={(jaVotei && !configVotacao.aposta_livre) ? "Clique para remover sua ficha" : "Adicionar ficha"}
                >
                  <PokerChip 
                    value={1} 
                    onClick={() => toggleVoto(item)} 
                  />
                </div>
                <span className={styles.contador}>
                  Total: <strong style={{ color: "var(--casino-gold)" }}>{item.votos}</strong>
                </span>
              </div>
              
              {jaVotei && (
                <div 
                  style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--casino-red)", marginTop: "-0.5rem", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => configVotacao.aposta_livre ? removerUmVoto(item) : toggleVoto(item)}
                >
                  ✖ Retirar ficha {configVotacao.aposta_livre && `(${meusVotos.filter(id => id === item.id).length})`}
                </div>
              )}
            </div>
          );
        })}
        {itens.filter(i => !i.parent_id).length === 0 && (
          <p style={{ color: "var(--text-secondary)", gridColumn: "1 / -1", textAlign: "center" }}>
            A mesa está vazia! Nenhuma carta foi jogada na fase de coleta.
          </p>
        )}
      </div>
    </div>
  );
}
