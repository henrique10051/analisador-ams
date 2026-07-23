import { NextRequest, NextResponse } from "next/server";
import {
  carregarDiasNaoUteis,
  adicionarDiaNaoUtil,
  removerDiaNaoUtil,
} from "@/lib/repositorio-incidentes";

export const runtime = "nodejs";

export async function GET() {
  try {
    const dias = await carregarDiasNaoUteis();
    return NextResponse.json({ dias });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao carregar dias não úteis.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data, motivo } = (await req.json()) as { data: string; motivo?: string };
    if (!data) {
      return NextResponse.json({ error: "Campo 'data' é obrigatório." }, { status: 400 });
    }
    await adicionarDiaNaoUtil(data, motivo ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao adicionar dia não útil.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Parâmetro 'id' é obrigatório." }, { status: 400 });
    }
    await removerDiaNaoUtil(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao remover dia não útil.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
