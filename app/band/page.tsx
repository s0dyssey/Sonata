import { permanentRedirect } from "next/navigation";

// Band was renamed Contemporary. This keeps old links working; the folder can
// be deleted once nothing links to /band.
export default function BandPage() {
  permanentRedirect("/contemporary");
}
