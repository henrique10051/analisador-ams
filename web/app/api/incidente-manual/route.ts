import { NextRequest, NextResponse } from "next/server";
import { processarBase } from "@/lib/processador-dados";
import { upsertIncidentes, carregarDiasNaoUteis } from "@/lib/repositorio-incidentes";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const numero = String(body["Number"] ?? "").trim();
    if (!numero) {
      return NextResponse.json({ error: "Número do chamado é obrigatório." }, { status: 400 });
    }

    const linhaBruta: Record<string, unknown> = {
      Number: numero,
      Service: body["Service"] ?? "",
      Opened: body["Opened"] ?? "",
      Resolved: body["Resolved"] ?? "",
      "Short description": body["Short description"] ?? "",
      State: body["State"] ?? "",
      Priority: body["Priority"] ?? "",
      "Assignment group": body["Assignment group"] ?? "",
      "ICT Service": body["ICT Service"] ?? "",
      "Assigned to": body["Assigned to"] ?? "",
      "Close code": body["Close code"] ?? "",
      "Close notes": body["Close notes"] ?? "",
      "Reopen count": body["Reopen count"] ?? 0,
    };

    const diasExtra = await carregarDiasNaoUteis();
    const listaDiasExtra = diasExtra.map((d) => d.data);

    const [incidente] = processarBase([linhaBruta], listaDiasExtra);
    await upsertIncidentes([incidente]);

    return NextResponse.json({ incidente });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao cadastrar chamado.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
