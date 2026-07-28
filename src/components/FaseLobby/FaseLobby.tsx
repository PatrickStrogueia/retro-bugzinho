"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./FaseLobby.module.css";

interface FaseLobbyProps {
  sessaoId: string;
  isAdmin: boolean;
}

export const FaseLobby = ({ sessaoId, isAdmin }: FaseLobbyProps) => {
  const [maxFichas, setMaxFichas] = useState(5);
  const [apostaLivre, setApostaLivre] = useState(false);
  const [template, setTemplate] = useState("classic");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase.from("sessoes").select("config_votacao").eq("id", sessaoId).single();
      if (!error && data?.config_votacao) {
        setMaxFichas(data.config_votacao.max_fichas ?? 5);
        setApostaLivre(data.config_votacao.aposta_livre ?? false);
        setTemplate(data.config_votacao.template || "classic");
      }
    };
    fetchConfig();
  }, [sessaoId]);

  const salvarConfig = async () => {
    setSalvando(true);
    const { error } = await supabase.from("sessoes").update({
      config_votacao: { max_fichas: maxFichas, aposta_livre: apostaLivre, template: template }
    }).eq("id", sessaoId);
    if (error) alert("Erro ao salvar configuração (verifique se rodou o ALTER TABLE config_votacao)");
    setSalvando(false);
  };

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
          <div className={styles.adminSection}>
            <div className={styles.configBox}>
              <h3 className={styles.configTitle}>⚙️ Regras da Mesa (Votação)</h3>
              
              <div className={styles.configRow}>
                <label>Template da Retro:</label>
                <select className={styles.selectInput} value={template} onChange={e => setTemplate(e.target.value)}>
                  <option value="classic">Clássico (Bom, Ruim, Melhorias)</option>
                  <option value="starfish">Starfish (Keep, More, Less, Start, Stop)</option>
                  <option value="4ls">4 L's (Liked, Learned, Lacked, Longed for)</option>
                  <option value="sailboat">Sailboat (Vento, Âncora, Pedra, Ilha)</option>
                </select>
              </div>

              <div className={styles.configRow}>
                <label>Fichas por Jogador:</label>
                <select className={styles.selectInput} value={maxFichas} onChange={e => setMaxFichas(Number(e.target.value))}>
                  <option value={3}>3 Fichas</option>
                  <option value={5}>5 Fichas</option>
                  <option value={10}>10 Fichas</option>
                  <option value={15}>15 Fichas</option>
                </select>
              </div>
              
              <div className={styles.configRow}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={apostaLivre} onChange={e => setApostaLivre(e.target.checked)} />
                  Aposta Livre (Várias fichas na mesma carta)
                </label>
              </div>
              
              <button className={styles.saveBtn} onClick={salvarConfig} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Regras da Mesa"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
