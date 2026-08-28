import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create your account to start building your persona.",
  alternates: { canonical: "/login" },
};
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
