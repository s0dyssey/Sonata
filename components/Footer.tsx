import Link from "next/link";
import LogoMono from "./LogoMono";
import { footerLinks } from "./nav-links";
import { Container } from "./ui";

export default function Footer() {
  return (
    <footer className="bg-deep text-on-deep">
      <Container className="flex flex-col gap-10 py-14 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          aria-label="SONATA"
          className="w-fit rounded-sm text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-deep"
        >
          <LogoMono className="h-12 w-auto" />
        </Link>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-8 gap-y-4">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium uppercase tracking-[0.16em] text-on-deep/80 transition-colors hover:text-on-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-on-deep/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-deep-muted sm:flex-row sm:justify-between">
          <p>&copy; 2026 SONATA. All rights reserved.</p>
          <p>The competitive virtual league for instrumentalists.</p>
        </Container>
      </div>
    </footer>
  );
}
