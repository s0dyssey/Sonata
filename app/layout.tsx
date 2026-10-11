import type { Metadata } from "next";
import { Jost, Plus_Jakarta_Sans, PT_Sans_Narrow } from "next/font/google";
import "./globals.css";

// The site's three typefaces. Where each one is used is set out in
// app/globals.css under "Type".

// Headings and big numbers. Variable font: every weight from 100 to 900, plus italics.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Nav links and small capital labels. Variable font: weights 200 to 800, plus italics.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Paragraph text. Comes in two weights only, regular and bold, and has no italic.
const ptSansNarrow = PT_Sans_Narrow({
  variable: "--font-pt-sans-narrow",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SONATA",
    template: "%s · SONATA",
  },
  description: "The competitive league for musicians.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${jost.variable} ${jakarta.variable} ${ptSansNarrow.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
