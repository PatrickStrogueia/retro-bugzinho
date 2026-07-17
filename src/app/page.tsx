"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import { Button } from "@/components/Button/Button";
import { SlotMachineIcon } from "@/components/SlotMachineIcon/SlotMachineIcon";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const criarNovaSala = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sessoes")
        .insert([{ status: "LOBBY" }])
        .select()
        .single();

      if (error) throw error;
      
      // Marca no navegador do criador que ele é o Admin (Dealer) dessa sala
      localStorage.setItem(`bugzinho_admin_${data.id}`, "true");
      
      // Redireciona o Admin para a sala recém-criada
      router.push(`/sala/${data.id}`);
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      alert("Houve um erro ao criar a sala. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        Bem-vindo ao Bugzinho
        <SlotMachineIcon size={48} color="var(--casino-gold)" />
      </h1>
      <p className={styles.subtitle}>Sua retrospectiva gamificada e imersiva para times de elite.</p>

      <section className={styles.section} style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ borderBottom: 'none' }}>Abra uma nova mesa</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Você será o <strong>Dealer (Admin)</strong> desta sessão. Após criar a sala, você receberá um link para compartilhar com sua equipe.
        </p>
        
        <Button 
          variant="gold" 
          onClick={criarNovaSala} 
          disabled={loading}
          style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
        >
          {loading ? "Embaralhando as cartas..." : "Criar Nova Sala (Dealer)"}
        </Button>
      </section>

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Design System PoC disponível em <a href="/poc" style={{ color: 'var(--casino-green)', textDecoration: 'underline' }}>/poc</a>
        </p>
      </div>
    </main>
  );
}
