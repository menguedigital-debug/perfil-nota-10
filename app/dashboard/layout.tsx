"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, LayoutDashboard, History, Users, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const navItems = [
  { title: "Visão Geral", url: "/dashboard", icon: LayoutDashboard },
  { title: "Histórico", url: "/dashboard/historico", icon: History },
  { title: "Clientes", url: "/dashboard/clientes", icon: Users },
  { title: "Posts", url: "/dashboard/posts", icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`sticky top-0 flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-sm font-bold text-foreground">Nota 10</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4">
          {navItems.map(item => (
            <Link key={item.title} href={item.url}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === item.url
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              }`}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>

        {!collapsed && (
          <div className="border-t border-border p-4">
            <Link href="/" className="text-xs text-primary hover:underline">← Voltar ao início</Link>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
