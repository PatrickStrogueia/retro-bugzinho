import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "../components/Header/Header";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-primary",
});

export const metadata: Metadata = {
  title: "Bugzinho - Retrospectiva Gamificada",
  description: "Uma retrospectiva imersiva para o time de QA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable}`}>
        <Header />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
