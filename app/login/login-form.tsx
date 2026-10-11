"use client";

import { useActionState, useState, type ComponentProps, type ReactNode } from "react";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

type Mode = "signup" | "signin";

const copy: Record<Mode, { title: string; lead: string; submit: string; busy: string; switchLead: string; switchTo: string }> = {
  signup: {
    title: "Create Your Account",
    lead: "Join an ensemble and play this season’s matches.",
    submit: "Create Account",
    busy: "Creating account…",
    switchLead: "Already have an account?",
    switchTo: "Sign in",
  },
  signin: {
    title: "Welcome Back",
    lead: "Sign in to get back to your seat.",
    submit: "Sign In",
    busy: "Signing in…",
    switchLead: "New to SONATA?",
    switchTo: "Create account",
  },
};

const buttonBase =
  "inline-flex h-12 w-full items-center font-label justify-center gap-3 rounded-lg text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [mode, setMode] = useState<Mode>("signup");
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, { error: initialError });
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [googleState, googleAction, openingGoogle] = useActionState<AuthState, FormData>(signInWithGoogle, {});

  const busy = signingUp || signingIn || openingGoogle;
  const state = mode === "signup" ? signUpState : signInState;
  const error = googleState.error ?? state.error;
  // Keep the email when switching between the two forms.
  const email = state.values?.email ?? signUpState.values?.email ?? signInState.values?.email ?? "";
  const text = copy[mode];

  return (
    <div className="mt-7">
      <h1 className="text-center font-label text-2xl font-semibold tracking-tight">{text.title}</h1>
      <p className="mt-1.5 text-center text-muted">{text.lead}</p>

      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-[#fbeaec] px-4 py-3 text-sm font-medium text-[#8f1d2c]">
          {error}
        </p>
      )}
      {!error && signUpState.notice && (
        <p role="status" className="mt-5 rounded-lg bg-tint px-4 py-3 text-sm text-ink">
          {signUpState.notice}
        </p>
      )}

      {/* key={mode} gives each form its own fresh fields */}
      <form key={mode} action={mode === "signup" ? signUpAction : signInAction} className="mt-6 flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />

        {mode === "signup" && (
          <Field
            id="displayName"
            name="displayName"
            label="Player name"
            type="text"
            required
            maxLength={30}
            autoComplete="nickname"
            defaultValue={signUpState.values?.displayName ?? ""}
            icon={<UserIcon />}
          />
        )}

        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          defaultValue={email}
          icon={<MailIcon />}
        />

        <Field
          id="password"
          name="password"
          label={mode === "signup" ? "Password (8 or more characters)" : "Password"}
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          icon={<LockIcon />}
        />

        <button type="submit" disabled={busy} className={`${buttonBase} mt-2 bg-brand text-white hover:bg-brand-strong`}>
          {signingUp || signingIn ? text.busy : text.submit}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-4 text-sm text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={googleAction} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <button type="submit" disabled={busy} className={`${buttonBase} border border-line bg-white text-ink hover:border-ink`}>
          <GoogleMark />
          {openingGoogle ? "Opening Google…" : "Continue with Google"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        {text.switchLead}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="rounded-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {text.switchTo}
        </button>
      </p>
    </div>
  );
}

/* One input with an icon inside it. The label is read out by screen readers
   and shown as the placeholder. */
function Field({ label, icon, id, ...props }: ComponentProps<"input"> & { label: string; icon: ReactNode }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
        {icon}
      </span>
      <input
        id={id}
        placeholder={label}
        className="block h-12 w-full rounded-lg border border-transparent bg-[#f3f1f6] pl-11 pr-4 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        {...props}
      />
    </div>
  );
}

const iconProps = { viewBox: "0 0 20 20", fill: "currentColor", className: "size-[18px]" } as const;

function UserIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v.4L10 10.3 2.5 5.9v-.4Z" />
      <path d="M2.5 8.2v6.3A1.5 1.5 0 0 0 4 16h12a1.5 1.5 0 0 0 1.5-1.5V8.2l-7 4.1a1 1 0 0 1-1 0l-7-4.1Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps}>
      <path
        fillRule="evenodd"
        d="M10 2a4 4 0 0 0-4 4v2H5.5A1.5 1.5 0 0 0 4 9.5v7A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 8H14V6a4 4 0 0 0-4-4Zm2 6V6a2 2 0 1 0-4 0v2h4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px] shrink-0">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
