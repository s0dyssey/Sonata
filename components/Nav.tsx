"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSignedIn } from "@/lib/supabase/use-signed-in";
import NavLogo from "./NavLogo";
import { navLinks } from "./nav-links";
import { Container, cx } from "./ui";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";

/* The same solid white bar on every page. Links and "Sign in" use the logo's
   darker purple (--brand) everywhere; the logo itself takes the color of the
   page it is on (see NavLogo). */
export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const signedIn = useSignedIn();
  const account = signedIn ? { label: "Account", href: "/account" } : { label: "Sign in", href: "/login" };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 h-(--nav-h) border-b border-brand/15 bg-white">
      <Container className="flex h-full items-center justify-between gap-6">
        <Link href="/" onClick={closeMenu} aria-label="SONATA" className={cx("shrink-0 rounded-sm", focusRing)}>
          <NavLogo className="h-10 w-auto" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "relative rounded-sm py-2 text-sm font-medium uppercase tracking-[0.16em] text-brand",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-current after:transition-transform",
                      active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                      focusRing,
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={account.href}
            className={cx(
              "hidden h-10 items-center justify-center whitespace-nowrap rounded-[3px] border border-brand px-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand transition-colors duration-250 hover:bg-brand hover:text-white md:inline-flex",
              focusRing,
            )}
          >
            {account.label}
          </Link>
          <button
            type="button"
            className={cx("inline-flex size-10 items-center justify-center rounded-[3px] text-brand md:hidden", focusRing)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="relative block h-3.5 w-6">
              <span className={cx("absolute left-0 block h-0.5 w-6 bg-current transition-transform", menuOpen ? "top-1.5 rotate-45" : "top-0")} />
              <span className={cx("absolute left-0 top-1.5 block h-0.5 w-6 bg-current transition-opacity", menuOpen && "opacity-0")} />
              <span className={cx("absolute left-0 block h-0.5 w-6 bg-current transition-transform", menuOpen ? "top-1.5 -rotate-45" : "top-3")} />
            </span>
          </button>
        </div>
      </Container>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-full border-b border-brand/15 bg-white shadow-[0_24px_48px_-24px_rgb(0_0_0/0.25)] md:hidden"
      >
        <Container className="flex flex-col gap-1 py-4">
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="block border-b border-brand/15 py-4 text-base font-semibold uppercase tracking-[0.16em] text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href={account.href}
            onClick={closeMenu}
            className={cx(
              "mt-4 inline-flex h-14 w-full items-center justify-center rounded-[3px] bg-brand px-10 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-strong",
              focusRing,
            )}
          >
            {account.label}
          </Link>
        </Container>
      </div>
    </header>
  );
}
