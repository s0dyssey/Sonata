import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlayScreen from "@/components/play/PlayScreen";
import SiteShell from "@/components/SiteShell";
import { getPiece, pieces } from "@/lib/pieces";

type Params = Promise<{ piece: string }>;

// One page per piece in lib/pieces, built ahead of time.
export function generateStaticParams() {
  return pieces.map((piece) => ({ piece: piece.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const piece = getPiece((await params).piece);
  return { title: piece ? piece.title : "Piece not found" };
}

/* Signed-in players only: everything under /play is protected in
   lib/supabase/proxy.ts. */
export default async function PiecePage({ params }: { params: Params }) {
  const piece = getPiece((await params).piece);
  if (!piece) notFound();

  return (
    <SiteShell theme="base">
      <PlayScreen piece={piece} />
    </SiteShell>
  );
}
