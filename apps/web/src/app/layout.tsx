import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Relief Teaching Marketplace (Phase 1)",
  description: "Phase 1 map discovery flow for schools"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-white antialiased selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}


