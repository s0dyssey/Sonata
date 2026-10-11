import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

// Both files live in /public. Swap either one without touching the layout.
const BACKGROUND_SRC = "/sign-in-background.jpg";
const LOGO_SRC = "/sonata full logo sign in.png";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/* Full-screen background image with one white card in the middle. This page
   has no nav or footer; the logo and "Back to home" both lead back to /. */
export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center bg-[#2f2a47] px-4 py-20">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BACKGROUND_SRC})` }}
      />

      <Link
        href="/"
        className="absolute left-4 top-5 rounded-sm text-sm font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:left-8 sm:top-7"
      >
        Back to home
      </Link>

      <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 text-ink shadow-[0_30px_70px_-25px_rgb(15_8_35/0.7)] sm:px-10 sm:py-10">
        <Link
          href="/"
          aria-label="SONATA home"
          className="mx-auto block w-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <Image src={LOGO_SRC} alt="SONATA" width={1226} height={261} priority className="h-14 w-auto sm:h-16" />
        </Link>

        {/* The form reads ?next= from the address, so it streams in right after the page shell. */}
        <Suspense fallback={<div className="min-h-96" />}>
          <FormForThisVisit searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function FormForThisVisit({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const callbackError = params.error
    ? "That sign-in didn’t finish. The link may have expired or been used already. Try again."
    : undefined;

  return <LoginForm next={safeNext(params.next)} initialError={callbackError} />;
}
