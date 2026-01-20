import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "CyberShield Quiz Platform",
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
        {children}
      </body>
    </html>
  );
}
