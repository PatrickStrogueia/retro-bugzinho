import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { sessaoId } = await request.json();

    if (!sessaoId) {
      return Response.json({ error: "Sessão ID não informado" }, { status: 400 });
    }

    // 1. Fetch items
    const { data: itens, error: fetchError } = await supabase
      .from("itens_retro")
      .select("*")
      .eq("sessao_id", sessaoId)
      .is("parent_id", null);

    if (fetchError) {
      console.error("Error fetching items:", fetchError);
      return Response.json({ error: "Erro ao buscar itens" }, { status: 500 });
    }

    if (!itens || itens.length === 0) {
      return Response.json({ message: "Nenhum item para agrupar" }, { status: 200 });
    }

    // 2. Prepare for Gemini
    const prompt = `
Você é um assistente especialista em facilitação de retrospectivas ágeis.
Abaixo está uma lista de post-its (itens de retrospectiva) enviados por diferentes membros da equipe.
Sua tarefa é agrupar os itens similares, resumindo-os em um único post-it claro e conciso para cada grupo.
Os tipos de itens originais são: 'good' (O que foi bom), 'bad' (O que foi ruim), 'improve' (O que pode melhorar).
Mantenha os temas separados por 'tipo' (não misture um item 'good' com um 'bad').

Aqui estão os itens originais (formato JSON):
${JSON.stringify(itens)}

Retorne um array JSON com os itens agrupados. Cada item deve ter:
- "texto": String resumindo o tema do grupo.
- "tipo": O tipo original ('good', 'bad', ou 'improve').
- "itens_originais_ids": Array de strings com os "id" dos itens originais que compõem este grupo.

Certifique-se de retornar APENAS o JSON válido, no formato de uma lista.
    `;

    // 3. Call Gemini with retry logic
    const modelo = "gemini-3.5-flash";
    const MAX_TENTATIVAS = 3;
    const DELAY_BASE_MS = 2000; // 2s, 4s, 8s...

    let agrupadosText: string | undefined;

    for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa++) {
      console.log(`[agrupar] Tentativa ${tentativa + 1}/${MAX_TENTATIVAS} com modelo: ${modelo}`);

      try {
        const response = await ai.models.generateContent({
          model: modelo,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        agrupadosText = response.text;
        if (agrupadosText) {
          console.log(`[agrupar] Sucesso com modelo ${modelo} na tentativa ${tentativa + 1}`);
          break; // Success, exit retry loop
        }
      } catch (geminiError: any) {
        const statusCode = geminiError?.status || geminiError?.error?.code || geminiError?.code;
        const isRetryable = statusCode === 503 || statusCode === 429 || statusCode === "UNAVAILABLE";

        console.warn(`[agrupar] Erro na tentativa ${tentativa + 1} (modelo: ${modelo}):`, geminiError?.message || geminiError);

        if (isRetryable && tentativa < MAX_TENTATIVAS - 1) {
          const delay = DELAY_BASE_MS * Math.pow(2, tentativa);
          console.log(`[agrupar] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Non-retryable or last attempt
        throw new Error(
          `A IA está temporariamente indisponível (${statusCode || "erro desconhecido"}). ` +
          `Tente novamente em alguns instantes.`
        );
      }
    }

    if (!agrupadosText) {
      throw new Error("Resposta vazia da IA após todas as tentativas.");
    }

    let agrupados = JSON.parse(agrupadosText);
    
    // Validate output structure if needed...

    // 4. Update old items and Insert new ones
    for (const grupo of agrupados) {
      // Insert o novo item agrupado
      const novoItem = {
        sessao_id: sessaoId,
        texto: grupo.texto,
        tipo: grupo.tipo,
        votos: 0,
      };

      const { data: insertedData, error: insertError } = await supabase
        .from("itens_retro")
        .insert([novoItem])
        .select();

      if (insertError || !insertedData || insertedData.length === 0) {
        console.error("Erro ao inserir item agrupado", insertError);
        continue;
      }

      const novoItemId = insertedData[0].id;

      // Update the original items to point to this new item
      if (grupo.itens_originais_ids && Array.isArray(grupo.itens_originais_ids) && grupo.itens_originais_ids.length > 0) {
        const { error: updateItemsError } = await supabase
          .from("itens_retro")
          .update({ parent_id: novoItemId })
          .in("id", grupo.itens_originais_ids);

        if (updateItemsError) {
          console.error("Erro ao atualizar parent_id dos itens originais", updateItemsError);
        }
      }
    }

    // 5. Update Session Status to VOTACAO
    const { error: updateError } = await supabase
      .from("sessoes")
      .update({ status: "VOTACAO" })
      .eq("id", sessaoId);

    if (updateError) {
      console.error("Erro ao avançar fase:", updateError);
    }

    return Response.json({ success: true, message: "Itens agrupados com sucesso!" });

  } catch (error: any) {
    console.error("Erro na API agrupar:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
