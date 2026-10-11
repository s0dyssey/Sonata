"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";
import { supabaseConfigured } from "./config";

// True once a player is signed in. For showing and hiding things only: pages
// that need a signed-in player check again on the server.
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const { data } = createClient().auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return signedIn;
}
