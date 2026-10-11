export const navLinks = [
  { label: "Classical", href: "/classical" },
  { label: "Contemporary", href: "/contemporary" },
  { label: "Schedule", href: "/schedule" },
  { label: "Leaderboard", href: "/leaderboard" },
] as const;

export const footerLinks = [...navLinks, { label: "How it works", href: "/#how-it-works" }] as const;
