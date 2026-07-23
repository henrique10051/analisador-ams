import { NextRequest, NextResponse } from "next/server";
import { parseArquivo } from "@/lib/parse-arquivo";
import { processarBase } from "@/lib/processador-dados";
import { upsertIncidentes, carregarDiasNaoUteis } from "@/lib/repositorio-incidentes";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const linhas = parseArquivo(buffer, file.name);

    const diasExtra = await carregarDiasNaoUteis();
    const listaDiasExtra = diasExtra.map((d) => d.data);

    const incidentes = processarBase(linhas, listaDiasExtra);
    const qtd = await upsertIncidentes(incidentes);

    return NextResponse.json({ qtd });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido ao processar arquivo.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
