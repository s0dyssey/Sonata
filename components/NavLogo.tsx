import { LOGO_PATH, LOGO_VIEWBOX } from "./LogoMono";

/*
 * The logo mark, colored by the page it sits on. Its two stops read
 * --logo-from and --logo-to from the page's theme in globals.css:
 *   home and base   the logo's own two purples, brighter at the top right
 *   Classical       rouge (flat)
 *   Contemporary    navy blue (flat)
 */
export default function NavLogo({ className }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id="nav-logo-fill" x1="0.75" y1="0" x2="0.25" y2="1">
          <stop offset="0" style={{ stopColor: "var(--logo-from)" }} />
          <stop offset="0.6" style={{ stopColor: "var(--logo-to)" }} />
        </linearGradient>
      </defs>
      <path fillRule="evenodd" fill="url(#nav-logo-fill)" d={LOGO_PATH} />
    </svg>
  );
}
