import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedItem {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade_solicitada: number;
  quantidade_fornecida: number;
  valor_total?: number;
  aprovado: boolean;
}

interface ExtractedMetadata {
  numero_reserva: string;
  data: string;
  localidade: string;
  responsavel: string;
  deposito: string;
}

interface ExtractedData {
  items: ExtractedItem[];
  metadata: ExtractedMetadata;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();

    if (!pdfText || typeof pdfText !== "string") {
      return new Response(
        JSON.stringify({ error: "Texto do PDF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um especialista em extrair dados estruturados de documentos da EMBASA (Empresa Baiana de Águas e Saneamento).

Analise o texto do PDF fornecido e extraia:

1. **Metadados do documento:**
   - numero_reserva: Número da reserva (ex: "0001680630")
   - data: Data do documento (formato: "DD/MM/YYYY")
   - localidade: Local/unidade (ex: "UMBS/MURILO" ou "Salvador")
   - responsavel: Nome do responsável/citante
   - deposito: Código do depósito (ex: "1111")

2. **Lista de itens:**
   Para cada item, extraia:
   - codigo: Código SAP do material
   - descricao: Descrição do material
   - unidade: Unidade de medida (UN, PC, CX, etc.)
   - quantidade_solicitada: Quantidade solicitada (número)
   - quantidade_fornecida: Quantidade fornecida/aprovada (número, 0 se não aprovado)
   - valor_total: Valor total se disponível (número ou null)
   - aprovado: true se o item foi aprovado/fornecido, false se está na seção "ITENS NÃO APROVADOS"

IMPORTANTE:
- Se encontrar seção "ITENS NÃO APROVADOS", marque esses itens com aprovado: false
- Converta todas as quantidades para números
- Se um campo não for encontrado, use string vazia ou 0 conforme apropriado
- Retorne APENAS o JSON, sem markdown ou explicações`;

    const userPrompt = `Extraia os dados estruturados do seguinte texto de documento EMBASA:

${pdfText}

Retorne um JSON com a seguinte estrutura:
{
  "items": [
    {
      "codigo": "string",
      "descricao": "string", 
      "unidade": "string",
      "quantidade_solicitada": number,
      "quantidade_fornecida": number,
      "valor_total": number | null,
      "aprovado": boolean
    }
  ],
  "metadata": {
    "numero_reserva": "string",
    "data": "string",
    "localidade": "string",
    "responsavel": "string",
    "deposito": "string"
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from AI response (may contain markdown code blocks)
    let extractedData: ExtractedData;
    try {
      // Remove markdown code blocks if present
      let jsonString = content.trim();
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.slice(0, -3);
      }
      jsonString = jsonString.trim();

      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Falha ao interpretar resposta da IA", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate structure
    if (!extractedData.items || !Array.isArray(extractedData.items)) {
      extractedData.items = [];
    }
    if (!extractedData.metadata) {
      extractedData.metadata = {
        numero_reserva: "",
        data: "",
        localidade: "",
        responsavel: "",
        deposito: "",
      };
    }

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
