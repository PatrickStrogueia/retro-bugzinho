"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { ItemRetro, AcaoRetro } from "@/types/database";
import styles from "./FaseAcoes.module.css";

interface FaseAcoesProps {
  sessaoId: string;
  isAdmin?: boolean;
}

export const FaseAcoes = ({ sessaoId, isAdmin }: FaseAcoesProps) => {
  const [topItens, setTopItens] = useState<ItemRetro[]>([]);
  const [acoes, setAcoes] = useState<AcaoRetro[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);

  // Form states
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);

      // 1. Carrega tópicos votados para vincular ações aos assuntos prioritários
      const { data: itensData } = await supabase
        .from("itens_retro")
        .select("*")
        .eq("sessao_id", sessaoId)
        .order("votos", { ascending: false });

      if (itensData) {
        setTopItens(itensData);
      }

      // 2. Carrega ações da sessão
      const { data: acoesData, error: acoesError } = await supabase
        .from("acoes_retro")
        .select("*")
        .eq("sessao_id", sessaoId)
        .order("created_at", { ascending: true });

      if (acoesError) {
        console.warn("Tabela acoes_retro pode não existir ainda no Supabase:", acoesError);
        if (acoesError.code === "42P01") {
          setTableExists(false);
        }
      } else if (acoesData) {
        setAcoes(acoesData as AcaoRetro[]);
      }

      setLoading(false);
    };

    carregarDados();

    // 3. Subscription real-time para acoes_retro
    const channel = supabase
      .channel(`acoes_retro_${sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "acoes_retro",
          filter: `sessao_id=eq.${sessaoId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAcoes((prev) => {
              if (prev.some((a) => a.id === payload.new.id)) return prev;
              return [...prev, payload.new as AcaoRetro];
            });
          } else if (payload.eventType === "UPDATE") {
            setAcoes((prev) =>
              prev.map((a) => (a.id === payload.new.id ? (payload.new as AcaoRetro) : a))
            );
          } else if (payload.eventType === "DELETE") {
            setAcoes((prev) => prev.filter((a) => a.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId]);

  const adicionarAcao = async () => {
    if (!descricao.trim()) return;
    setEnviando(true);

    const novaAcao = {
      sessao_id: sessaoId,
      item_id: selectedItemId || null,
      descricao: descricao.trim(),
      responsavel: responsavel.trim() || null,
      concluido: false,
    };

    const { data, error } = await supabase
      .from("acoes_retro")
      .insert([novaAcao])
      .select()
      .single();

    if (error) {
      console.error("Erro ao inserir ação:", error);
      alert("Erro ao salvar o plano de ação. Verifique se a tabela 'acoes_retro' existe no Supabase.");
    } else if (data) {
      setAcoes((prev) => [...prev.filter((a) => a.id !== data.id), data as AcaoRetro]);
      setDescricao("");
      setResponsavel("");
      setSelectedItemId("");
    }

    setEnviando(false);
  };

  const toggleConcluido = async (acao: AcaoRetro) => {
    const novoStatus = !acao.concluido;

    // Atualização otimista
    setAcoes((prev) =>
      prev.map((a) => (a.id === acao.id ? { ...a, concluido: novoStatus } : a))
    );

    const { error } = await supabase
      .from("acoes_retro")
      .update({ concluido: novoStatus })
      .eq("id", acao.id);

    if (error) {
      console.error("Erro ao atualizar status:", error);
      // Reverte em caso de falha
      setAcoes((prev) =>
        prev.map((a) => (a.id === acao.id ? { ...a, concluido: acao.concluido } : a))
      );
    }
  };

  const deletarAcao = async (id: string) => {
    // Atualização otimista
    setAcoes((prev) => prev.filter((a) => a.id !== id));

    const { error } = await supabase.from("acoes_retro").delete().eq("id", id);
    if (error) {
      console.error("Erro ao deletar ação:", error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}>Carregando os compromissos da mesa... 📋</div>;
  }

  const concluidasCount = acoes.filter((a) => a.concluido).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Plano de Ação da Retro 🎯
        </h3>
        <p className={styles.subtitle}>
          Defina tarefas acionáveis e responsáveis para solucionar os problemas identificados na sprint.
        </p>
      </div>

      {!tableExists && (
        <div style={{
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid var(--casino-red)",
          borderRadius: "8px",
          padding: "1rem",
          color: "var(--text-primary)",
          fontSize: "0.9rem"
        }}>
          ⚠️ <strong>Aviso para o Admin:</strong> A tabela <code>acoes_retro</code> precisa ser criada no Supabase SQL Editor.
          <br />
          Execute a query informada no arquivo <code>PLANO_DE_MELHORIAS.md</code> ou <code>supabase_schema.sql</code>.
        </div>
      )}

      {/* Form de Criação */}
      <div className={styles.formBox}>
        <div className={styles.formTitle}>✨ Criar Novo Compromisso</div>

        <Input
          label="Descrição da Ação *"
          placeholder="Ex: Automatizar a geração da doc Swagger no backend"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div className={styles.formRow}>
          <Input
            label="Responsável (Opcional)"
            placeholder="Ex: Bruno (Backend)"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
          />

          <div className={styles.selectWrapper}>
            <label className={styles.selectLabel}>Tópico Vinculado (Opcional)</label>
            <select
              className={styles.selectInput}
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">-- Ação Geral da Retro --</option>
              {topItens.filter(i => !i.parent_id).map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.votos} votos] {item.texto.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button
            variant="gold"
            onClick={adicionarAcao}
            disabled={enviando || !descricao.trim()}
          >
            {enviando ? "Salvando..." : "➕ Registrar Ação na Mesa"}
          </Button>
        </div>
      </div>

      {/* Lista de Ações */}
      <div className={styles.listaAcoes}>
        <div className={styles.listaTitle}>
          <span>Ações Registradas ({acoes.length})</span>
          {acoes.length > 0 && (
            <span className={styles.badgeContador}>
              {concluidasCount} de {acoes.length} concluídas
            </span>
          )}
        </div>

        {acoes.map((acao) => {
          const itemVinculado = topItens.find((i) => i.id === acao.item_id);

          return (
            <div
              key={acao.id}
              className={`${styles.cardAcao} ${acao.concluido ? styles.cardAcaoConcluido : ""}`}
            >
              <div className={styles.checkboxContainer} onClick={() => toggleConcluido(acao)}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={acao.concluido}
                  onChange={() => {}} // controlado pelo wrapper div
                />
              </div>

              <div className={styles.conteudoAcao}>
                <div className={`${styles.descricao} ${acao.concluido ? styles.descricaoRiscada : ""}`}>
                  {acao.descricao}
                </div>

                <div className={styles.metaRow}>
                  {acao.responsavel && (
                    <span className={styles.responsavel}>
                      👤 Responsável: <strong>{acao.responsavel}</strong>
                    </span>
                  )}

                  {itemVinculado && (
                    <span className={styles.badgeTopico} title={itemVinculado.texto}>
                      📌 Tópico: {itemVinculado.texto}
                    </span>
                  )}
                </div>
              </div>

              <button
                className={styles.btnDeletar}
                onClick={() => deletarAcao(acao.id)}
                title="Deletar ação"
              >
                🗑️
              </button>
            </div>
          );
        })}

        {acoes.length === 0 && (
          <div className={styles.emptyState}>
            Nenhuma ação foi registrada ainda. Adicione os compromissos para garantir que os problemas sejam resolvidos na próxima sprint!
          </div>
        )}
      </div>
    </div>
  );
};
