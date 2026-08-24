import type { Metadata } from "next";
export const metadata: Metadata = { title: "Founder Identity", robots: { index: false } };
export default function IdentityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
