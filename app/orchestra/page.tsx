import { permanentRedirect } from "next/navigation";

// Orchestra / Symphony was renamed Classical. This keeps old links working;
// the folder can be deleted once nothing links to /orchestra.
export default function OrchestraPage() {
  permanentRedirect("/classical");
}
