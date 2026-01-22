import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { AuthStatus } from "@/components/auth/AuthStatus";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "LandofCyber Quiz Platform",
  description: "Interactive cyber security quizzes with community content.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body className="min-h-screen bg-cyber-bg text-white antialiased">
        <header className="px-6 py-6 md:px-12">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              LandofCyber
            </span>
            <AuthStatus />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
