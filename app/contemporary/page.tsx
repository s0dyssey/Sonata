import type { Metadata } from "next";
import EnsemblePage from "@/components/EnsemblePage";

export const metadata: Metadata = {
  title: "Contemporary",
};

export default function ContemporaryPage() {
  return <EnsemblePage type="contemporary" />;
}
