"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SessaoStatus } from "@/types/database";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";

export default function PocRealtime() {
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [statusSessao, setStatusSessao] = useState<SessaoStatus | null>(null);
  const [inputSessaoId, setInputSessaoId] = useState<string>("");

  // Função para o Admin criar uma sessão nova
  const criarSessao = async () => {
    const { data, error } = await supabase
      .from("sessoes")
      .insert([{ status: "LOBBY" }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar sessão:", error);
      return;
    }

    setSessaoId(data.id);
    setStatusSessao(data.status);
  };

  // Função para entrar em uma sessão existente (para a 2ª aba)
  const entrarNaSessao = async () => {
    if (!inputSessaoId) return;

    const { data, error } = await supabase
      .from("sessoes")
      .select("status")
      .eq("id", inputSessaoId)
      .single();

    if (error) {
      alert("Sessão não encontrada!");
      return;
    }

    setSessaoId(inputSessaoId);
    setStatusSessao(data.status);
  };

  // Função para o Admin mudar a fase/status
  const mudarStatus = async (novoStatus: SessaoStatus) => {
    if (!sessaoId) return;

    await supabase
      .from("sessoes")
      .update({ status: novoStatus })
      .eq("id", sessaoId);
  };

  // O "Ouvinte" Real-time: Fica escutando as mudanças no banco sem recarregar a página
  useEffect(() => {
    if (!sessaoId) return;

    console.log("Iniciando escuta real-time para a sessão:", sessaoId);

    const channel = supabase
      .channel("mudancas_sessao")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessoes",
          filter: `id=eq.${sessaoId}`,
        },
        (payload) => {
          console.log("Recebemos uma atualização via WebSocket!", payload);
          setStatusSessao(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "2rem", backgroundColor: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--casino-gold)" }}>
      <h1 style={{ color: "var(--casino-gold)", textAlign: "center" }}>⚡ PoC: Sincronização Real-time</h1>
      
      {!sessaoId ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
          <div style={{ textAlign: "center", width: "100%", maxWidth: "400px" }}>
            <p style={{ marginBottom: "1rem" }}>Opção A: Criar uma nova mesa</p>
            <Button variant="primary" onClick={criarSessao} style={{ width: "100%" }}>Criar Nova Sessão (Admin)</Button>
          </div>
          
          <div style={{ width: "100%", maxWidth: "400px", borderTop: "1px dashed var(--bg-surface-hover)", paddingTop: "2rem", textAlign: "center" }}>
            <p style={{ marginBottom: "1rem" }}>Opção B: Entrar em uma mesa existente (Use na 2ª Aba)</p>
            <Input 
              placeholder="Cole o ID da sessão aqui..." 
              value={inputSessaoId}
              onChange={(e) => setInputSessaoId(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
            <Button variant="secondary" onClick={entrarNaSessao} style={{ width: "100%" }}>Entrar na Sessão</Button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: "#000", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>ID da Sessão Atual:</p>
            <p style={{ fontSize: "0.8rem", wordBreak: "break-all", userSelect: "all", cursor: "pointer", color: "var(--casino-gold)" }}>{sessaoId}</p>
            
            <h2 style={{ marginTop: "1rem", color: "white" }}>
              Fase Atual: <span style={{ color: "var(--casino-green)" }}>{statusSessao}</span>
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
              (Copie o ID dourado acima, abra outra aba, cole no campo de "Entrar em uma mesa" e veja a mágica)
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="secondary" onClick={() => mudarStatus("LOBBY")}>Mover p/ Lobby</Button>
            <Button variant="secondary" onClick={() => mudarStatus("COLETA")}>Mover p/ Coleta</Button>
            <Button variant="secondary" onClick={() => mudarStatus("VOTACAO")}>Mover p/ Votação</Button>
            <Button variant="gold" onClick={() => mudarStatus("RESULTADOS")}>Revelar Resultados</Button>
          </div>
        </>
      )}
    </div>
  );
}
