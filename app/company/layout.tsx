import type { Metadata } from "next";
export const metadata: Metadata = { title: "Company Context", robots: { index: false } };
export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
