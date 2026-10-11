import type { ReactNode } from "react";
import Footer from "./Footer";
import Nav from "./Nav";

export type Theme = "base" | "home" | "classical" | "contemporary";

type SiteShellProps = {
  theme?: Theme;
  children: ReactNode;
};

/* Wraps a page in the shared nav and footer and applies one token set
   (see globals.css) to everything inside, nav and footer included. */
export default function SiteShell({ theme = "base", children }: SiteShellProps) {
  return (
    <div data-theme={theme} className="flex min-h-svh flex-col bg-bg text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[3px] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-on-accent"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
