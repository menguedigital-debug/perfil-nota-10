"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";

export function AppHeader() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Perfil Nota <span className="text-primary">10</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Início
          </Link>
          {status === "authenticated" && (
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Dashboard
            </Link>
          )}
          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden lg:block">{session.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sair
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:glow-indigo"
            >
              Entrar
            </button>
          )}
        </nav>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link href="/" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Início</Link>
            {status === "authenticated" && (
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            )}
            {status === "authenticated" ? (
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-sm font-medium text-muted-foreground">Sair</button>
            ) : (
              <button onClick={() => signIn("google")} className="text-left text-sm font-medium text-primary">Entrar</button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
