import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { carregarIncidentes } from "@/lib/repositorio-incidentes";
import { derivarResolvidos } from "@/lib/processador-dados";

export const runtime = "nodejs";
export const maxDuration = 60;

function topN(valores: string[], n: number): Record<string, number> {
  const contagem = new Map<string, number>();
  for (const v of valores) contagem.set(v, (contagem.get(v) ?? 0) + 1);
  return Object.fromEntries(Array.from(contagem.entries()).sort((a, b) => b[1] - a[1]).slice(0, n));
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const { pergunta } = (await req.json()) as { pergunta: string };
    if (!pergunta) {
      return NextResponse.json({ error: "Campo 'pergunta' é obrigatório." }, { status: 400 });
    }

    const incidentes = await carregarIncidentes();
    const resolvidos = derivarResolvidos(incidentes);

    if (resolvidos.length === 0) {
      return NextResponse.json({ error: "A base de dados está vazia ou não foi carregada corretamente." }, { status: 400 });
    }

    const datasAbertura = resolvidos.map((i) => (i.Opened ? new Date(i.Opened) : null)).filter((d): d is Date => !!d);
    const dataMax = datasAbertura.length ? new Date(Math.max(...datasAbertura.map((d) => d.getTime()))) : null;
    const dataMaxStr = dataMax ? dataMax.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Data não disponível";
    const dezDiasAtras = dataMax ? new Date(dataMax.getTime() - 10 * 86400000) : new Date();

    const recentes = resolvidos.filter((i) => i.Opened && new Date(i.Opened).getTime() >= dezDiasAtras.getTime());
    const resumoCategorias = topN(resolvidos.map((i) => i.Categoria), 10);
    const resumoSubcategorias = topN(recentes.map((i) => i.SubCategoria), 10);

    const systemPrompt = `Você é um Especialista em AMS (Application Management Services).
Sua missão é auxiliar a operação na gestão do projeto RadSync.

DADOS TÉCNICOS:
- Total de Tickets: ${resolvidos.length}
- Data da última atualização: ${dataMaxStr}
- Top 10 Categorias: ${JSON.stringify(resumoCategorias)}
- Movimentação nos últimos 10 dias (Subcategorias): ${JSON.stringify(resumoSubcategorias)}

REGRAS:
- Responda SEMPRE em português.
- Se pedirem ranking ou relatório, use Tabelas Markdown.
- Seja proativo: se o SLA estiver alto, sugira uma revisão na categoria afetada.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    const result = await model.generateContent(`${systemPrompt}\n\nPergunta: ${pergunta}`);
    const texto = result.response.text();

    if (!texto) {
      return NextResponse.json({ error: "A IA não conseguiu gerar uma resposta. Tente reformular." }, { status: 502 });
    }

    return NextResponse.json({ resposta: texto });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no processamento da resposta.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
