import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { Card } from "../Card/Card";
import { ItemRetro, ItemType } from "@/types/database";
import styles from "./FaseColeta.module.css";

interface FaseColetaProps {
  sessaoId: string;
}

const TEMPLATES: Record<string, { id: string, label: string, variant: 'primary' | 'secondary' | 'gold' }[]> = {
  classic: [
    { id: "good", label: "🟢 O que foi Bom", variant: "primary" },
    { id: "bad", label: "🔴 O que foi Ruim", variant: "secondary" },
    { id: "improve", label: "🟡 Melhorias", variant: "gold" }
  ],
  starfish: [
    { id: "keep", label: "⭐ Keep", variant: "primary" },
    { id: "more", label: "📈 More", variant: "primary" },
    { id: "less", label: "📉 Less", variant: "secondary" },
    { id: "start", label: "🚀 Start", variant: "gold" },
    { id: "stop", label: "🛑 Stop", variant: "secondary" }
  ],
  "4ls": [
    { id: "liked", label: "❤️ Liked", variant: "primary" },
    { id: "learned", label: "🧠 Learned", variant: "gold" },
    { id: "lacked", label: "💔 Lacked", variant: "secondary" },
    { id: "longed", label: "🔭 Longed for", variant: "primary" }
  ],
  sailboat: [
    { id: "wind", label: "💨 Vento", variant: "primary" },
    { id: "anchor", label: "⚓ Âncora", variant: "secondary" },
    { id: "rock", label: "🪨 Pedra", variant: "secondary" },
    { id: "island", label: "🏝️ Ilha", variant: "gold" }
  ]
};

export const FaseColeta = ({ sessaoId }: FaseColetaProps) => {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [itens, setItens] = useState<ItemRetro[]>([]);
  const [template, setTemplate] = useState("classic");
  const [meusCartoesIds, setMeusCartoesIds] = useState<string[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const cardSoundRef = useRef<HTMLAudioElement | null>(null);

  // Carrega IDs do localStorage
  useEffect(() => {
    cardSoundRef.current = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
    if (cardSoundRef.current) cardSoundRef.current.volume = 0.5;

    const saved = localStorage.getItem(`meus_cartoes_${sessaoId}`);
    if (saved) {
      setMeusCartoesIds(JSON.parse(saved));
    }
  }, [sessaoId]);

  useEffect(() => {
    if (meusCartoesIds.length > 0) {
      localStorage.setItem(`meus_cartoes_${sessaoId}`, JSON.stringify(meusCartoesIds));
    }
  }, [meusCartoesIds, sessaoId]);

  // Carrega os itens já submetidos
  useEffect(() => {
    const buscarItens = async () => {
      const { data, error } = await supabase
        .from("itens_retro")
        .select("*")
        .eq("sessao_id", sessaoId)
        .order("created_at", { ascending: false });

      if (data) setItens(data);
      
      const { data: configData } = await supabase
        .from("sessoes")
        .select("config_votacao")
        .eq("id", sessaoId)
        .single();
        
      if (configData?.config_votacao?.template) {
        setTemplate(configData.config_votacao.template);
      }
    };

    buscarItens();

    // Escuta novos itens chegando em real-time
    const channel = supabase
      .channel(`itens_coleta_${sessaoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "itens_retro",
          filter: `sessao_id=eq.${sessaoId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItens((prev) => {
              if (prev.some((item) => item.id === payload.new.id)) return prev;
              return [payload.new as ItemRetro, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setItens((prev) => prev.map(item => item.id === payload.new.id ? (payload.new as ItemRetro) : item));
          } else if (payload.eventType === "DELETE") {
            setItens((prev) => prev.filter(item => item.id !== payload.old.id));
          }
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

    const { data, error } = await supabase
      .from("itens_retro")
      .insert([{ sessao_id: sessaoId, texto, tipo }])
      .select()
      .single();

    if (error) {
      alert("Erro ao enviar item. Tente novamente.");
      console.error(error);
    } else if (data) {
      cardSoundRef.current?.play().catch(e => console.log(e));
      setTexto(""); // Limpa o input após enviar com sucesso
      setMeusCartoesIds((prev) => {
        if (prev.includes(data.id)) return prev;
        return [...prev, data.id];
      });
    }
    
    setEnviando(false);
  };

  const iniciarEdicao = (item: ItemRetro) => {
    setEditandoId(item.id);
    setTextoEditado(item.texto);
  };

  const salvarEdicao = async (id: string) => {
    if (!textoEditado.trim()) return;
    
    setItens(prev => prev.map(item => item.id === id ? { ...item, texto: textoEditado.trim() } : item));
    setEditandoId(null);

    const { error } = await supabase
      .from("itens_retro")
      .update({ texto: textoEditado.trim() })
      .eq("id", id);
      
    if (error) {
       console.error("Erro ao editar", error);
    }
  };

  const deletarItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta carta?")) return;
    
    setItens(prev => prev.filter(item => item.id !== id));
    
    const { error } = await supabase
      .from("itens_retro")
      .delete()
      .eq("id", id);

    if (error) {
       console.error("Erro ao excluir", error);
    }
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
          {TEMPLATES[template]?.map(cat => (
            <Button 
              key={cat.id} 
              variant={cat.variant} 
              onClick={() => enviarItem(cat.id)} 
              disabled={enviando || !texto.trim()}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.mesa}>
        <h4 className={styles.mesaTitle}>Cartas na Mesa ({itens.length})</h4>
        
        <div className={styles.gridCartas}>
          {itens.map((item) => {
            const isMine = meusCartoesIds.includes(item.id);
            const isEditing = editandoId === item.id;

            return (
              <Card key={item.id} type={item.tipo}>
                {isEditing ? (
                  <div className={styles.editContainer}>
                    <textarea 
                      className={styles.editInput} 
                      value={textoEditado} 
                      onChange={(e) => setTextoEditado(e.target.value)} 
                      autoFocus
                    />
                    <div className={styles.editActions}>
                      <button className={styles.actionBtnOk} onClick={() => salvarEdicao(item.id)}>Salvar</button>
                      <button className={styles.actionBtnCancel} onClick={() => setEditandoId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.cardContent}>
                    <p>{item.texto}</p>
                    {isMine && (
                      <div className={styles.cardActions}>
                        <button className={styles.iconBtn} onClick={() => iniciarEdicao(item)} title="Editar">✏️</button>
                        <button className={styles.iconBtn} onClick={() => deletarItem(item.id)} title="Excluir">🗑️</button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
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
