import type { Incidente } from "@/lib/types";
import SlaTmaBase from "@/components/tabs/SlaTmaBase";

export default function Tma({ incidentesResolvidos }: { incidentesResolvidos: Incidente[] }) {
  return (
    <SlaTmaBase
      incidentesResolvidos={incidentesResolvidos}
      campo="TMA - Dias corridos"
      eyebrow="03 · Tempo de atendimento"
      titulo="TMA"
      unidade="dias"
      corAccent="var(--color-circuit)"
      slugArquivo="tma-ams"
    />
  );
}
