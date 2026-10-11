import { decayAndDestruction } from "./decay-and-destruction";
import type { PieceStage } from "./types";

export * from "./types";
export { decayAndDestruction };

// Every piece the site can play. Add new ones here.
export const pieces = [decayAndDestruction];

/* The pieces on one stage. Contemporary has none yet, so nothing there offers a Play button. */
export function getPieces(stage: PieceStage) {
  return pieces.filter((piece) => piece.stage === stage);
}

export function getPiece(id: string) {
  return pieces.find((piece) => piece.id === id);
}
