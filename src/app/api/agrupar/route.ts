import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

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
      .eq("sessao_id", sessaoId);

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

Certifique-se de retornar APENAS o JSON válido, no formato de uma lista.
    `;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const agrupadosText = response.text; // Note: response.text is a string/getter in the new SDK
    if (!agrupadosText) {
      throw new Error("Resposta vazia da IA");
    }

    let agrupados = JSON.parse(agrupadosText);
    
    // Validate output structure if needed...

    // 4. Delete old items and Insert new ones
    // Delete
    const { error: deleteError } = await supabase
      .from("itens_retro")
      .delete()
      .eq("sessao_id", sessaoId);

    if (deleteError) {
      throw new Error("Erro ao limpar itens antigos");
    }

    // Insert
    const novosItens = agrupados.map((item: any) => ({
      sessao_id: sessaoId,
      texto: item.texto,
      tipo: item.tipo,
      votos: 0,
    }));

    const { error: insertError } = await supabase
      .from("itens_retro")
      .insert(novosItens);

    if (insertError) {
      throw new Error("Erro ao inserir itens agrupados");
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
