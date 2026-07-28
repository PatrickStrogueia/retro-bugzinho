import { useState } from "react";
import styles from "./ExportModal.module.css";
import { Button } from "../Button/Button";
import { ItemRetro, AcaoRetro, Participante } from "@/types/database";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itens: ItemRetro[];
  acoes: AcaoRetro[];
  clima?: any;
  participantes?: Participante[];
}

export const ExportModal = ({ isOpen, onClose, itens, acoes, clima, participantes }: ExportModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    let md = "# 📋 Relatório da Retrospectiva\n\n";

    if (clima) {
      md += "## ✨ Análise de Clima da Sprint\n";
      md += `- **Sentimento Geral:** ${clima.score} - ${clima.sentimento}\n`;
      md += `- **Destaque:** ${clima.destaque}\n`;
      md += `- **Resumo:** ${clima.resumo}\n\n`;
    }

    if (participantes && participantes.length > 0) {
      md += "## 👥 Participantes\n";
      participantes.forEach(p => {
        md += `- ${p.nome}\n`;
      });
      md += "\n";
    }

    // 1. Tópicos
    const principais = itens.filter(i => !i.parent_id);
    md += "## 🏆 Tópicos Mais Votados\n\n";
    if (principais.length === 0) {
      md += "Nenhum tópico registrado.\n\n";
    } else {
      principais.forEach((item, index) => {
        md += `### ${index + 1}. ${item.texto}\n`;
        md += `- **Votos:** ${item.votos}\n`;
        md += `- **Tipo:** ${item.tipo}\n`;
        
        const filhos = itens.filter(i => i.parent_id === item.id);
        if (filhos.length > 0) {
          md += `- **Post-its agrupados:**\n`;
          filhos.forEach(f => {
            md += `  - ${f.texto}\n`;
          });
        }
        md += "\n";
      });
    }

    // 2. Ações
    md += "## 🎯 Plano de Ação\n\n";
    if (acoes.length === 0) {
      md += "Nenhuma ação definida.\n\n";
    } else {
      acoes.forEach(acao => {
        const checkbox = acao.concluido ? "[x]" : "[ ]";
        const resp = acao.responsavel ? ` (Responsável: **${acao.responsavel}**)` : "";
        const itemVinculado = acao.item_id ? itens.find(i => i.id === acao.item_id) : null;
        const ref = itemVinculado ? ` - *Ref: ${itemVinculado.texto}*` : "";
        
        md += `- ${checkbox} ${acao.descricao}${resp}${ref}\n`;
      });
    }

    return md;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Erro ao copiar para a área de transferência.");
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generateMarkdown()], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `retrospectiva-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Exportar Relatório</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          <p>Escolha como deseja exportar o resumo estruturado da retrospectiva em Markdown.</p>
          
          <div className={styles.previewBox}>
            <pre className={styles.previewText}>
              {generateMarkdown()}
            </pre>
          </div>

          <div className={styles.actionsBox}>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? "✅ Copiado!" : "📋 Copiar Markdown"}
            </Button>
            <Button variant="primary" onClick={handleDownload}>
              💾 Baixar Arquivo .md
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
