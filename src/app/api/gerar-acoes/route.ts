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

    // 1. Fetch top voted items
    const { data: itens, error: fetchError } = await supabase
      .from("itens_retro")
      .select("*")
      .eq("sessao_id", sessaoId)
      .is("parent_id", null)
      .order("votos", { ascending: false })
      .limit(10); // Limit to top 10 items to avoid overwhelming

    if (fetchError) {
      console.error("Error fetching items:", fetchError);
      return Response.json({ error: "Erro ao buscar itens" }, { status: 500 });
    }

    if (!itens || itens.length === 0) {
      return Response.json({ message: "Nenhum item para gerar ações" }, { status: 200 });
    }

    // 2. Prepare for Gemini
    const prompt = `
Você é um assistente especialista em facilitação de retrospectivas ágeis (Scrum Master / Agile Coach).
Sua tarefa é analisar os principais tópicos levantados na retrospectiva e gerar Planos de Ação no formato S.M.A.R.T. (Específico, Mensurável, Alcançável, Relevante, Temporal).

Aqui estão os tópicos mais importantes (formato JSON):
${JSON.stringify(itens)}

Crie de 1 a 2 ações práticas para cada tópico relevante (focando principalmente naqueles com mais votos ou do tipo 'bad' e 'improve').
Retorne APENAS um array JSON válido. Cada item do array deve ter as seguintes chaves:
- "descricao": A ação sugerida no padrão S.M.A.R.T.
- "item_id": A string com o "id" do tópico (item) original ao qual esta ação está vinculada.
- "responsavel": Sugestão de um papel ou "A definir" (opcional).

Certifique-se de retornar APENAS o JSON válido, sem markdown extra.
    `;

    // 3. Call Gemini
    const modelo = "gemini-3.5-flash";
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
      return Response.json({ error: "Erro ao gerar ações com IA" }, { status: 500 });
    }

    if (!generatedText) {
      return Response.json({ error: "Resposta vazia da IA" }, { status: 500 });
    }

    const acoesSugeridas = JSON.parse(generatedText);

    // 4. Insert into acoes_retro
    const novasAcoes = acoesSugeridas.map((acao: any) => ({
      sessao_id: sessaoId,
      item_id: acao.item_id || null,
      descricao: acao.descricao,
      responsavel: acao.responsavel || null,
      concluido: false,
    }));

    const { error: insertError } = await supabase
      .from("acoes_retro")
      .insert(novasAcoes);

    if (insertError) {
      console.error("Erro ao inserir ações:", insertError);
      return Response.json({ error: "Erro ao salvar ações no banco" }, { status: 500 });
    }

    return Response.json({ success: true, message: "Ações geradas com sucesso!", count: novasAcoes.length });

  } catch (error: any) {
    console.error("Erro na API gerar-acoes:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
