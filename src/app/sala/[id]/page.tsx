"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SessaoStatus } from "@/types/database";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";

import { FaseColeta } from "@/components/FaseColeta/FaseColeta";
import { FaseVotacao } from "@/components/FaseVotacao/FaseVotacao";
import { FaseResultados } from "@/components/FaseResultados/FaseResultados";
import { FaseAcoes } from "@/components/FaseAcoes/FaseAcoes";
import { SlotMachine } from "@/components/SlotMachine/SlotMachine";
import { FaseLobby } from "@/components/FaseLobby/FaseLobby";
import { Timer } from "@/components/Timer/Timer";
import styles from "./page.module.css";

export default function SalaDeRetrospectiva() {
  const params = useParams();
  const sessaoId = params.id as string;

  const [statusSessao, setStatusSessao] = useState<SessaoStatus | null>(null);
  const [nome, setNome] = useState("");
  const [participanteId, setParticipanteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);

  // 1. Busca o status inicial da sala e verifica se a pessoa já entrou e se é Admin
  useEffect(() => {
    const buscarSessao = async () => {
      const { data, error } = await supabase
        .from("sessoes")
        .select("status")
        .eq("id", sessaoId)
        .single();

      if (data) {
        setStatusSessao(data.status);
      }
      setLoading(false);
    };

    buscarSessao();

    // Tenta recuperar do LocalStorage se a pessoa já entrou
    const savedId = localStorage.getItem(`bugzinho_participante_${sessaoId}`);
    if (savedId) setParticipanteId(savedId);

    // Tenta recuperar do LocalStorage se a pessoa é o Admin criador da sala
    const adminFlag = localStorage.getItem(`bugzinho_admin_${sessaoId}`);
    if (adminFlag === "true") setIsAdmin(true);
  }, [sessaoId]);

  // Função para o Admin mudar a fase/status
  const avancarFase = async (novoStatus: SessaoStatus) => {
    if (!isAdmin) return;
    
    if (novoStatus === "VOTACAO") {
      setIsProcessingAI(true);
      
      // Muda o status para PROCESSANDO globalmente
      await supabase
        .from("sessoes")
        .update({ status: "PROCESSANDO" })
        .eq("id", sessaoId);

      try {
        const res = await fetch("/api/agrupar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessaoId }),
        });
        
        if (!res.ok) {
          console.error("Erro ao agrupar itens com a IA");
          alert("Erro ao agrupar os itens. A votação seguirá com os itens originais.");
          // Falha: Força o avanço para não travar a sala
          await supabase.from("sessoes").update({ status: "VOTACAO" }).eq("id", sessaoId);
        }
      } catch (error) {
        console.error("Erro ao chamar API de agrupamento:", error);
        await supabase.from("sessoes").update({ status: "VOTACAO" }).eq("id", sessaoId);
      } finally {
        setIsProcessingAI(false);
      }
      return; // Interrompe para não executar o update final
    }

    await supabase
      .from("sessoes")
      .update({ status: novoStatus })
      .eq("id", sessaoId);
  };

  const sugerirAcoes = async () => {
    if (!isAdmin) return;
    setIsGeneratingActions(true);
    try {
      const res = await fetch("/api/gerar-acoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessaoId }),
      });
      
      if (!res.ok) {
        console.error("Erro ao gerar ações com IA");
        alert("Erro ao sugerir ações. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao chamar API de gerar ações:", error);
      alert("Erro ao conectar com a API.");
    } finally {
      setIsGeneratingActions(false);
    }
  };

  // 2. Escuta mudanças de fase em tempo real
  useEffect(() => {
    const channel = supabase
      .channel(`sessao_${sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessoes",
          filter: `id=eq.${sessaoId}`,
        },
        (payload) => {
          setStatusSessao(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId]);

  // 3. Ação de "Puxar a cadeira" (entrar na sala)
  const entrarNaSala = async () => {
    if (!nome.trim()) return;

    const { data, error } = await supabase
      .from("participantes")
      .insert([{ sessao_id: sessaoId, nome: nome }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao entrar:", error);
      return;
    }

    setParticipanteId(data.id);
    localStorage.setItem(`bugzinho_participante_${sessaoId}`, data.id);
  };

  if (loading) {
    return <div className={styles.loadingMessage}>Carregando a mesa...</div>;
  }

  if (!statusSessao) {
    return <div className={styles.errorMessage}>Sala não encontrada! 😕</div>;
  }

  // TELA DE LOGIN (Se não for participante ainda)
  if (!participanteId) {
    return (
      <div className={styles.loginContainer}>
        <h1 className={styles.loginTitle}>Puxe uma cadeira</h1>
        <p className={styles.loginSubtitle}>Identifique-se para entrar na mesa.</p>
        
        <div className={styles.loginForm}>
          <Input 
            label="Seu Nome" 
            placeholder="Ex: João QA" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrarNaSala()}
          />
          <Button variant="primary" onClick={entrarNaSala}>Entrar no Jogo</Button>
        </div>
      </div>
    );
  }

  // TELA DO JOGO (Depende do status da sessão)
  return (
    <div className={styles.pageContainer}>
      <div className={styles.faseHeader}>
        <h2>Fase Atual: {statusSessao}</h2>
        <span className={styles.salaId}>ID da Sala: {sessaoId}</span>
      </div>

      {statusSessao === "LOBBY" && (
        <FaseLobby sessaoId={sessaoId} isAdmin={isAdmin} />
      )}

      {statusSessao === "COLETA" && (
        <FaseColeta sessaoId={sessaoId} />
      )}

      {statusSessao === "PROCESSANDO" && (
        <SlotMachine />
      )}

      {statusSessao === "VOTACAO" && (
        <FaseVotacao sessaoId={sessaoId} />
      )}

      {statusSessao === "RESULTADOS" && (
        <FaseResultados sessaoId={sessaoId} isAdmin={isAdmin} />
      )}

      {statusSessao === "ACOES" && (
        <FaseAcoes sessaoId={sessaoId} isAdmin={isAdmin} />
      )}

      {/* TIMER FLUTUANTE PARA DISCUSSÃO */}
      <Timer sessaoId={sessaoId} isAdmin={isAdmin} />

      {/* PAINEL DO DEALER (Apenas para o Admin) */}
      {isAdmin && (
        <div className={styles.painelDealer}>
          <h3 className={styles.painelDealerTitle}>👑 Painel do Dealer</h3>
          <div className={styles.painelDealerActions}>
            <Button variant="secondary" onClick={() => avancarFase("LOBBY")} disabled={statusSessao === "LOBBY"}>Voltar p/ Lobby</Button>
            <Button variant="primary" onClick={() => avancarFase("COLETA")} disabled={statusSessao === "COLETA"}>Iniciar Coleta (Apostas)</Button>
            <Button variant="primary" onClick={() => avancarFase("VOTACAO")} disabled={statusSessao === "VOTACAO" || isProcessingAI}>
              {isProcessingAI ? "IA Agrupando..." : "Iniciar Votação"}
            </Button>
            <Button variant="gold" onClick={() => avancarFase("RESULTADOS")} disabled={statusSessao === "RESULTADOS"}>Revelar Resultados</Button>
            <Button variant="gold" onClick={() => avancarFase("ACOES")} disabled={statusSessao === "ACOES"}>Definir Ações 🎯</Button>
            {statusSessao === "ACOES" && (
              <Button variant="primary" onClick={sugerirAcoes} disabled={isGeneratingActions}>
                {isGeneratingActions ? "Processando..." : "🪄 Sugerir Ações com IA"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
