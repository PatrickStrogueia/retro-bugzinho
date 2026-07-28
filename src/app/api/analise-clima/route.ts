import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
      .eq("sessao_id", sessaoId);

    if (fetchError) {
      console.error("Error fetching items:", fetchError);
      return Response.json({ error: "Erro ao buscar itens" }, { status: 500 });
    }

    if (!itens || itens.length === 0) {
      return Response.json({ message: "Nenhum item para analisar o clima" }, { status: 200 });
    }

    // 2. Prepare prompt
    const prompt = `
Você é um Agile Coach especialista em gestão de equipes.
Sua tarefa é analisar os post-its de uma retrospectiva e definir o "Clima da Sprint" atual da equipe.

Aqui estão os itens levantados (formato JSON):
${JSON.stringify(itens)}

Retorne APENAS um objeto JSON válido com as seguintes chaves e em português do Brasil:
- "score": Uma porcentagem (ex: "75%") representando o quão positivo foi o clima da sprint. Calcule isso baseado na proporção e peso dos post-its bons vs ruins.
- "sentimento": Uma palavra resumindo o sentimento (ex: "Positivo", "Tenso", "Melhorando", "Cansativo", "Excelente").
- "destaque": Uma frase curta destacando o assunto mais falado ou impactante (ex: "Destaque para Infraestrutura" ou "Foco em Refatoração").
- "resumo": Uma frase (máximo 2 linhas) resumindo o estado da equipe nesta retrospectiva.

Certifique-se de retornar APENAS o JSON válido, sem markdown extra.
    `;

    // 3. Call Gemini
    const modelo = "gemini-3.6-flash";
    let generatedText: string | undefined;

    try {
      const response = await ai.models.generateContent({
        model: modelo,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      generatedText = response.text;
    } catch (geminiError: any) {
      console.error("Erro no Gemini:", geminiError);
      return Response.json({ error: "Erro ao gerar análise de clima com IA" }, { status: 500 });
    }

    if (!generatedText) {
      return Response.json({ error: "Resposta vazia da IA" }, { status: 500 });
    }

    const climaData = JSON.parse(generatedText);

    // 4. Salvar na sessão
    const { error: updateError } = await supabase
      .from("sessoes")
      .update({ clima: climaData })
      .eq("id", sessaoId);

    if (updateError) {
      console.error("Erro ao salvar clima na sessão:", updateError);
      return Response.json({ error: "Erro ao salvar clima no banco" }, { status: 500 });
    }

    return Response.json({ success: true, clima: climaData });

  } catch (error: any) {
    console.error("Erro na API analise-clima:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
