import * as XLSX from "xlsx";
import Papa from "papaparse";

export function parseArquivo(buffer: ArrayBuffer, nomeArquivo: string): Record<string, unknown>[] {
  const isCsv = nomeArquivo.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const texto = new TextDecoder("utf-8").decode(buffer);
    const resultado = Papa.parse<Record<string, unknown>>(texto, {
      header: true,
      skipEmptyLines: true,
    });
    return resultado.data;
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const primeiraAba = workbook.SheetNames[0];
  const sheet = workbook.Sheets[primeiraAba];
  return XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null });
}
