import type { Incidente } from "@/lib/types";
import SlaTmaBase from "@/components/tabs/SlaTmaBase";

export default function Sla({ incidentesResolvidos }: { incidentesResolvidos: Incidente[] }) {
  return (
    <SlaTmaBase
      incidentesResolvidos={incidentesResolvidos}
      campo="SLA - Dias (8 h)"
      eyebrow="02 · Cumprimento"
      titulo="SLA"
      unidade="d"
      corAccent="var(--color-copper)"
      slugArquivo="sla-ams"
    />
  );
}
