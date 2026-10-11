// Only allow redirects to paths inside this site ("/account", not "https://evil.example").
export function safeNext(value: unknown, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
