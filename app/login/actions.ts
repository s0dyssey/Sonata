"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NOT_CONFIGURED_MESSAGE, supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export type AuthState = {
  error?: string;
  notice?: string;
  // Echoed back so the form keeps what was typed after an error.
  values?: { email?: string; displayName?: string };
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password.", values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "That email and password don’t match an account."
        : error.code === "email_not_confirmed"
          ? "Confirm your email first. The link is in the message we sent when you signed up."
          : error.message;
    return { error: message, values: { email } };
  }

  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  const displayName = text(formData, "displayName");
  const next = safeNext(formData.get("next"));
  const values = { email, displayName };

  if (!displayName) return { error: "Choose a player name.", values };
  if (displayName.length > 30) return { error: "Player names can be up to 30 characters.", values };
  if (!email) return { error: "Enter your email.", values };
  if (password.length < 8) return { error: "Use a password with at least 8 characters.", values };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Copied into the players table by the database trigger in supabase/schema.sql.
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const message =
      error.code === "user_already_exists"
        ? "An account with that email already exists. Sign in instead."
        : error.code === "over_email_send_rate_limit"
          ? "Too many sign-up emails were sent just now. Wait a minute and try again."
          : error.message;
    return { error: message, values };
  }

  // With "Confirm email" switched on in Supabase there is no session yet.
  if (!data.session) {
    return {
      notice: `Check ${email} for a link to confirm your account, then sign in.`,
      values: { email },
    };
  }

  redirect(next);
}

export async function signInWithGoogle(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
  const next = safeNext(formData.get("next"));
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();

  // This doesn't sign anyone in yet. It returns Google's sign-in address; after
  // the player approves, Google sends them back to /auth/callback.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Google sign-in could not be started. Try again." };
  }

  redirect(data.url);
}

export async function signOut() {
  if (!supabaseConfigured) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
