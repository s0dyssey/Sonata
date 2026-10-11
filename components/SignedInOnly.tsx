"use client";

import type { ReactNode } from "react";
import { useSignedIn } from "@/lib/supabase/use-signed-in";

/* Shows its children only to signed-in players. Signed-out visitors get
   nothing in its place. */
export default function SignedInOnly({ children }: { children: ReactNode }) {
  return useSignedIn() ? <>{children}</> : null;
}
