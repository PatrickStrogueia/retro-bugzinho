import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { Card } from "../Card/Card";
import { ItemRetro, ItemType } from "@/types/database";
import styles from "./FaseColeta.module.css";

interface FaseColetaProps {
  sessaoId: string;
}

export const FaseColeta = ({ sessaoId }: FaseColetaProps) => {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [itens, setItens] = useState<ItemRetro[]>([]);

  // Carrega os itens já submetidos (opcional: carregar só os do próprio usuário ou todos)
  useEffect(() => {
    const buscarItens = async () => {
      const { data, error } = await supabase
        .from("itens_retro")
        .select("*")
        .eq("sessao_id", sessaoId)
        .order("created_at", { ascending: false });

      if (data) setItens(data);
    };

    buscarItens();

    // Escuta novos itens chegando em real-time
    const channel = supabase
      .channel(`itens_coleta_${sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "itens_retro",
          filter: `sessao_id=eq.${sessaoId}`,
        },
        (payload) => {
          setItens((prev) => [payload.new as ItemRetro, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId]);

  const enviarItem = async (tipo: ItemType) => {
    if (!texto.trim()) return;
    setEnviando(true);

    const { error } = await supabase
      .from("itens_retro")
      .insert([{ sessao_id: sessaoId, texto, tipo }]);

    if (error) {
      alert("Erro ao enviar item. Tente novamente.");
      console.error(error);
    } else {
      setTexto(""); // Limpa o input após enviar com sucesso
    }
    
    setEnviando(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formulario}>
        <h3 className={styles.title}>Faça suas Apostas! 📝</h3>
        <p className={styles.subtitle}>Escreva sua observação e classifique como boa, ruim ou ponto de melhoria.</p>
        
        <Input 
          placeholder="Ex: Faltou clareza na task X..." 
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <div className={styles.acoes}>
          <Button variant="primary" onClick={() => enviarItem("good")} disabled={enviando || !texto.trim()}>
            🟢 O que foi Bom
          </Button>
          <Button variant="secondary" onClick={() => enviarItem("bad")} disabled={enviando || !texto.trim()}>
            🔴 O que foi Ruim
          </Button>
          <Button variant="gold" onClick={() => enviarItem("improve")} disabled={enviando || !texto.trim()}>
            🟡 Melhorias
          </Button>
        </div>
      </div>

      <div className={styles.mesa}>
        <h4 className={styles.mesaTitle}>Cartas na Mesa ({itens.length})</h4>
        
        <div className={styles.gridCartas}>
          {itens.map((item) => (
            <Card key={item.id} type={item.tipo}>
              <p>{item.texto}</p>
            </Card>
          ))}
          {itens.length === 0 && (
            <p style={{ color: "var(--text-secondary)", gridColumn: "1 / -1", textAlign: "center" }}>
              Nenhuma carta na mesa ainda. Seja o primeiro a jogar!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
