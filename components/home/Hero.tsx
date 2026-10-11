import Image from "next/image";
import { ButtonLink } from "../ui";
import "./hero-background.css";

// Both files live in /public. Swap either one without touching the layout.
const BACKGROUND_SRC = "/hero-background.jpg";
// The SONATA wordmark, white on a clear background.
const WORDMARK_SRC = "/SONATA for hero.png";

export default function Hero() {
  return (
    <section
      aria-label="Introduction"
      className="relative isolate flex min-h-[calc(100svh-var(--nav-h))] flex-col items-center justify-center overflow-hidden bg-hero-bg px-4 py-16"
    >
      {/* The glowing ring, filling the panel and centered behind the title.
          The glow layers on top of it are what move; see hero-background.css. */}
      <div aria-hidden="true" className="hero-backdrop">
        <div className="hero-scene" style={{ backgroundImage: `url(${BACKGROUND_SRC})` }}>
          <div className="hero-pulse" />
          <div className="hero-sweep" />
          <div className="hero-star hero-star-a" />
          <div className="hero-star hero-star-b" />
          <div className="hero-star hero-star-c" />
          <div className="hero-star hero-star-d" />
        </div>
      </div>

      <h1 className="w-[clamp(15rem,40vw,36rem)]">
        <Image src={WORDMARK_SRC} alt="SONATA" width={1598} height={349} priority className="h-auto w-full select-none" />
      </h1>

      <p className="mt-7 text-center text-[length:clamp(13px,1.25vw,18px)] font-medium uppercase tracking-[0.22em] text-balance text-hero-ink sm:tracking-[0.3em]">
        The competitive league for musicians
      </p>

      <ButtonLink href="/login" variant="light" className="mt-8">
        Play now
      </ButtonLink>
    </section>
  );
}
