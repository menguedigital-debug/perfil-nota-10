import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Perfil Nota 10",
  description: "Análise de perfis Google Meu Negócio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
