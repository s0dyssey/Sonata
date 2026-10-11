import type { Metadata } from "next";
import EnsemblePage from "@/components/EnsemblePage";

export const metadata: Metadata = {
  title: "Classical",
};

export default function ClassicalPage() {
  return <EnsemblePage type="classical" />;
}
