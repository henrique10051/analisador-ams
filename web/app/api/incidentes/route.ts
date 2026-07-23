import { NextRequest, NextResponse } from "next/server";
import { carregarIncidentes, atualizarCamposIncidente } from "@/lib/repositorio-incidentes";
import { CAMPOS_EDITAVEIS } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const incidentes = await carregarIncidentes();
    return NextResponse.json({ incidentes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao carregar incidentes.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { number, campos } = body as { number: string; campos: Record<string, string> };
    if (!number || !campos) {
      return NextResponse.json({ error: "number e campos são obrigatórios." }, { status: 400 });
    }
    const camposValidos = Object.fromEntries(
      Object.entries(campos).filter(([k]) => (CAMPOS_EDITAVEIS as readonly string[]).includes(k))
    );
    await atualizarCamposIncidente(number, camposValidos);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar incidente.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
