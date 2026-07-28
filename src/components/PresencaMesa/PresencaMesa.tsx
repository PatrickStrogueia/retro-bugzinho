import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./PresencaMesa.module.css";
import { SessaoStatus } from "@/types/database";

interface PresencaMesaProps {
  sessaoId: string;
  participanteId: string;
  nome: string;
  statusSessao: SessaoStatus;
}

interface ParticipantePresenca {
  participante_id: string;
  nome: string;
  online_at: string;
  estado: string; 
}

export const PresencaMesa = ({ sessaoId, participanteId, nome, statusSessao }: PresencaMesaProps) => {
  const [onlineUsers, setOnlineUsers] = useState<ParticipantePresenca[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`presenca_${sessaoId}`, {
      config: {
        presence: { key: participanteId },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      const newState = channel.presenceState();
      const users: ParticipantePresenca[] = [];
      
      for (const id in newState) {
        // presenceState returns an array of states for a given key, we take the first
        const userPresence = newState[id][0] as unknown as ParticipantePresenca;
        if (userPresence) {
          users.push(userPresence);
        }
      }
      
      users.sort((a, b) => a.nome.localeCompare(b.nome));
      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          participante_id: participanteId,
          nome: nome,
          online_at: new Date().toISOString(),
          estado: statusSessao,
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessaoId, participanteId, nome, statusSessao]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className={styles.presencaContainer}>
      <div className={styles.title}>👥 Jogadores na Mesa ({onlineUsers.length})</div>
      <div className={styles.usersList}>
        {onlineUsers.map((user) => (
          <div key={user.participante_id} className={styles.userBadge} title={`Fase atual: ${user.estado}`}>
            <span className={styles.statusDot}></span>
            <span className={styles.userName}>{user.nome}</span>
            {user.participante_id === participanteId && <span className={styles.youLabel}>(Você)</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
