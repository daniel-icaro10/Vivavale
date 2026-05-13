import type { Metadata } from "next";
import { AnalyzeFlow } from "@/features/analyze/components/AnalyzeFlow";

export const metadata: Metadata = {
  title: "Análise de sintomas | VivaLeve",
  description:
    "Responda algumas perguntas simples e receba insights gentis sobre os seus sintomas.",
  robots: { index: true, follow: true },
};

export default function AnalyzePage() {
  return <AnalyzeFlow />;
}
