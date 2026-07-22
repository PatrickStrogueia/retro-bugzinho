"use client";

import { useState, useEffect } from "react";
import { LockSimple } from "@phosphor-icons/react";
import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import styles from "./AdminAuthModal.module.css";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal = ({ isOpen, onClose, onSuccess }: AdminAuthModalProps) => {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSenha("");
      setErro("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha) {
      setErro("Informe a senha.");
      return;
    }

    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/auth-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      if (res.ok) {
        localStorage.setItem("bugzinho_global_admin", "true");
        onSuccess();
      } else {
        const data = await res.json();
        setErro(data.error || "Senha incorreta.");
      }
    } catch {
      setErro("Erro ao verificar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Autenticação de admin">
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <LockSimple size={32} weight="fill" />
        </div>
        <h2 className={styles.title}>Área Restrita</h2>
        <p className={styles.subtitle}>Insira a senha de admin para criar uma nova sala.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="password"
            placeholder="Senha de admin"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={erro}
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="gold"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Verificando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};
