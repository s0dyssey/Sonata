import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SiteShell from "@/components/SiteShell";
import { Button, ButtonLink, Container, Headline } from "@/components/ui";
import { signOut } from "@/app/login/actions";
import { instrumentLabel } from "@/lib/instruments";
import { globalRankLabel, instrumentLevelLabel } from "@/lib/levels";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
};

// Signed-in players land here. It shows their row from the players table,
// which proves sign-in and the database are connected.
export default function AccountPage() {
  return (
    <SiteShell theme="base">
      <Container className="flex-1 py-16 sm:py-24">
        {/* Reads the session, so it streams in after the page shell. */}
        <Suspense fallback={<p className="text-lg text-muted">Loading your seat…</p>}>
          <Seat />
        </Suspense>
      </Container>
    </SiteShell>
  );
}

async function Seat() {
  if (!supabaseConfigured) redirect("/login");

  const supabase = await createClient();

  // proxy.ts already redirects signed-out visitors, but check again here:
  // this is the code that actually reads player data.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login?next=/account");

  type Player = {
    display_name: string;
    instrument: string | null;
    instrument_level?: string | null;
    global_rank?: string | null;
  };

  const readPlayer = (columns: string) =>
    supabase.from("players").select(columns).eq("id", claims.sub).maybeSingle<Player>();

  let { data: player, error } = await readPlayer("display_name, instrument, instrument_level, global_rank");

  // 42703 = "column does not exist": the level columns are added by the newest
  // supabase/schema.sql. Until that has been run, show the defaults instead.
  if (error?.code === "42703") {
    ({ data: player, error } = await readPlayer("display_name, instrument"));
  }

  const signOutButton = (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="md">
        Sign out
      </Button>
    </form>
  );

  if (!player) {
    return (
      <div className="flex max-w-2xl flex-col items-start gap-6">
        <Headline as="h1" size="xl">
          You&rsquo;re signed in
        </Headline>
        <p role="alert" className="border-l-2 border-rule bg-surface px-4 py-3 font-medium text-accent">
          Sign-in works, but your player row wasn&rsquo;t found. Run supabase/schema.sql in the Supabase SQL Editor,
          then sign out and create a new account.
          {error ? ` Supabase said: ${error.message}` : ""}
        </p>
        {signOutButton}
      </div>
    );
  }

  const provider = claims.app_metadata?.provider;
  const signedInWith = provider === "google" ? "Google" : "Email and password";

  const details = [
    ["Player name", player.display_name],
    ["Instrument", instrumentLabel(player.instrument)],
    ["Instrument level", instrumentLevelLabel(player.instrument_level)],
    ["Global ranking", globalRankLabel(player.global_rank)],
    ["Signed in with", signedInWith],
    ["Email", claims.email || "None"],
  ];

  return (
    <div className="flex flex-col items-start gap-8">
      <div className="flex flex-col gap-5">
        <Headline as="h1" size="xl">
          Welcome, {player.display_name}
        </Headline>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          You&rsquo;re signed in and your seat is saved. Run a sound check to make sure SONATA can hear you.
        </p>
        <ButtonLink href="/play" className="mt-2 w-fit">
          Sound check
        </ButtonLink>
      </div>

      <dl className="grid w-full max-w-xl grid-cols-[auto_1fr] gap-x-10 border-t border-line">
        {details.map(([term, value]) => (
          <div key={term} className="col-span-2 grid grid-cols-subgrid items-baseline border-b border-line py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{term}</dt>
            <dd className="text-lg">{value}</dd>
          </div>
        ))}
      </dl>

      {signOutButton}
    </div>
  );
}
